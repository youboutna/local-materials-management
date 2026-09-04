import OAuthErrorHandler from "@/components/auth/OAuthErrorHandler";
import OAuthLogin from "@/components/auth/OAuthLogin";
import PasswordResetForm from "@/components/auth/PasswordResetForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEV_MODE, DEV_USERS, setActiveDevRole } from '@/config/constants';
import { resolveHomeRouteForRoles, DEFAULT_MANAGEMENT_HOME } from '@/config/referentials/auth/role-home-routes.referential';

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
import { T } from '@/components/i18n/T';

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

  // ✅ Redirection si déjà authentifié : page d'accueil selon le rôle
  useEffect(() => {
    if (user) {
      const roles = [
        ...(user.roles ?? []),
        ...(user.role ? [user.role] : []),
      ];
      const home = resolveHomeRouteForRoles(roles);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      // Les profils non gestionnaires sont toujours envoyés vers leur portail dédié
      const isManagement = home === DEFAULT_MANAGEMENT_HOME;
      const target = isManagement ? (from || home) : (from?.startsWith(home) ? from : home);
      navigate(target, { replace: true });
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
        fullName: fullName,
        phone,
        nationalId: nationalId,
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
                <T k="auto.auth.acces_au_portail" fallback="Accès au Portail" />
              </CardTitle>
              <p className="text-muted-foreground"><T k="auto.auth.connectez_vous_ou_creez_un_compte" fallback="Connectez-vous ou créez un compte" /></p>
            </CardHeader>
            <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-3">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <T k="auto.auth.connexion" fallback="Connexion" />
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <T k="auto.auth.inscription" fallback="Inscription" />
                </TabsTrigger>
                <TabsTrigger
                  value="reset-password"
                  className="flex items-center gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  <T k="auto.auth.mot_de_passe" fallback="Mot de passe" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {/* 🔥 Éditeur d'email / mot de passe (s'affiche si email non confirmé) */}
                {showEmailEditor && (
                  <div className="mb-6 p-4 border border-warning/30 bg-warning/10 rounded-md">
                    <h3 className="font-semibold text-warning"><T k="auto.auth.email_non_confirme" fallback="Email non confirmé" /></h3>
                    <p className="text-sm text-warning">
                      <T k="auto.auth.l_email" fallback="L'email" /> <strong>{unconfirmedEmail}</strong> n'a pas été confirmé.
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
                          <T k="auto.auth.annuler" fallback="Annuler" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <T k="auto.auth.un_nouveau_lien_de_confirmation_sera_envoye_a_la" fallback="Un nouveau lien de confirmation sera envoyé à la nouvelle adresse." />
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Section Dev — visible en mode développement */}
                  {DEV_MODE && (
                    <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                      <div className="flex items-center gap-2 mb-3 text-amber-900 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4" />
                        DEV_MODE — Connexion locale (aucun appel réseau)
                      </div>
                      <div className="flex flex-wrap gap-2">
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
                    </div>
                  )}

                  {/* Section normale — toujours disponible */}
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          <T k="auto.auth.ou" fallback="ou" />
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email"><T k="auto.auth.email" fallback="Email" /></Label>
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
                        <Label htmlFor="login-password"><T k="auto.auth.mot_de_passe" fallback="Mot de passe" /></Label>
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
                          <T k="auto.auth.mot_de_passe_oublie" fallback="Mot de passe oublié ?" />
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name"><T k="auto.auth.nom_complet" fallback="Nom complet" /></Label>
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
                    <Label htmlFor="register-email"><T k="auto.auth.email" fallback="Email" /></Label>
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
                      <Label htmlFor="register-phone"><T k="auto.auth.telephone" fallback="Téléphone" /></Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+222 XX XX XX XX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-national-id"><T k="auto.auth.cin" fallback="CIN" /></Label>
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
                    <Label htmlFor="register-password"><T k="auto.auth.mot_de_passe" fallback="Mot de passe" /></Label>
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