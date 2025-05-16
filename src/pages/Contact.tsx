
import { useState } from 'react';
import { ArrowLeft, MessageSquare, Phone, Mail, MapPin, Send, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Contact = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Message envoyé",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </Link>

          <h1 className="text-3xl font-serif font-bold text-adrar-900 mb-8">Contactez-nous</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-terracotta-500" />
                  Envoyez-nous un message
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input
                        id="name"
                        placeholder="Votre nom"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Sujet</Label>
                    <Input
                      id="subject"
                      placeholder="Objet de votre message"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Votre message..."
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="resize-none"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Envoi en cours...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer le message
                      </span>
                    )}
                  </Button>
                </form>
              </Card>
            </div>
            
            <div>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Informations de contact</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-terracotta-50 p-3 rounded-full mr-4">
                      <MapPin className="h-5 w-5 text-terracotta-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Adresse</h3>
                      <p className="text-adrar-600">
                        123 Rue de l'Abri<br />
                        Nouakchott, Mauritanie
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-terracotta-50 p-3 rounded-full mr-4">
                      <Phone className="h-5 w-5 text-terracotta-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Téléphone</h3>
                      <p className="text-adrar-600">+222 45 67 89 01</p>
                      <p className="text-adrar-600">+222 45 67 89 02</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-terracotta-50 p-3 rounded-full mr-4">
                      <Mail className="h-5 w-5 text-terracotta-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="text-adrar-600">contact@example.com</p>
                      <p className="text-adrar-600">support@example.com</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-medium mb-2">Heures d'ouverture</h3>
                  <div className="space-y-1 text-adrar-600">
                    <p>Lun - Ven: 8:00 - 17:00</p>
                    <p>Sam: 9:00 - 13:00</p>
                    <p>Dim: Fermé</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
