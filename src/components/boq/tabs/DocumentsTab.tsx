import React from 'react';
import { FileCheck2, FileText, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { T } from '@/components/i18n/T';
import { useLanguage } from '@/contexts/LanguageContext';
interface Props { documentId: string; content?: React.ReactNode; }
export function DocumentsTab({ documentId, content }: Props) {
  const { t } = useLanguage(); return <div className="grid gap-4 md:grid-cols-3">{content ?? <><DocCard icon={FileText} title={t('auto.documentstab.document_pdf')} detail="Expression de besoin prête à générer" /><DocCard icon={FileCheck2} title={t('auto.documentstab.factur_x')} detail="XML CII associé au document" /><DocCard icon={History} title={t('auto.documentstab.historique')} detail={`Document ${documentId.slice(0, 12).toUpperCase()}`} /></>}</div>; }
function DocCard({ icon: Icon, title, detail }: { icon: React.ElementType; title: string; detail: string }) { return <Card><CardHeader className="flex-row items-center gap-2 space-y-0"><Icon className="h-4 w-4" /><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent><Badge variant="outline"><T k="auto.documentstab.disponible_depuis_les_actions_du_document" fallback="Disponible depuis les actions du document" /></Badge><p className="mt-2 text-xs text-muted-foreground">{detail}</p></CardContent></Card>; }
