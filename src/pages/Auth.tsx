import { getAuthService } from '@/application/services/AuthService';
import OAuthErrorHandler from "@/components/auth/OAuthErrorHandler";
import OAuthLogin from "@/components/auth/OAuthLogin";
import PasswordResetForm from "@/components/auth/PasswordResetForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEV_MODE, DEV_USERS, setActiveDevRole } from '@/config/constants';
import { useAuth } from '@/hooks/hexagonal';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation } from '@tanstack/react-query';
import {
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    Mail,
    ShieldCheck,
    User,
    UserPlus,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from 'sonner';

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
  const authService = getAuthService();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await authService.login(credentials);
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Bienvenue ${(data.user as { name?: string; email?: string } | undefined)?.name || data.user?.email || ''}!`);
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

  const handleDevLogin = async (roleKey: keyof typeof DEV_USERS) => {
    const profile = DEV_USERS[roleKey];
    if (!profile) return;
    setActiveDevRole(profile.user_metadata.role);
    setEmail(profile.email);
    setPassword(profile.password || '');
    toast.success(`DEV login → ${profile.user_metadata.full_name} (${profile.user_metadata.role})`);
    await loginMutation.mutateAsync({ email: profile.email, password: profile.password || 'dev' });
  };



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

                  {DEV_MODE && (
                    <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3">
                      <div className="flex items-center gap-2 mb-2 text-amber-900 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4" />
                        DEV_MODE — Connexion locale (aucun appel réseau)
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(DEV_USERS) as Array<keyof typeof DEV_USERS>).map((k) => (
                          <Button
                            key={k}
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            onClick={() => handleDevLogin(k)}
                            className="capitalize"
                          >
                            {DEV_USERS[k].user_metadata.role}
                          </Button>
                        ))}
                      </div>
                      <p className="text-[11px] text-amber-800 mt-2">
                        Utilisateurs DEV : {Object.values(DEV_USERS).map((u) => u.email).join(' · ')}
                      </p>
                    </div>
                  )}
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
