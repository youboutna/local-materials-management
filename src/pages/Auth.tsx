import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, User, Lock, Mail, Phone, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DEV_MODE } from '@/config/constants';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
  rememberMe: z.boolean().default(false),
});

const registerSchema = z.object({
  fullName: z.string().min(1, "Le nom complet est requis"),
  email: z.string().email("Format d'email invalide"),
  phone: z.string().min(1, "Le numéro de téléphone est requis"),
  nationalId: z.string().min(1, "L'identifiant national est requis"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  acceptTerms: z.boolean({
    required_error: "Vous devez accepter les conditions d'utilisation"
  }).refine(val => val === true, {
    message: "Vous devez accepter les conditions d'utilisation"
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp, user, isDevelopmentMode } = useAuth();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') === 'register' ? 'register' : 'login';
  
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      nationalId: '',
      password: '',
      acceptTerms: false,
    },
  });
  
  useEffect(() => {
    navigate(`/auth?mode=${mode}`, { replace: true });
  }, [mode, navigate]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isDevelopmentMode) {
      toast({
        title: "Mode développement actif",
        description: "L'authentification est contournée en mode développement. Cliquez sur 'Se connecter' pour simuler une connexion.",
        duration: 5000,
      });
    }
  }, [isDevelopmentMode, toast]);
  
  const onLoginSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isDevelopmentMode) {
        navigate('/dashboard');
        return;
      }

      await signIn(values.email, values.password);
      navigate('/dashboard');
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const onRegisterSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isDevelopmentMode) {
        toast({
          title: "Inscription simulée",
          description: "En mode développement, l'inscription est simulée. Vous pouvez vous connecter directement.",
        });
        setMode('login');
        return;
      }

      await signUp(
        values.email, 
        values.password, 
        values.fullName, 
        values.phone, 
        values.nationalId
      );
      setMode('login');
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const backgroundPatterns = [
    { top: '10%', left: '5%', size: '300px', delay: 0 },
    { top: '50%', right: '8%', size: '250px', delay: 0.1 },
    { bottom: '15%', left: '10%', size: '200px', delay: 0.2 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {isDevelopmentMode && (
        <div className="fixed top-20 right-4 z-50 bg-amber-100 text-amber-800 px-4 py-2 rounded-md shadow-md text-sm">
          🛠️ Mode développement actif
        </div>
      )}
      
      <main className="flex-grow flex items-center justify-center py-20 px-4 relative overflow-hidden bg-gray-50">
        {backgroundPatterns.map((pattern, index) => (
          <motion.div
            key={index}
            className="absolute opacity-10 z-0"
            style={{
              top: pattern.top,
              left: pattern.left,
              right: pattern.right,
              bottom: pattern.bottom,
              width: pattern.size,
              height: pattern.size,
              backgroundImage: `url('/img/pattern-${index + 1}.png')`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ 
              duration: 1.5, 
              delay: pattern.delay,
              repeat: Infinity,
              repeatType: 'reverse',
              repeatDelay: 3,
            }}
          />
        ))}
        
        <Card className="w-full max-w-md shadow-elegant border-none z-10 overflow-hidden">
          <Tabs value={mode} onValueChange={setMode} className="w-full">
            <TabsList className="grid grid-cols-2 w-full rounded-none">
              <TabsTrigger value="login" className="rounded-none data-[state=active]:bg-white">
                Connexion
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-none data-[state=active]:bg-white">
                Inscription
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="m-0">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                  <CardHeader>
                    <CardTitle className="text-2xl font-serif text-center text-adrar-800">
                      Bienvenue
                    </CardTitle>
                    <CardDescription className="text-center">
                      Connectez-vous à votre compte pour continuer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                            <FormControl>
                              <Input 
                                placeholder="votre@email.com" 
                                className="pl-10" 
                                {...field} 
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Mot de passe</FormLabel>
                            <a href="#" className="text-xs text-terracotta-500 hover:text-terracotta-600">
                              Mot de passe oublié?
                            </a>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                            <FormControl>
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="pl-10"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              className="absolute right-3 top-3 text-adrar-400 hover:text-adrar-600"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="leading-none">
                            <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-adrar-600">
                              Se souvenir de moi
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex flex-col">
                    <Button 
                      type="submit"
                      className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white"
                      disabled={loading}
                    >
                      {loading ? 'Connexion en cours...' : 'Se connecter'}
                      {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register" className="m-0">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                  <CardHeader>
                    <CardTitle className="text-2xl font-serif text-center text-adrar-800">
                      Créer un compte
                    </CardTitle>
                    <CardDescription className="text-center">
                      Créez votre compte pour gérer vos projets
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                            <FormControl>
                              <Input
                                placeholder="Votre nom complet"
                                className="pl-10"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="votre@email.com"
                                className="pl-10"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                            <FormControl>
                              <Input
                                placeholder="Numéro de téléphone"
                                className="pl-10"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="nationalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Identifiant national</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Numéro d'identité national"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mot de passe</FormLabel>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                            <FormControl>
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="pl-10"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              className="absolute right-3 top-3 text-adrar-400 hover:text-adrar-600"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <FormMessage />
                          <p className="text-xs text-adrar-500">
                            Le mot de passe doit contenir au moins 8 caractères
                          </p>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="leading-none">
                            <FormLabel className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-adrar-600">
                              J'accepte les{" "}
                              <a href="/terms" className="text-terracotta-500 hover:text-terracotta-600 underline">
                                conditions d'utilisation
                              </a>{" "}
                              et la{" "}
                              <a href="/privacy" className="text-terracotta-500 hover:text-terracotta-600 underline">
                                politique de confidentialité
                              </a>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex flex-col">
                    <Button 
                      type="submit"
                      className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white"
                      disabled={loading}
                    >
                      {loading ? 'Inscription en cours...' : 'S\'inscrire'}
                      {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Auth;
