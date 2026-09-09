/**
 * DebugPanel — consultation et téléchargement du journal applicatif.
 * Visible uniquement en mode debug (development / local-bypass).
 */

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bug, Download, RefreshCw, Trash2, X } from 'lucide-react';
import { isDebugMode, logger, type LogEntry, type LogLevel } from '@/application/services/LoggerService';
import { cn } from '@/lib/utils';
import { T } from '@/components/i18n/T';
import { useLanguage } from '@/contexts/LanguageContext';

const LEVEL_BADGE: Record<LogLevel, string> = {
  debug: 'bg-muted text-muted-foreground',
  info: 'bg-secondary text-secondary-foreground',
  warning: 'bg-warning/15 text-warning-foreground',
  error: 'bg-destructive/15 text-destructive',
  critical: 'bg-destructive text-destructive-foreground',
};

type FilterKey = 'all' | 'errors' | 'warnings';

export const DebugPanel = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [isOpen, setIsOpen] = useState(false);

  const refresh = useCallback(() => setLogs(logger.getLogs()), []);

  useEffect(() => {
    if (!isDebugMode()) return;
    refresh();
    const interval = window.setInterval(refresh, 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  if (!isDebugMode()) return null;

  const stats = logger.getStats();
  const filtered = logs.filter((log) =>
    filter === 'all'
      ? true
      : filter === 'errors'
        ? log.level === 'error' || log.level === 'critical'
        : log.level === 'warning'
  );

  return (
    <div className="fixed bottom-4 right-4 z-[60] print:hidden">
      {!isOpen ? (
        <Button size="sm" variant="outline" className="shadow-lg" onClick={() => setIsOpen(true)}>
          <Bug className="h-4 w-4 mr-2" />
          Debug ({stats.total})
        </Button>
      ) : (
        <Card className="w-[min(92vw,720px)] shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bug className="h-4 w-4" />
              <T k="auto.debugpanel.journal_applicatif" fallback="Journal applicatif" />
              <Badge variant="outline">{stats.total}</Badge>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={refresh} title={t('auto.debugpanel.rafraichir')}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => logger.downloadLogs('jsonl')}
                title={t('auto.debugpanel.telecharger_jsonl')}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  logger.clear();
                  setLogs([]);
                }}
                title={t('auto.debugpanel.vider')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} title={t('auto.debugpanel.fermer')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterKey)}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs">
                  Tous ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="errors" className="text-xs">
                  Erreurs ({stats.byLevel.error + stats.byLevel.critical})
                </TabsTrigger>
                <TabsTrigger value="warnings" className="text-xs">
                  Alertes ({stats.byLevel.warning})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <ScrollArea className="h-[320px] rounded-md border">
              {filtered.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground"><T k="auto.debugpanel.aucune_entree" fallback="Aucune entrée" /></p>
              ) : (
                <ul className="divide-y">
                  {filtered.map((log) => (
                    <li key={log.id} className="p-2 text-xs space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge className={cn('text-[10px]', LEVEL_BADGE[log.level])}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {log.source}
                        </Badge>
                        {log.errorCode && (
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {log.errorCode}
                          </Badge>
                        )}
                      </div>
                      <p className="break-words">{log.errorLabel ?? log.message}</p>
                      {log.errorHint && (
                        <p className="text-muted-foreground">{log.errorHint}</p>
                      )}
                      {log.errorLabel && log.message !== log.errorLabel && (
                        <p className="font-mono text-[10px] text-muted-foreground break-all">
                          {log.message}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DebugPanel;
