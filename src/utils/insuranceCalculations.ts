import { supabase } from '@/integrations/supabase/client';

export interface InsuranceMetrics {
  totalCertificates: number;
  activeCertificates: number;
  expiringCertificates: number;
  expiredCertificates: number;
  complianceRate: number;
  averageCoverageAmount: number;
  topInsuranceCompanies: Array<{
    company: string;
    count: number;
    totalCoverage: number;
  }>;
}

export interface InsuranceRiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  expirationAlert: boolean;
  coverageAdequacy: 'insufficient' | 'adequate' | 'excessive';
}

export const calculateInsuranceMetrics = async (
  startDate?: Date,
  endDate?: Date
): Promise<InsuranceMetrics> => {
  let query = supabase.from('insurance_certificates').select('*');

  if (startDate && endDate) {
    query = query
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
  }

  const { data: certificates } = await query;

  if (!certificates) {
    return {
      totalCertificates: 0,
      activeCertificates: 0,
      expiringCertificates: 0,
      expiredCertificates: 0,
      complianceRate: 0,
      averageCoverageAmount: 0,
      topInsuranceCompanies: []
    };
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const activeCertificates = certificates.filter(cert => 
    cert.status === 'active' && new Date(cert.valid_until) > now
  );

  const expiringCertificates = certificates.filter(cert =>
    cert.status === 'active' && 
    new Date(cert.valid_until) > now &&
    new Date(cert.valid_until) <= thirtyDaysFromNow
  );

  const expiredCertificates = certificates.filter(cert =>
    new Date(cert.valid_until) <= now
  );

  const totalCoverage = certificates.reduce((sum, cert) => 
    sum + (cert.coverage_amount || 0), 0
  );

  const averageCoverageAmount = certificates.length > 0 
    ? totalCoverage / certificates.length 
    : 0;

  const complianceRate = certificates.length > 0
    ? (activeCertificates.length / certificates.length) * 100
    : 0;

  // Group by insurance company
  const companyStats = certificates.reduce((acc, cert) => {
    const company = cert.insurance_company;
    if (!acc[company]) {
      acc[company] = { count: 0, totalCoverage: 0 };
    }
    acc[company].count++;
    acc[company].totalCoverage += cert.coverage_amount || 0;
    return acc;
  }, {} as Record<string, { count: number; totalCoverage: number }>);

  const topInsuranceCompanies = Object.entries(companyStats)
    .map(([company, stats]) => ({
      company,
      count: stats.count,
      totalCoverage: stats.totalCoverage
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalCertificates: certificates.length,
    activeCertificates: activeCertificates.length,
    expiringCertificates: expiringCertificates.length,
    expiredCertificates: expiredCertificates.length,
    complianceRate: Math.round(complianceRate * 100) / 100,
    averageCoverageAmount: Math.round(averageCoverageAmount),
    topInsuranceCompanies
  };
};

export const assessInsuranceRisk = async (
  projectId: string,
  contractorId: string
): Promise<InsuranceRiskAssessment> => {
  const riskFactors: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let expirationAlert = false;
  let coverageAdequacy: 'insufficient' | 'adequate' | 'excessive' = 'adequate';

  // Get project details
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  // Get insurance certificates
  const { data: certificates } = await supabase
    .from('insurance_certificates')
    .select('*')
    .eq('project_id', projectId)
    .eq('contractor_id', contractorId);

  if (!certificates || certificates.length === 0) {
    return {
      riskLevel: 'critical',
      riskFactors: ['Aucune assurance trouvée'],
      recommendations: ['Exiger un certificat d\'assurance valide'],
      expirationAlert: true,
      coverageAdequacy: 'insufficient'
    };
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  // Check expiration dates
  certificates.forEach(cert => {
    const expiryDate = new Date(cert.valid_until);
    
    if (expiryDate <= now) {
      riskFactors.push(`Assurance ${cert.coverage_type} expirée`);
      riskLevel = 'critical';
      expirationAlert = true;
      recommendations.push(`Renouveler l'assurance ${cert.coverage_type}`);
    } else if (expiryDate <= thirtyDaysFromNow) {
      riskFactors.push(`Assurance ${cert.coverage_type} expire dans moins de 30 jours`);
      if (riskLevel === 'low') riskLevel = 'medium';
      expirationAlert = true;
      recommendations.push(`Planifier le renouvellement de l'assurance ${cert.coverage_type}`);
    }
  });

  // Check coverage adequacy
  if (project) {
    const projectBudget = project.budget || 0;
    const totalCoverage = certificates.reduce((sum, cert) => 
      sum + (cert.coverage_amount || 0), 0
    );

    const coverageRatio = projectBudget > 0 ? totalCoverage / projectBudget : 0;

    if (coverageRatio < 0.5) {
      coverageAdequacy = 'insufficient';
      riskFactors.push('Couverture d\'assurance insuffisante par rapport au budget');
      if (riskLevel === 'low') riskLevel = 'medium';
      recommendations.push('Augmenter la couverture d\'assurance');
    } else if (coverageRatio > 2) {
      coverageAdequacy = 'excessive';
      riskFactors.push('Couverture d\'assurance peut-être excessive');
      recommendations.push('Réviser le niveau de couverture nécessaire');
    }
  }

  // Check required coverage types
  const requiredTypes = ['responsabilite_civile', 'decennale'];
  const availableTypes = certificates.map(cert => cert.coverage_type);
  const missingTypes = requiredTypes.filter(type => !availableTypes.includes(type));

  if (missingTypes.length > 0) {
    riskFactors.push(`Types d'assurance manquants: ${missingTypes.join(', ')}`);
    if (riskLevel === 'low') riskLevel = 'high';
    recommendations.push(`Obtenir les assurances manquantes: ${missingTypes.join(', ')}`);
  }

  // Adjust risk level based on number of factors
  if (riskFactors.length === 0) {
    riskLevel = 'low';
  } else if (riskFactors.length >= 3) {
    // Only upgrade to high if not already critical
    if (riskLevel === 'low' || riskLevel === 'medium') {
      riskLevel = 'high';
    }
  }

  return {
    riskLevel,
    riskFactors,
    recommendations,
    expirationAlert,
    coverageAdequacy
  };
};

export const calculateInsuranceCoverage = (
  projectType: string,
  projectBudget: number,
  contractorSize: 'small' | 'medium' | 'large'
): {
  recommendedCoverage: Record<string, number>;
  minimumCoverage: Record<string, number>;
  totalRecommended: number;
} => {
  const baseCoverageRates = {
    responsabilite_civile: 0.1, // 10% of project budget
    decennale: 0.15, // 15% of project budget
    vehicules: 0.02, // 2% of project budget
    materiel: 0.05, // 5% of project budget
    tous_risques: 0.08 // 8% of project budget
  };

  // Adjust rates based on project type
  const typeMultipliers = {
    'construction': 1.2,
    'infrastructure': 1.5,
    'renovation': 0.8,
    'maintenance': 0.6,
    'default': 1.0
  };

  const typeMultiplier = typeMultipliers[projectType as keyof typeof typeMultipliers] || typeMultipliers.default;

  // Adjust rates based on contractor size
  const sizeMultipliers = {
    small: 0.8,
    medium: 1.0,
    large: 1.2
  };

  const sizeMultiplier = sizeMultipliers[contractorSize];

  const recommendedCoverage: Record<string, number> = {};
  const minimumCoverage: Record<string, number> = {};

  Object.entries(baseCoverageRates).forEach(([type, rate]) => {
    const adjustedRate = rate * typeMultiplier * sizeMultiplier;
    recommendedCoverage[type] = Math.round(projectBudget * adjustedRate);
    minimumCoverage[type] = Math.round(projectBudget * adjustedRate * 0.7); // 70% of recommended
  });

  const totalRecommended = Object.values(recommendedCoverage).reduce((sum, amount) => sum + amount, 0);

  return {
    recommendedCoverage,
    minimumCoverage,
    totalRecommended
  };
};