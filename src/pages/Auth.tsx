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
import { Eye, EyeOff, User, Lock, Mail, Phone, ArrowRight, Fingerprint } from 'lucide-react';
import MainNavbar from '@/components/MainNavbar';
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
import OAuthErrorHandler from '@/components/auth/OAuthErrorHandler';
import OAuthConfigGuide from '@/components/auth/OAuthConfigGuide';
import PasswordResetForm from '@/components/auth/PasswordResetForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';

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

const phoneLoginSchema = z.object({
  phone: z.string().min(1, "Le numéro de téléphone est requis"),
});

const phoneVerifySchema = z.object({
  token: z.string().length(6, "Le code de vérification doit contenir 6 chiffres"),
});

const nationalIdSchema = z.object({
  nationalId: z.string().min(1, "L'identifiant national est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type PhoneLoginValues = z.infer<typeof phoneLoginSchema>;
type PhoneVerifyValues = z.infer<typeof phoneVerifySchema>;
type NationalIdValues = z.infer<typeof nationalIdSchema>;

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp, user, signInWithGoogle, signInWithPhone, verifyPhoneOTP, signInWithNationalId, isDevelopmentMode } = useAuth();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') === 'register' ? 'register' : 'login';
  
  const [mode, setMode] = useState(initialMode);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | 'nationalId'>('email');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOAuthConfig, setShowOAuthConfig] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  
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

  const phoneLoginForm = useForm<PhoneLoginValues>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phone: '',
    },
  });

  const phoneVerifyForm = useForm<PhoneVerifyValues>({
    resolver: zodResolver(phoneVerifySchema),
    defaultValues: {
      token: '',
    },
  });

  const nationalIdForm = useForm<NationalIdValues>({
    resolver: zodResolver(nationalIdSchema),
    defaultValues: {
      nationalId: '',
      password: '',
    },
  });
  
  useEffect(() => {
    try {
      if (DEV_MODE) {
        // Use history API safely in dev mode
        const newUrl = `/auth?mode=${mode}`;
        if (window.location.pathname + window.location.search !== newUrl) {
          window.history.replaceState(null, '', newUrl);
        }
      } else {
        // Only use navigate in production mode
        navigate(`/auth?mode=${mode}`, { replace: true });
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [mode, navigate]);

  useEffect(() => {
    if (user) {
      try {
        if (DEV_MODE) {
          // Use direct window location change to avoid security errors
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 100);
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Redirect error:', error);
        // Fallback to direct navigation
        window.location.href = '/dashboard';
      }
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
  
  const getAuthErrorMessage = (error: any) => {
    if (error?.code) {
      switch (error.code) {
        case 'email_not_confirmed':
          return {
            title: "Email non confirmé",
            description: "Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation avant de vous connecter.",
            type: 'warning' as const
          };
        case 'invalid_credentials':
          return {
            title: "Identifiants incorrects",
            description: "L'adresse email ou le mot de passe que vous avez saisi est incorrect. Veuillez vérifier et réessayer.",
            type: 'error' as const
          };
        case 'too_many_requests':
          return {
            title: "Trop de tentatives",
            description: "Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.",
            type: 'error' as const
          };
        case 'user_not_found':
          return {
            title: "Utilisateur non trouvé",
            description: "Aucun compte n'est associé à cette adresse email. Vérifiez l'adresse ou créez un nouveau compte.",
            type: 'error' as const
          };
        case 'weak_password':
          return {
            title: "Mot de passe trop faible",
            description: "Le mot de passe doit contenir au moins 8 caractères avec des lettres et des chiffres.",
            type: 'error' as const
          };
        case 'signup_disabled':
          return {
            title: "Inscription désactivée",
            description: "Les nouvelles inscriptions sont temporairement désactivées. Contactez l'administrateur.",
            type: 'error' as const
          };
        default:
          return {
            title: "Erreur d'authentification",
            description: error.message || "Une erreur inattendue s'est produite. Veuillez réessayer.",
            type: 'error' as const
          };
      }
    }
    
    return {
      title: "Erreur d'authentification",
      description: error?.message || "Une erreur inattendue s'est produite. Veuillez réessayer.",
      type: 'error' as const
    };
  };
  
  const onLoginSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      if (isDevelopmentMode) {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
        return;
      }

      await signIn(values.email, values.password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      const errorInfo = getAuthErrorMessage(error);
      setAuthError(errorInfo.description);
      
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: errorInfo.type === 'error' ? 'destructive' : 'default'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    setAuthError(null);
    
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
      
      toast({
        title: "Inscription réussie",
        description: "Un email de confirmation a été envoyé à votre adresse. Vérifiez votre boîte mail avant de vous connecter.",
      });
      
      setMode('login');
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorInfo = getAuthErrorMessage(error);
      setAuthError(errorInfo.description);
      
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignIn = async () => {
    if (isDevelopmentMode) {
      toast({
        title: "Mode développement",
        description: "Connexion Google simulée en mode développement",
      });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
      return;
    }

    try {
      setLoading(true);
      await signInWithGoogle();
      // Redirect happens automatically on success
    } catch (error: any) {
      console.error("Google sign in error:", error);
      
      // Show OAuth configuration guide for common errors
      if (error.message?.includes('403') || error.message?.includes('unauthorized') || error.message?.includes('access_denied')) {
        setShowOAuthConfig(true);
        toast({
          title: "Erreur de configuration OAuth",
          description: "Veuillez configurer correctement Google OAuth. Voir les instructions ci-dessous.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur de connexion Google",
          description: "Impossible de se connecter avec Google. Vérifiez votre configuration.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onPhoneSubmit = async (values: PhoneLoginValues) => {
    setLoading(true);
    try {
      const formattedPhone = values.phone.startsWith('+') 
        ? values.phone 
        : `+${values.phone}`;
      
      setPhoneNumber(formattedPhone);
      const result = await signInWithPhone(formattedPhone);
      
      if (result.success) {
        setPhoneSubmitted(true);
      }
    } catch (error) {
      console.error("Phone login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onPhoneVerifySubmit = async (values: PhoneVerifyValues) => {
    setLoading(true);
    try {
      await verifyPhoneOTP(phoneNumber, values.token);
      navigate('/dashboard');
    } catch (error) {
      console.error("Phone verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onNationalIdSubmit = async (values: NationalIdValues) => {
    setLoading(true);
    try {
      await signInWithNationalId(values.nationalId, values.password);
      // After verification, user would need to login with email/password
      setLoginMethod('email');
    } catch (error) {
      console.error("National ID login error:", error);
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
      <MainNavbar />
      
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
        
        <div className="w-full max-w-md z-10 space-y-6">
          <OAuthErrorHandler />
          
          {authError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          
          {showPasswordReset ? (
            <PasswordResetForm onBack={() => setShowPasswordReset(false)} />
          ) : (
            <Card className="shadow-elegant border-none overflow-hidden">
              <Tabs value={mode} onValueChange={(newMode) => {
                setMode(newMode);
                setAuthError(null);
              }} className="w-full">
                <TabsList className="grid grid-cols-2 w-full rounded-none">
                  <TabsTrigger value="login" className="rounded-none data-[state=active]:bg-white">
                    Connexion
                  </TabsTrigger>
                  <TabsTrigger value="register" className="rounded-none data-[state=active]:bg-white">
                    Inscription
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="m-0">
                  {loginMethod === 'email' && !phoneSubmitted && (
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
                                      onChange={(e) => {
                                        field.onChange(e);
                                        setAuthError(null);
                                      }}
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
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswordReset(true)}
                                    className="text-xs text-terracotta-500 hover:text-terracotta-600"
                                  >
                                    Mot de passe oublié?
                                  </button>
                                </div>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                                  <FormControl>
                                    <Input
                                      type={showPassword ? 'text' : 'password'}
                                      placeholder="••••••••"
                                      className="pl-10"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        setAuthError(null);
                                      }}
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

                          <div className="grid grid-cols-2 gap-3 mt-6">
                            <Button
                              type="button"
                              onClick={() => setLoginMethod('phone')}
                              variant="outline"
                              className="flex items-center justify-center"
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Par téléphone
                            </Button>
                            <Button
                              type="button"
                              onClick={() => setLoginMethod('nationalId')}
                              variant="outline"
                              className="flex items-center justify-center"
                            >
                              <Fingerprint className="h-4 w-4 mr-2" />
                              Par NIR ID
                            </Button>
                          </div>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white px-2 text-muted-foreground">
                                Ou continuer avec
                              </span>
                            </div>
                          </div>

                          <Button
                            type="button"
                            onClick={onGoogleSignIn}
                            variant="outline"
                            className="w-full"
                            disabled={loading}
                          >
                            {loading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                            ) : (
                              <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
                                <path
                                  d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                                  fill="#EA4335"
                                />
                                <path
                                  d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                                  fill="#4285F4"
                                />
                                <path
                                  d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                                  fill="#FBBC05"
                                />
                                <path
                                  d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.2154 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                                  fill="#34A853"
                                />
                              </svg>
                            )}
                            {loading ? 'Connexion...' : 'Continuer avec Google'}
                          </Button>
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
                  )}

                  {loginMethod === 'phone' && !phoneSubmitted && (
                    <Form {...phoneLoginForm}>
                      <form onSubmit={phoneLoginForm.handleSubmit(onPhoneSubmit)}>
                        <CardHeader>
                          <CardTitle className="text-2xl font-serif text-center text-adrar-800">
                            Connexion par téléphone
                          </CardTitle>
                          <CardDescription>
                            Format international avec code pays (ex: +222)
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <FormField
                            control={phoneLoginForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Numéro de téléphone</FormLabel>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                                  <FormControl>
                                    <Input 
                                      placeholder="+222 XXXXXXXX" 
                                      className="pl-10" 
                                      {...field} 
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setLoginMethod('email')}
                          >
                            Retour à la connexion par email
                          </Button>
                        </CardContent>
                        <CardFooter className="flex flex-col">
                          <Button 
                            type="submit"
                            className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white"
                            disabled={loading}
                          >
                            {loading ? 'Envoi en cours...' : 'Recevoir un code'}
                            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                          </Button>
                        </CardFooter>
                      </form>
                    </Form>
                  )}

                  {loginMethod === 'phone' && phoneSubmitted && (
                    <Form {...phoneVerifyForm}>
                      <form onSubmit={phoneVerifyForm.handleSubmit(onPhoneVerifySubmit)}>
                        <CardHeader>
                          <CardTitle className="text-2xl font-serif text-center text-adrar-800">
                            Vérification du code
                          </CardTitle>
                          <CardDescription className="text-center">
                            Entrez le code à 6 chiffres envoyé à {phoneNumber}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <FormField
                            control={phoneVerifyForm.control}
                            name="token"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Code de vérification</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="123456" 
                                    maxLength={6}
                                    className="text-center text-xl letter-spacing-1 font-mono"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="button"
                            variant="link"
                            className="w-full p-0 h-auto"
                            onClick={() => {
                              setPhoneSubmitted(false);
                              phoneLoginForm.reset();
                            }}
                          >
                            Utiliser un autre numéro de téléphone
                          </Button>
                        </CardContent>
                        <CardFooter className="flex flex-col">
                          <Button 
                            type="submit"
                            className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white"
                            disabled={loading}
                          >
                            {loading ? 'Vérification...' : 'Vérifier le code'}
                            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                          </Button>
                        </CardFooter>
                      </form>
                    </Form>
                  )}

                  {loginMethod === 'nationalId' && (
                    <Form {...nationalIdForm}>
                      <form onSubmit={nationalIdForm.handleSubmit(onNationalIdSubmit)}>
                        <CardHeader>
                          <CardTitle className="text-2xl font-serif text-center text-adrar-800">
                            Connexion avec NIR ID
                          </CardTitle>
                          <CardDescription className="text-center">
                            Entrez votre identifiant national
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <FormField
                            control={nationalIdForm.control}
                            name="nationalId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Numéro d'identité national</FormLabel>
                                <div className="relative">
                                  <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                                  <FormControl>
                                    <Input 
                                      placeholder="Votre numéro NIR" 
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
                            control={nationalIdForm.control}
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
                          
                          <Button 
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setLoginMethod('email')}
                          >
                            Retour à la connexion par email
                          </Button>
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
                  )}
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
                              <div className="relative">
                                <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                                <FormControl>
                                  <Input
                                    placeholder="Numéro d'identité national"
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

                        <div className="relative mt-6">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">
                              Ou s'inscrire avec
                            </span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={onGoogleSignIn}
                          variant="outline"
                          className="w-full"
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                          ) : (
                            <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
                              <path
                                d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                                fill="#EA4335"
                              />
                              <path
                                d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                                fill="#4285F4"
                              />
                              <path
                                d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                                fill="#FBBC05"
                              />
                              <path
                                d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.2154 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                                fill="#34A853"
                              />
                            </svg>
                          )}
                          {loading ? 'Connexion...' : 'Continuer avec Google'}
                        </Button>
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
          )}
          
          {showOAuthConfig && <OAuthConfigGuide />}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Auth;
