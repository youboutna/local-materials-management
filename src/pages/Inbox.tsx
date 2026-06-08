import React, { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  Archive,
  Trash2,
  ShieldAlert,
  Search,
  RefreshCw,
} from "lucide-react";
import {
  useContactMessagesHex,
  useContactMessageStatsHex,
  useContactMessageActionsHex,
} from "@/hooks/hexagonal/useContactMessagesHex";
import { useCurrentUserRoles } from "@/hooks/useUserRoles";
import type { ContactMessage } from "@/domain/entities/ContactMessage";

type FilterTab = "all" | "unread" | "spam" | "archived";

const Inbox: React.FC = () => {
  const { hasAnyRole, isLoading: rolesLoading } = useCurrentUserRoles();
  const canAccess = hasAnyRole(["admin", "director", "manager"]);

  const [tab, setTab] = useState<FilterTab>("unread");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMessage, setOpenMessage] = useState<ContactMessage | null>(null);

  const filters = useMemo(() => {
    switch (tab) {
      case "unread":
        return { isRead: false, isArchived: false, isSpam: false };
      case "spam":
        return { isSpam: true };
      case "archived":
        return { isArchived: true };
      default:
        return { isArchived: false, isSpam: false };
    }
  }, [tab]);

  const { data: messages = [], isLoading, isError, refetch, isFetching } =
    useContactMessagesHex(filters);
  const { data: stats } = useContactMessageStatsHex();
  const actions = useContactMessageActionsHex();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return messages;
    return messages.filter(
      (m) =>
        m.subject.toLowerCase().includes(term) ||
        m.senderName.toLowerCase().includes(term) ||
        m.senderEmail.toLowerCase().includes(term) ||
        m.message.toLowerCase().includes(term)
    );
  }, [messages, search]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((m) => m.id))
    );

  const openAndMarkRead = (msg: ContactMessage) => {
    setOpenMessage(msg);
    if (!msg.isRead) actions.markAsRead.mutate(msg.id);
  };

  if (rolesLoading) {
    return (
      <AppLayout pageTitle="Messagerie">
        <Skeleton className="h-64 w-full" />
      </AppLayout>
    );
  }

  if (!canAccess) {
    return (
      <AppLayout pageTitle="Messagerie">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Accès restreint aux administrateurs.
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const selectedArray = Array.from(selectedIds);
  const hasSelection = selectedArray.length > 0;

  return (
    <AppLayout
      pageTitle="📬 Messagerie - Réception"
      pageDescription={`${stats?.unreadMessages ?? 0} non lu(s) · ${stats?.totalMessages ?? 0} au total`}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-busy={isFetching}
          aria-label="Rafraîchir la boîte de réception"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
          Rafraîchir
        </Button>
      }
    >
      <div className="space-y-4">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as FilterTab); setSelectedIds(new Set()); }}>
          <TabsList aria-label="Filtrer les messages">
            <TabsTrigger value="unread">
              Non lus {stats?.unreadMessages ? <Badge variant="secondary" className="ml-2">{stats.unreadMessages}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="archived">
              Archivés {stats?.archivedMessages ? <Badge variant="secondary" className="ml-2">{stats.archivedMessages}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger value="spam">
              Spam {stats?.spamMessages ? <Badge variant="destructive" className="ml-2">{stats.spamMessages}</Badge> : null}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                placeholder="Rechercher (objet, expéditeur, contenu)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Rechercher dans les messages"
              />
            </div>
            {hasSelection && (
              <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Actions groupées">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => actions.bulkMarkRead.mutate(selectedArray, { onSuccess: () => setSelectedIds(new Set()) })}
                  aria-label="Marquer la sélection comme lue"
                >
                  <MailOpen className="h-4 w-4 mr-1" aria-hidden="true" /> Lu
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => actions.bulkArchive.mutate(selectedArray, { onSuccess: () => setSelectedIds(new Set()) })}
                  aria-label="Archiver la sélection"
                >
                  <Archive className="h-4 w-4 mr-1" aria-hidden="true" /> Archiver
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Supprimer ${selectedArray.length} message(s) ?`)) {
                      actions.bulkDelete.mutate(selectedArray, { onSuccess: () => setSelectedIds(new Set()) });
                    }
                  }}
                  aria-label="Supprimer la sélection"
                >
                  <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" /> Supprimer
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : isError ? (
              <p className="text-destructive">Erreur de chargement des messages.</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <InboxIcon className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                <p>Aucun message dans cette catégorie.</p>
              </div>
            ) : (
              <ul className="divide-y" aria-label="Liste des messages">
                <li className="flex items-center gap-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Checkbox
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Tout sélectionner"
                  />
                  <span>Sélectionner tout</span>
                </li>
                {filtered.map((msg) => {
                  const selected = selectedIds.has(msg.id);
                  return (
                    <li key={msg.id} className="flex items-start gap-3 py-3">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleSelect(msg.id)}
                        aria-label={`Sélectionner le message de ${msg.senderName}`}
                      />
                      <button
                        type="button"
                        className="flex-1 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-1"
                        onClick={() => openAndMarkRead(msg)}
                        aria-label={`Ouvrir le message "${msg.subject}" de ${msg.senderName}`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          {msg.isRead ? (
                            <MailOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          ) : (
                            <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                          )}
                          <span className={msg.isRead ? "text-foreground" : "font-semibold text-foreground"}>
                            {msg.senderName}
                          </span>
                          <span className="text-xs text-muted-foreground">&lt;{msg.senderEmail}&gt;</span>
                          {msg.isSpam && (
                            <Badge variant="destructive" className="text-[10px]">SPAM</Badge>
                          )}
                          {msg.isArchived && (
                            <Badge variant="outline" className="text-[10px]">Archivé</Badge>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${msg.isRead ? "text-muted-foreground" : "font-medium"}`}>
                          {msg.subject}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {msg.message}
                        </p>
                      </button>
                      <time
                        dateTime={msg.createdAt.toISOString()}
                        className="text-xs text-muted-foreground whitespace-nowrap mt-1"
                      >
                        {msg.createdAt.toLocaleDateString("fr-FR")}
                      </time>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!openMessage} onOpenChange={(o) => !o && setOpenMessage(null)}>
        <DialogContent className="max-w-2xl">
          {openMessage && (
            <>
              <DialogHeader>
                <DialogTitle>{openMessage.subject}</DialogTitle>
                <DialogDescription>
                  De <strong>{openMessage.senderName}</strong>{" "}
                  &lt;
                  <a href={`mailto:${openMessage.senderEmail}`} className="underline">
                    {openMessage.senderEmail}
                  </a>
                  &gt;
                  {openMessage.senderPhone && <> · {openMessage.senderPhone}</>}
                  {" · "}
                  {openMessage.createdAt.toLocaleString("fr-FR")}
                </DialogDescription>
              </DialogHeader>
              <div className="whitespace-pre-wrap text-sm bg-muted rounded p-4 max-h-96 overflow-y-auto">
                {openMessage.message}
              </div>
              <DialogFooter className="flex-wrap gap-2">
                <Button
                  variant="outline"
                  asChild
                >
                  <a href={`mailto:${openMessage.senderEmail}?subject=Re: ${encodeURIComponent(openMessage.subject)}`}>
                    <Mail className="h-4 w-4 mr-1" aria-hidden="true" /> Répondre
                  </a>
                </Button>
                {!openMessage.isSpam && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      actions.markAsSpam.mutate(openMessage.id);
                      setOpenMessage(null);
                    }}
                    aria-label="Marquer comme spam"
                  >
                    <ShieldAlert className="h-4 w-4 mr-1" aria-hidden="true" /> Spam
                  </Button>
                )}
                {!openMessage.isArchived && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      actions.archive.mutate(openMessage.id);
                      setOpenMessage(null);
                    }}
                    aria-label="Archiver le message"
                  >
                    <Archive className="h-4 w-4 mr-1" aria-hidden="true" /> Archiver
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Supprimer ce message ?")) {
                      actions.remove.mutate(openMessage.id);
                      setOpenMessage(null);
                    }
                  }}
                  aria-label="Supprimer le message"
                >
                  <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" /> Supprimer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Inbox;
