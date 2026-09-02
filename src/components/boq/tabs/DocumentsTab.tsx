import React from 'react';
import { FileCheck2, FileText, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
interface Props { documentId: string; content?: React.ReactNode; }
export function DocumentsTab({ documentId, content }: Props) { return <div className="grid gap-4 md:grid-cols-3">{content ?? <><DocCard icon={FileText} title="Document PDF" detail="Expression de besoin prête à générer" /><DocCard icon={FileCheck2} title="Factur-X" detail="XML CII associé au document" /><DocCard icon={History} title="Historique" detail={`Document ${documentId.slice(0, 12).toUpperCase()}`} /></>}</div>; }
function DocCard({ icon: Icon, title, detail }: { icon: React.ElementType; title: string; detail: string }) { return <Card><CardHeader className="flex-row items-center gap-2 space-y-0"><Icon className="h-4 w-4" /><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent><Badge variant="outline">Disponible depuis les actions du document</Badge><p className="mt-2 text-xs text-muted-foreground">{detail}</p></CardContent></Card>; }
