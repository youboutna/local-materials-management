
import { toast } from '@/hooks/use-toast';

export const projectToasts = {
  connectionError: () => {
    toast({
      title: "Erreur",
      description: "La connexion à la base de données n'est pas initialisée.",
      variant: "destructive",
    });
  },
  
  fetchError: () => {
    toast({
      title: "Erreur",
      description: "Impossible de récupérer les projets. Veuillez réessayer plus tard.",
      variant: "destructive",
    });
  },
  
  createSuccess: (title: string) => {
    toast({
      title: "Projet créé",
      description: `Le projet "${title}" a été créé avec succès.`,
    });
  },
  
  createError: () => {
    toast({
      title: "Erreur",
      description: "Impossible de créer le projet. Veuillez réessayer plus tard.",
      variant: "destructive",
    });
  },
  
  updateSuccess: (title: string) => {
    toast({
      title: "Projet mis à jour",
      description: `Le projet "${title}" a été mis à jour avec succès.`,
    });
  },
  
  updateError: () => {
    toast({
      title: "Erreur",
      description: "Impossible de mettre à jour le projet.",
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
      description: "Impossible de supprimer le projet.",
      variant: "destructive",
    });
  },
  
  fetchDetailError: () => {
    toast({
      title: "Erreur",
      description: "Impossible de récupérer les détails du projet.",
      variant: "destructive",
    });
  },
  
  supabaseUpdateNotImplemented: () => {
    toast({
      title: "Information",
      description: "La mise à jour via Supabase n'est pas encore implémentée.",
    });
  },
  
  supabaseDeleteNotImplemented: () => {
    toast({
      title: "Information",
      description: "La suppression via Supabase n'est pas encore implémentée.",
    });
  }
};
