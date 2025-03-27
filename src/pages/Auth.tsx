
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
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Auth = () => {
  // Get query parameters
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') === 'register' ? 'register' : 'login';
  
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nationalIdError, setNationalIdError] = useState('');
  
  // Update URL when tab changes
  useEffect(() => {
    navigate(`/auth?mode=${mode}`, { replace: true });
  }, [mode, navigate]);
  
  // Validation
  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('L\'email est requis');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Format d\'email invalide');
      return false;
    }
    setEmailError('');
    return true;
  };
  
  const validatePassword = () => {
    if (!password) {
      setPasswordError('Le mot de passe est requis');
      return false;
    } else if (mode === 'register' && password.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    setPasswordError('');
    return true;
  };
  
  const validateFullName = () => {
    if (mode === 'register' && !fullName) {
      setFullNameError('Le nom complet est requis');
      return false;
    }
    setFullNameError('');
    return true;
  };
  
  const validatePhone = () => {
    const phoneRegex = /^\d+$/;
    if (mode === 'register' && !phone) {
      setPhoneError('Le numéro de téléphone est requis');
      return false;
    } else if (mode === 'register' && !phoneRegex.test(phone)) {
      setPhoneError('Le numéro de téléphone doit contenir uniquement des chiffres');
      return false;
    }
    setPhoneError('');
    return true;
  };
  
  const validateNationalId = () => {
    if (mode === 'register' && !nationalId) {
      setNationalIdError('L\'identifiant national est requis');
      return false;
    }
    setNationalIdError('');
    return true;
  };
  
  const validateForm = () => {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isFullNameValid = validateFullName();
    const isPhoneValid = validatePhone();
    const isNationalIdValid = validateNationalId();
    
    return isEmailValid && isPasswordValid && isFullNameValid && isPhoneValid && isNationalIdValid;
  };
  
  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      
      if (mode === 'login') {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur la plateforme Materials Management.",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Inscription réussie",
          description: "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
        });
        setMode('login');
      }
    }, 1500);
  };
  
  // Animated background patterns
  const backgroundPatterns = [
    { top: '10%', left: '5%', size: '300px', delay: 0 },
    { top: '50%', right: '8%', size: '250px', delay: 0.1 },
    { bottom: '15%', left: '10%', size: '200px', delay: 0.2 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-20 px-4 relative overflow-hidden bg-gray-50">
        {/* Animated background patterns */}
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
            
            {/* Login Form */}
            <TabsContent value="login" className="m-0">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-center text-adrar-800">
                    Bienvenue
                  </CardTitle>
                  <CardDescription className="text-center">
                    Connectez-vous à votre compte pour continuer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        className={`pl-10 ${emailError ? 'border-red-500' : 'border-input'}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={validateEmail}
                        required
                      />
                    </div>
                    {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                  </div>
                  
                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="password">Mot de passe</Label>
                      <a href="#" className="text-xs text-terracotta-500 hover:text-terracotta-600">
                        Mot de passe oublié?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`pl-10 ${passwordError ? 'border-red-500' : 'border-input'}`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={validatePassword}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 text-adrar-400 hover:text-adrar-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                  </div>
                  
                  {/* Remember Me */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-adrar-600"
                    >
                      Se souvenir de moi
                    </label>
                  </div>
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
            </TabsContent>
            
            {/* Register Form */}
            <TabsContent value="register" className="m-0">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-center text-adrar-800">
                    Créer un compte
                  </CardTitle>
                  <CardDescription className="text-center">
                    Créez votre compte pour gérer vos projets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                      <Input
                        id="fullName"
                        placeholder="Votre nom complet"
                        className={`pl-10 ${fullNameError ? 'border-red-500' : 'border-input'}`}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onBlur={validateFullName}
                        required
                      />
                    </div>
                    {fullNameError && <p className="text-xs text-red-500">{fullNameError}</p>}
                  </div>
                  
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="votre@email.com"
                        className={`pl-10 ${emailError ? 'border-red-500' : 'border-input'}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={validateEmail}
                        required
                      />
                    </div>
                    {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                  </div>
                  
                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                      <Input
                        id="phone"
                        placeholder="Numéro de téléphone"
                        className={`pl-10 ${phoneError ? 'border-red-500' : 'border-input'}`}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={validatePhone}
                        required
                      />
                    </div>
                    {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
                  </div>
                  
                  {/* National ID */}
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">Identifiant national</Label>
                    <Input
                      id="nationalId"
                      placeholder="Numéro d'identité national"
                      className={nationalIdError ? 'border-red-500' : 'border-input'}
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      onBlur={validateNationalId}
                      required
                    />
                    {nationalIdError && <p className="text-xs text-red-500">{nationalIdError}</p>}
                  </div>
                  
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`pl-10 ${passwordError ? 'border-red-500' : 'border-input'}`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={validatePassword}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 text-adrar-400 hover:text-adrar-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                    <p className="text-xs text-adrar-500">
                      Le mot de passe doit contenir au moins 8 caractères
                    </p>
                  </div>
                  
                  {/* Terms */}
                  <div className="flex items-start space-x-2 mt-4">
                    <Checkbox id="terms" required className="mt-1" />
                    <label
                      htmlFor="terms"
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-adrar-600"
                    >
                      J'accepte les{" "}
                      <a href="/terms" className="text-terracotta-500 hover:text-terracotta-600 underline">
                        conditions d'utilisation
                      </a>{" "}
                      et la{" "}
                      <a href="/privacy" className="text-terracotta-500 hover:text-terracotta-600 underline">
                        politique de confidentialité
                      </a>
                    </label>
                  </div>
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
            </TabsContent>
          </Tabs>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Auth;
