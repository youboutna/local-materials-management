import OAuthErrorHandler from "@/components/auth/OAuthErrorHandler";
import OAuthLogin from "@/components/auth/OAuthLogin";
import PasswordResetForm from "@/components/auth/PasswordResetForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEV_MODE, DEV_USERS, setActiveDevRole } from '@/config/constants';
import { useHexagonalAuth } from '@/hooks/hexagonal/useHexagonalAuth';
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
import React, { useEffect, useState, useRef } from "react";
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
  
  // 🔥 Utilisation du contexte hexagonal
  const { 
    user, 
    refetch,
    login,
    register,
    logout,
    isLoading: authLoading,
    showEmailEditor,
    unconfirmedEmail,
    updateEmail,
    cancelEmailEdit,
    triggerEmailEditor
  } = useHexagonalAuth();

  // Refs pour l'éditeur d'email
  const newEmailRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);

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

  // ✅ Redirection si déjà authentifié
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
      navigate(from);
    }
  }, [user, navigate, location]);

  // ✅ Reset du formulaire quand l'utilisateur se déconnecte
  useEffect(() => {
    if (!user) {
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setNationalId('');
    }
  }, [user]);

  // 🔥 Gestionnaire de connexion (avec déclenchement de l'éditeur en cas d'erreur)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch (error: any) {
      // Si l'erreur est "Email not confirmed", on déclenche l'éditeur
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Email not confirmed') || errorMessage.includes('Veuillez confirmer votre email')) {
        triggerEmailEditor(email);
      }
      // L'erreur est déjà gérée par le toast dans le contexte
    }
  };

  // 🔥 Gestionnaire d'inscription
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        email,
        password,
        full_name: fullName,
        phone,
        national_id: nationalId,
      });
    } catch (error) {
      // Géré par le contexte
    }
  };

  // 🔥 Gestion de la mise à jour de l'email + reconnexion
  const handleUpdateAndLogin = async () => {
    const newEmail = newEmailRef.current?.value?.trim();
    const newPassword = newPasswordRef.current?.value?.trim();

    if (!newEmail) {
      toast.error("Veuillez saisir un nouvel email.");
      return;
    }

    try {
      // Étape 1 : Mettre à jour l'email
      await updateEmail(newEmail);
      
      // Étape 2 : Tenter la connexion avec les nouvelles identifiants
      await login({ email: newEmail, password: newPassword || password });
      
      // Si succès, l'éditeur se ferme automatiquement via le contexte
    } catch (error) {
      // Les erreurs sont déjà gérées dans les mutations du contexte
    }
  };

  const loading = authLoading;

  const handleDevLogin = async (roleKey: keyof typeof DEV_USERS) => {
    const profile = DEV_USERS[roleKey];
    if (!profile) return;
    setActiveDevRole(profile.user_metadata.role);
    setEmail(profile.email);
    setPassword(profile.password || '');
    toast.success(`DEV login → ${profile.user_metadata.full_name} (${profile.user_metadata.role})`);
    await login({ email: profile.email, password: profile.password || 'dev' });
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
              <p className="text-muted-foreground">Connectez-vous ou créez un compte</p>
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
                {/* 🔥 Éditeur d'email / mot de passe (s'affiche si email non confirmé) */}
                {showEmailEditor && (
                  <div className="mb-6 p-4 border border-warning/30 bg-warning/10 rounded-md">
                    <h3 className="font-semibold text-warning">Email non confirmé</h3>
                    <p className="text-sm text-warning">
                      L'email <strong>{unconfirmedEmail}</strong> n'a pas été confirmé.
                      Vous pouvez corriger votre email et/ou votre mot de passe ci‑dessous.
                    </p>
                    <div className="mt-3 flex flex-col gap-3">
                      <Input
                        type="email"
                        defaultValue={unconfirmedEmail || ''}
                        ref={newEmailRef}
                        placeholder="Nouvel email"
                        className="w-full"
                      />
                      <Input
                        type="password"
                        ref={newPasswordRef}
                        placeholder="Nouveau mot de passe (optionnel)"
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateAndLogin} disabled={loading}>
                          {loading ? 'Mise à jour...' : 'Mettre à jour et se connecter'}
                        </Button>
                        <Button variant="outline" onClick={cancelEmailEdit}>
                          Annuler
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Un nouveau lien de confirmation sera envoyé à la nouvelle adresse.
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="pl-10"
                        required
                        disabled={showEmailEditor}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Votre mot de passe"
                        className="pl-10 pr-10"
                        required
                        disabled={showEmailEditor}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={showEmailEditor}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || showEmailEditor}>
                    {loading ? "Connexion..." : "Se connecter"}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setActiveTab("reset-password")}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Mot de passe oublié ?
                    </Button>
                  </div>

                  {DEV_MODE && (
                    <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3">
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
                      <p className="text-[11px] text-warning mt-2">
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
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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