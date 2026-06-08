import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/hexagonal';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AuthService } from '@/application/services/AuthService';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  UserPlus,
  KeyRound,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PasswordResetForm from "@/components/auth/PasswordResetForm";
import OAuthLogin from "@/components/auth/OAuthLogin";
import OAuthErrorHandler from "@/components/auth/OAuthErrorHandler";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const navigate = useNavigate();
  const location = useLocation();
  const { user, refetch } = useAuth();

  // Check for mode from URL params (login, register, reset-password)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");
    if (mode === "login") {
      setActiveTab("login");
    } else if (mode === "register") {
      setActiveTab("register");
    } else if (mode === "reset-password") {
      setActiveTab("reset-password");
    }
  }, [location]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
      navigate(from);
    }
  }, [user, navigate, location]);

  // Create unified authentication service
  const authRepository = RepositoryFactory.getAuthRepository();
  const authService = new AuthService(authRepository);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await authService.login(credentials);
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Bienvenue ${data.user?.name || data.user?.email || ''}!`);
      refetch();
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast.error(error?.message || "Échec de la connexion. Veuillez vérifier vos identifiants.");
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: { 
      email: string; 
      password: string; 
      full_name: string; 
      phone?: string; 
      national_id?: string; 
    }) => {
      const result = await authService.register(userData);
      return result;
    },
    onSuccess: (data) => {
      toast.success("Compte créé avec succès!");
      refetch();
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      console.error('Registration error:', error);
      toast.error("Échec de l'inscription. Veuillez réessayer.");
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginMutation.mutateAsync({ email, password });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerMutation.mutateAsync({
      email,
      password,
      full_name: fullName,
      phone,
      national_id: nationalId,
    });
  };

  const loading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-adrar-50 to-terracotta-50">
      <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-4">
        <div className="w-full max-w-md space-y-6">
          {/* OAuth Error Handler */}
          <OAuthErrorHandler />
          
          {/* OAuth Login Options */}
          <OAuthLogin 
            title="Connexion rapide"
            description="Connectez-vous avec votre compte existant"
          />

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-adrar-800">
                Accès au Portail
              </CardTitle>
              <p className="text-gray-600">Connectez-vous ou créez un compte</p>
            </CardHeader>
            <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Connexion
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Inscription
                </TabsTrigger>
                <TabsTrigger
                  value="reset-password"
                  className="flex items-center gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  Mot de passe
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Votre mot de passe"
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Connexion..." : "Se connecter"}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setActiveTab("reset-password")}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Mot de passe oublié ?
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Votre nom complet"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-phone">Téléphone</Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+222 XX XX XX XX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-national-id">CIN</Label>
                      <Input
                        id="register-national-id"
                        type="text"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        placeholder="Numéro CIN"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 caractères"
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Inscription..." : "Créer le compte"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="reset-password">
                <PasswordResetForm onBack={() => setActiveTab("login")} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
    </div>
  );
};

export default Auth;
