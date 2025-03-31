
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useProjects } from '@/hooks/useProjects';

// Form schema using Zod
const formSchema = z.object({
  title: z.string().min(3, {
    message: "Le titre doit contenir au moins 3 caractères.",
  }),
  description: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères.",
  }),
  location: z.string().min(2, {
    message: "Veuillez indiquer un lieu valide.",
  }),
  status: z.enum(["en cours", "terminé", "en attente", "suspendu", "annulé"], {
    required_error: "Veuillez sélectionner un statut.",
  }),
  budget: z.coerce.number().min(1, {
    message: "Le budget doit être un nombre positif.",
  }),
  teamSize: z.coerce.number().min(1, {
    message: "L'équipe doit comporter au moins une personne.",
  }),
  startDate: z.string().min(1, {
    message: "Veuillez sélectionner une date de début.",
  }),
});

const ProjectCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createProject } = useProjects();
  
  // Form definition using react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      status: "en attente",
      budget: undefined,
      teamSize: undefined,
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      // Calculate progress based on status
      const progress = values.status === 'terminé' ? 100 : 
                       values.status === 'en cours' ? 25 : 0;
      
      // Create the new project
      await createProject({
        title: values.title,
        description: values.description,
        location: values.location,
        status: values.status as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
        progress: progress,
        budget: values.budget,
        startDate: values.startDate,
        thumbnail: '/img/project-placeholder.jpg',
        teamSize: values.teamSize
      });
      
      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      // Toast notification is already handled in the createProject function
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Link to="/projects">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux projets
            </Button>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-xl shadow-elegant p-6 mb-8">
              <h1 className="text-2xl font-serif text-adrar-800 mb-6">Créer un nouveau projet</h1>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre du projet</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Restauration du Fort d'Atar" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Décrivez le projet et ses objectifs..." 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lieu</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Nouakchott" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un statut" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en attente">En attente</SelectItem>
                              <SelectItem value="en cours">En cours</SelectItem>
                              <SelectItem value="terminé">Terminé</SelectItem>
                              <SelectItem value="suspendu">Suspendu</SelectItem>
                              <SelectItem value="annulé">Annulé</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget (MRU)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1000" placeholder="Ex: 5000000" {...field} />
                          </FormControl>
                          <FormDescription>Montant en Ouguiya mauritanien</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taille de l'équipe</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" placeholder="Ex: 12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de début</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      className="bg-terracotta-500 hover:bg-terracotta-600"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Création en cours...' : 'Créer le projet'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProjectCreate;
