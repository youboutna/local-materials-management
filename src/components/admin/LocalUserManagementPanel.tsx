import { getLocalUserManagementService } from '@/application/services/LocalUserManagementService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DevUserProfile, getActiveDevRole } from '@/config/constants';
import { useToast } from '@/hooks/use-toast';
import { Download, Plus, Trash2, Upload, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const emptyDraft = (): DevUserProfile => ({
  id: crypto.randomUUID(),
  email: '',
  password: '',
  user_metadata: { full_name: '', role: 'user', phone: '', national_id: '' },
  permissions: [],
  teams: [],
  preferences: { language: 'fr' },
});

export default function LocalUserManagementPanel() {
  const svc = useMemo(() => getLocalUserManagementService(), []);
  const { toast } = useToast();
  const [users, setUsers] = useState(svc.getAllUsers());
  const [activeRole, setActiveRole] = useState(getActiveDevRole().role);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  const [draft, setDraft] = useState<DevUserProfile>(emptyDraft());

  useEffect(() => {
    const refresh = () => {
      setUsers(svc.getAllUsers());
      setActiveRole(getActiveDevRole().role);
    };
    window.addEventListener('dev-users-changed', refresh);
    window.addEventListener('dev-role-changed', refresh);
    return () => {
      window.removeEventListener('dev-users-changed', refresh);
      window.removeEventListener('dev-role-changed', refresh);
    };
  }, [svc]);

  const handleSwitch = (key: string) => {
    svc.switchActiveUser(key);
    toast({ title: 'Utilisateur actif changé', description: users[key].email });
  };

  const handleDelete = (key: string) => {
    try {
      svc.deleteUser(key);
      setUsers(svc.getAllUsers());
      toast({ title: 'Utilisateur supprimé' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const handleSaveDraft = () => {
    if (!draftKey.trim() || !draft.email.trim()) {
      toast({ title: 'Clé et email requis', variant: 'destructive' });
      return;
    }
    svc.addUser(draftKey.trim(), draft);
    setUsers(svc.getAllUsers());
    setDialogOpen(false);
    setDraft(emptyDraft());
    setDraftKey('');
    toast({ title: 'Utilisateur ajouté' });
  };

  const handleExport = () => {
    const blob = new Blob([svc.exportUsers()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dev_users.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    try {
      svc.importUsers(text);
      setUsers(svc.getAllUsers());
      toast({ title: 'Utilisateurs importés' });
    } catch (e: any) {
      toast({ title: 'Import échoué', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Utilisateurs locaux (DEV_USERS)</CardTitle>
            <CardDescription>
              Profils utilisés en Mode B (auth locale + données self-hostées) ou Mode C (offline).
              Les modifications sont persistées dans <code>localStorage.dev_users_overrides</code>.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Exporter
            </Button>
            <label>
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                  e.target.value = '';
                }}
              />
              <Button variant="outline" size="sm" asChild>
                <span><Upload className="mr-2 h-4 w-4" /> Importer</span>
              </Button>
            </label>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau profil DEV</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Clé (identifiant interne)</Label><Input value={draftKey} onChange={(e) => setDraftKey(e.target.value)} placeholder="ex: agent" /></div>
                  <div><Label>Email</Label><Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
                  <div><Label>Mot de passe</Label><Input value={draft.password ?? ''} onChange={(e) => setDraft({ ...draft, password: e.target.value })} /></div>
                  <div><Label>Nom complet</Label><Input value={draft.user_metadata.full_name} onChange={(e) => setDraft({ ...draft, user_metadata: { ...draft.user_metadata, full_name: e.target.value } })} /></div>
                  <div><Label>Rôle</Label><Input value={draft.user_metadata.role} onChange={(e) => setDraft({ ...draft, user_metadata: { ...draft.user_metadata, role: e.target.value } })} /></div>
                  <div><Label>Permissions (séparées par virgules)</Label>
                    <Input
                      value={(draft.permissions ?? []).join(',')}
                      onChange={(e) => setDraft({ ...draft, permissions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    />
                  </div>
                  <div><Label>Équipes (séparées par virgules)</Label>
                    <Input
                      value={(draft.teams ?? []).join(',')}
                      onChange={(e) => setDraft({ ...draft, teams: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    />
                  </div>
                </div>
                <DialogFooter><Button onClick={handleSaveDraft}>Enregistrer</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clé</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Équipes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(users).map(([key, u]) => {
              const isActive = key === activeRole || u.user_metadata.role === activeRole;
              return (
                <TableRow key={key}>
                  <TableCell className="font-mono text-xs">{key}{isActive && <Badge className="ml-2">actif</Badge>}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Badge variant="secondary">{u.user_metadata.role}</Badge></TableCell>
                  <TableCell className="text-xs">{(u.permissions ?? []).join(', ') || '—'}</TableCell>
                  <TableCell className="text-xs">{(u.teams ?? []).join(', ') || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleSwitch(key)} disabled={isActive}>
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(key)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
