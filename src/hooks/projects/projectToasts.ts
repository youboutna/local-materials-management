
import { toast } from '@/hooks/use-toast';

export const projectToasts = {
  connectionError: () => {
    toast({
      title: "Erreur de connexion à la base de données",
      description: "Impossible de se connecter à la base de données. Veuillez vérifier vos paramètres de connexion.",
      variant: "destructive",
    });
  },
  
  createSuccess: (projectTitle: string) => {
    toast({
      title: "Projet créé",
      description: `Le projet "${projectTitle}" a été créé avec succès.`,
    });
  },
  
  createError: () => {
    toast({
      title: "Erreur",
      description: "Impossible de créer le projet. Veuillez réessayer.",
      variant: "destructive",
    });
  },
  
  updateSuccess: (projectTitle: string) => {
    toast({
      title: "Projet mis à jour",
      description: `Le projet "${projectTitle}" a été mis à jour avec succès.`,
    });
  },
  
  updateError: () => {
    toast({
      title: "Erreur",
      description: "Impossible de mettre à jour le projet. Veuillez réessayer.",
      variant: "destructive",
    });
  },
  
  deleteSuccess: () => {
    toast({
      title: "Projet supprimé",
      description: "Le projet a été supprimé avec succès.",
    });
  },
  
  deleteError: () => {
    toast({
      title: "Erreur",
      description: "Impossible de supprimer le projet. Veuillez réessayer.",
      variant: "destructive",
    });
  },
  
  fetchError: () => {
    toast({
      title: "Erreur",
      description: "Impossible de récupérer les projets. Veuillez réessayer.",
      variant: "destructive",
    });
  },

  databaseNotInitialized: () => {
    toast({
      title: "Base de données non initialisée",
      description: "Veuillez configurer et initialiser la connexion à la base de données.",
      variant: "destructive",
    });
  }
};

/**
 * Generic entity toast factory — usage:
 *   const t = entityToasts('jalon');
 *   t.updateSuccess(); t.updateError();
 * Évite la duplication de variantes par entité (milestones, paiements, tenders, etc.).
 */
export const entityToasts = (entityLabel: string) => ({
  updateSuccess: (name?: string) =>
    toast({
      title: `${capitalize(entityLabel)} mis à jour`,
      description: name
        ? `« ${name} » a été mis à jour avec succès.`
        : `Le ${entityLabel} a été mis à jour avec succès.`,
    }),
  updateError: () =>
    toast({
      title: 'Erreur',
      description: `Impossible de mettre à jour le ${entityLabel}. Veuillez réessayer.`,
      variant: 'destructive',
    }),
  createSuccess: (name?: string) =>
    toast({
      title: `${capitalize(entityLabel)} créé`,
      description: name
        ? `« ${name} » a été créé avec succès.`
        : `Le ${entityLabel} a été créé avec succès.`,
    }),
  createError: () =>
    toast({
      title: 'Erreur',
      description: `Impossible de créer le ${entityLabel}. Veuillez réessayer.`,
      variant: 'destructive',
    }),
  deleteSuccess: () =>
    toast({
      title: `${capitalize(entityLabel)} supprimé`,
      description: `Le ${entityLabel} a été supprimé avec succès.`,
    }),
  deleteError: () =>
    toast({
      title: 'Erreur',
      description: `Impossible de supprimer le ${entityLabel}. Veuillez réessayer.`,
      variant: 'destructive',
    }),
  actionSuccess: (action: string) =>
    toast({ title: `${capitalize(action)}`, description: `Action « ${action} » réussie.` }),
  actionError: (action: string) =>
    toast({
      title: 'Erreur',
      description: `L'action « ${action} » a échoué.`,
      variant: 'destructive',
    }),
});

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

