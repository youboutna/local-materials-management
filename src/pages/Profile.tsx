import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserService, UserService } from "@/application/services/UserService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { useLanguage } from "@/contexts/LanguageContext";
import { usePasswordManagement } from "@/hooks/usePasswordManagement";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout";
import { T } from '@/components/i18n/T';
import { formatReference } from '@/utils/entityLabels';
const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { updatePassword, loading } = usePasswordManagement();
  const { toast } = useToast();

  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["profile", "self", user?.id],
    enabled: !!user?.id,
    queryFn: () => getUserService().getUserById(user!.id),
  });
  const [form, setForm] = useState({ fullName: "", phone: "", nationalId: "" });
  useEffect(() => {
    const p = profileQuery.data;
    if (p) setForm({ fullName: p.fullName ?? "", phone: p.phone ?? "", nationalId: p.nationalId ?? "" });
  }, [profileQuery.data]);
  const saveProfile = useMutation({
    mutationFn: () => getUserService().updateOwnProfile(user!.id, form),
  });
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const violation = UserService.validateOwnProfile(form);
    if (violation) {
      toast({ title: t("common.error") || "Erreur", description: violation === "fullName" ? "Nom complet requis (2 caractères minimum)." : "Numéro de téléphone invalide.", variant: "destructive" });
      return;
    }
    try {
      await saveProfile.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: ["profile", "self", user?.id] });
      toast({ title: "Profil mis à jour" });
    } catch (err) {
      toast({ title: t("common.error") || "Erreur", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    const result = await updatePassword(newPassword, confirmPassword);

    if (result.success) {
      setShowPasswordSection(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <AppLayout pageTitle={t("nav.profile")}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Information Card */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("nav.profile")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t("auth.email")}
                </Label>
                <p className="text-lg">
                  {user?.email || t("materials.not_defined")}
                </p>
              </div>
              <form onSubmit={handleProfileSave} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="pf-fullName">{t("auth.full_name")}</Label>
                  <Input id="pf-fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pf-phone"><T k="auto.profile.telephone" fallback="Téléphone" /></Label>
                  <Input id="pf-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pf-nid"><T k="auto.profile.piece_identite" fallback="N° pièce d'identité" /></Label>
                  <Input id="pf-nid" value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} />
                </div>
                <Button type="submit" disabled={saveProfile.isPending || profileQuery.isLoading}>
                  <T k="auto.profile.enregistrer" fallback="Enregistrer" />
                </Button>
              </form>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t("roles.user")}
                </Label>
                <p className="text-lg">
                  {(user as any)?.role || user?.user_metadata?.role || t("roles.user")}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  <T k="auto.profile.id_utilisateur" fallback="ID Utilisateur" />
                </Label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {formatReference(user?.id, 'USR')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <T k="auto.profile.securite_du_compte" fallback="Sécurité du compte" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showPasswordSection ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                <T k="auto.profile.modifiez_votre_mot_de_passe_pour_securiser_votre" fallback="Modifiez votre mot de passe pour sécuriser votre compte." />
              </p>
              <Button
                onClick={() => setShowPasswordSection(true)}
                variant="outline"
              >
                <T k="auto.profile.changer_le_mot_de_passe" fallback="Changer le mot de passe" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword"><T k="auto.profile.nouveau_mot_de_passe" fallback="Nouveau mot de passe" /></Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Entrez votre nouveau mot de passe"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  <T k="auto.profile.confirmer_le_nouveau_mot_de_passe" fallback="Confirmer le nouveau mot de passe" />
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez votre nouveau mot de passe"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  <T k="auto.profile.annuler" fallback="Annuler" />
                </Button>
              </div>
            </form>
          )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;
