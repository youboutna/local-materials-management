// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface TenderReportData {
  tender: any;
  estimates?: any[];
  documents?: any[];
  suppliers?: any[];
  timeline?: TenderTimelineEvent[];
  evaluation?: TenderEvaluation;
}

export interface TenderTimelineEvent {
  date: string;
  event: string;
  status: string;
  description?: string;
}

export interface TenderEvaluation {
  totalBids: number;
  averageBid: number;
  lowestBid: number;
  highestBid: number;
  recommendedBid?: any;
  savings: number;
  evaluationScore: number;
}

export interface TenderMetrics {
  totalTenders: number;
  activeTenders: number;
  completedTenders: number;
  averageTimeToCompletion: number;
  successRate: number;
  totalValue: number;
}

export class TenderReportingService {
  
  /**
   * Fetch comprehensive tender data for reporting
   */
  static async fetchTenderReportData(tenderId: string): Promise<TenderReportData> {
    try {
      const [
        tenderResult,
        estimatesResult,
        documentsResult,
        suppliersResult
      ] = await Promise.all([
        supabase
          .from('tenders')
          .select('*')
          .eq('id', tenderId)
          .single(),
        supabase
          .from('tender_estimates')
          .select(`
            *,
            suppliers (
              id,
              name,
              email,
              phone,
              category
            )
          `)
          .eq('tender_id', tenderId),
        supabase
          .from('documents')
          .select('*')
          .eq('tender_id', tenderId),
        supabase
          .from('tender_suppliers')
          .select(`
            *,
            suppliers (
              id,
              name,
              email,
              phone,
              category,
              is_active
            )
          `)
          .eq('tender_id', tenderId)
      ]);

      const tender = tenderResult.data;
      const estimates = estimatesResult.data || [];
      const documents = documentsResult.data || [];
      const suppliers = suppliersResult.data?.map(ts => ts.suppliers) || [];

      // Generate timeline
      const timeline = this.generateTenderTimeline(tender);
      
      // Calculate evaluation metrics
      const evaluation = this.calculateTenderEvaluation(estimates, tender);

      return {
        tender,
        estimates,
        documents,
        suppliers,
        timeline,
        evaluation
      };
    } catch (error) {
      console.error('Error fetching tender report data:', error);
      throw error;
    }
  }

  /**
   * Calculate tender metrics for overview
   */
  static async calculateTenderMetrics(): Promise<TenderMetrics> {
    try {
      const { data: tenders } = await supabase
        .from('tenders')
        .select('*');

      if (!tenders || tenders.length === 0) {
        return {
          totalTenders: 0,
          activeTenders: 0,
          completedTenders: 0,
          averageTimeToCompletion: 0,
          successRate: 0,
          totalValue: 0
        };
      }

      const totalTenders = tenders.length;
      const activeTenders = tenders.filter(t => 
        t.status === 'open' || t.status === 'evaluation' || t.status === 'published'
      ).length;
      const completedTenders = tenders.filter(t => 
        t.status === 'awarded' || t.status === 'closed'
      ).length;

      // Calculate average time to completion
      const completedWithDates = tenders.filter(t => 
        t.status === 'awarded' && t.publication_date && t.attribution_date
      );
      
        const totalDays = completedWithDates.reduce((sum, tender) => {
        return sum + differenceInDays(
          new Date(tender.attribution_date!),
          new Date(tender.publication_date!)
        );
      }, 0);

      const averageTimeToCompletion = completedWithDates.length > 0 
        ? totalDays / completedWithDates.length 
        : 0;

      // Calculate success rate (awarded vs published)
      const publishedTenders = tenders.filter(t => t.publication_date).length;
      const awardedTenders = tenders.filter(t => t.status === 'awarded').length;
      const successRate = publishedTenders > 0 ? (awardedTenders / publishedTenders) * 100 : 0;

      // Calculate total value
      const totalValue = tenders.reduce((sum, tender) => {
        const budgetMax = tender.budget_max || 0;
        const budgetMin = tender.budget_min || 0;
        return sum + ((budgetMax + budgetMin) / 2);
      }, 0);

      return {
        totalTenders,
        activeTenders,
        completedTenders,
        averageTimeToCompletion,
        successRate,
        totalValue
      };
    } catch (error) {
      console.error('Error calculating tender metrics:', error);
      return {
        totalTenders: 0,
        activeTenders: 0,
        completedTenders: 0,
        averageTimeToCompletion: 0,
        successRate: 0,
        totalValue: 0
      };
    }
  }

  /**
   * Generate tender timeline based on tender data
   */
  static generateTenderTimeline(tender: any): TenderTimelineEvent[] {
    const timeline: TenderTimelineEvent[] = [];

    if (tender.created_at) {
      timeline.push({
        date: format(new Date(tender.created_at), 'dd/MM/yyyy', { locale: fr }),
        event: 'Création',
        status: 'completed',
        description: 'Création de l\'appel d\'offres'
      });
    }

    if (tender.publication_date) {
      timeline.push({
        date: format(new Date(tender.publication_date), 'dd/MM/yyyy', { locale: fr }),
        event: 'Publication',
        status: 'completed',
        description: 'Publication de l\'appel d\'offres'
      });
    }

    if (tender.deadline_date) {
      const isDeadlinePassed = new Date() > new Date(tender.deadline_date);
      timeline.push({
        date: format(new Date(tender.deadline_date), 'dd/MM/yyyy', { locale: fr }),
        event: 'Date limite',
        status: isDeadlinePassed ? 'completed' : 'pending',
        description: 'Date limite de soumission des offres'
      });
    }

    if (tender.attribution_date) {
      timeline.push({
        date: format(new Date(tender.attribution_date), 'dd/MM/yyyy', { locale: fr }),
        event: 'Attribution',
        status: 'completed',
        description: 'Attribution du marché'
      });
    }

    return timeline.sort((a, b) => 
      new Date(a.date.split('/').reverse().join('-')).getTime() - 
      new Date(b.date.split('/').reverse().join('-')).getTime()
    );
  }

  /**
   * Calculate tender evaluation metrics
   */
  static calculateTenderEvaluation(estimates: any[], tender: any): TenderEvaluation {
    if (!estimates || estimates.length === 0) {
      return {
        totalBids: 0,
        averageBid: 0,
        lowestBid: 0,
        highestBid: 0,
        savings: 0,
        evaluationScore: 0
      };
    }

    const validEstimates = estimates.filter(e => e.final_total && e.final_total > 0);
    
    if (validEstimates.length === 0) {
      return {
        totalBids: estimates.length,
        averageBid: 0,
        lowestBid: 0,
        highestBid: 0,
        savings: 0,
        evaluationScore: 0
      };
    }

    const bids = validEstimates.map(e => e.final_total);
    const totalBids = validEstimates.length;
    const averageBid = bids.reduce((sum, bid) => sum + bid, 0) / totalBids;
    const lowestBid = Math.min(...bids);
    const highestBid = Math.max(...bids);
    
    // Find recommended bid (lowest bid from active supplier)
    const recommendedBid = validEstimates
      .filter(e => e.suppliers?.is_active !== false)
      .reduce((min, current) => 
        current.final_total < min.final_total ? current : min
      );

    // Calculate savings compared to budget
    const budgetEstimate = (tender.budget_max + tender.budget_min) / 2;
    const savings = budgetEstimate > 0 ? ((budgetEstimate - lowestBid) / budgetEstimate) * 100 : 0;

    // Calculate evaluation score based on bid distribution and savings
    let evaluationScore = 0;
    if (totalBids > 0) {
      evaluationScore += Math.min(totalBids * 10, 40); // Points for number of bids
      evaluationScore += Math.min(savings, 30); // Points for savings
      evaluationScore += Math.min((highestBid - lowestBid) / averageBid * 20, 30); // Points for bid variance
    }

    return {
      totalBids,
      averageBid,
      lowestBid,
      highestBid,
      recommendedBid,
      savings: Math.max(0, savings),
      evaluationScore: Math.min(100, evaluationScore)
    };
  }

  /**
   * Generate tender status recommendations
   */
  static generateTenderRecommendations(tender: any, evaluation: TenderEvaluation): string[] {
    const recommendations: string[] = [];

    if (!tender) return recommendations;

    switch (tender.status) {
      case 'draft':
        recommendations.push(
          'Finaliser les spécifications techniques',
          'Définir les critères d\'évaluation',
          'Préparer les documents d\'appel d\'offres',
          'Planifier la publication'
        );
        break;

      case 'published':
      case 'open':
        const daysUntilDeadline = tender.deadline_date 
          ? differenceInDays(new Date(tender.deadline_date), new Date())
          : 0;
        
        if (daysUntilDeadline < 7) {
          recommendations.push('Date limite proche - rappeler aux fournisseurs');
        }
        
        recommendations.push(
          'Promouvoir l\'appel d\'offres auprès des fournisseurs qualifiés',
          'Répondre aux questions des soumissionnaires',
          'Surveiller les soumissions reçues'
        );
        break;

      case 'evaluation':
        if (evaluation.totalBids === 0) {
          recommendations.push('Aucune offre reçue - envisager une republication');
        } else if (evaluation.totalBids < 3) {
          recommendations.push('Peu d\'offres reçues - élargir la recherche de fournisseurs');
        }
        
        recommendations.push(
          'Évaluer toutes les offres selon les critères définis',
          'Vérifier la conformité technique et financière',
          'Préparer le rapport d\'évaluation'
        );
        break;

      case 'awarded':
        recommendations.push(
          'Notifier tous les soumissionnaires du résultat',
          'Préparer le contrat avec l\'attributaire',
          'Archiver la documentation d\'appel d\'offres'
        );
        break;

      case 'closed':
        recommendations.push(
          'Analyser les retours d\'expérience',
          'Documenter les leçons apprises',
          'Mettre à jour les procédures si nécessaire'
        );
        break;
    }

    // Add evaluation-based recommendations
    if (evaluation.savings > 20) {
      recommendations.push('Excellentes économies réalisées - analyser les facteurs de succès');
    } else if (evaluation.savings < 5) {
      recommendations.push('Économies limitées - revoir la stratégie d\'appel d\'offres');
    }

    if (evaluation.totalBids > 5) {
      recommendations.push('Forte concurrence - excellent résultat');
    }

    return recommendations;
  }
}