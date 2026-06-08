import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInspectionHex, useInspectionsHex } from '@/hooks/hexagonal';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import { useLanguage } from '@/contexts/LanguageContext';

const InspectionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  const { inspection, isLoading } = useInspectionHex(id);
  const { updateInspection } = useInspectionsHex();

  const [formData, setFormData] = useState({
    projectId: '',
    inspector: '',
    date: '',
    status: 'scheduled',
    progressAtInspection: 0,
    comments: ''
  });



  const statusOptions = [
    { value: 'scheduled', label: t('inspection.status.scheduled'), icon: Clock },
    { value: 'in_progress', label: t('inspection.status.in_progress'), icon: Clock },
    { value: 'approved', label: t('inspection.status.approved'), icon: CheckCircle },
    { value: 'rejected', label: t('inspection.status.rejected'), icon: XCircle },
    { value: 'requires_changes', label: t('inspection.status.requires_changes'), icon: AlertTriangle }
  ];

  // Update form when inspection loads
  useEffect(() => {
    if (inspection) {
      setFormData({
        projectId: inspection.projectId ?? '',
        inspector: inspection.inspector ?? '',
        date: inspection.date ? new Date(inspection.date).toISOString().split('T')[0] : '',
        status: inspection.status ?? 'scheduled',
        progressAtInspection: inspection.progressAtInspection ?? 0,
        comments: inspection.comments ?? ''
      });
    }
  }, [inspection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !formData.inspector || !formData.date) {
      toast({
        title: t('inspection.common.error'),
        description: t('inspection.common.required_fields'),
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      
      await updateInspection({
        id,
        data: {
          inspector: formData.inspector,
          date: formData.date,
          status: formData.status as 'scheduled' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'requires_changes' | 'pending' | 'cancelled',
          ...({ progressAtInspection: formData.progressAtInspection } as Record<string, unknown>),
          comments: formData.comments,
        },
      });
      
      toast({
        title: t('inspection.common.success'),
        description: t('inspection.common.update_success')
      });
      
      navigate(`/inspections/${id}`);
    } catch (error) {
      console.error('Error updating inspection:', error);
      toast({
        title: t('inspection.common.error'),
        description: t('inspection.common.update_error'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return <Navigate to="/inspection-monitoring" replace />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">{t('inspection.common.loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('inspection.common.back')}
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('inspection.edit.title')}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate(`/inspections/${id}`)}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Consulter
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project">{t('inspection.common.project_label')}</Label>
                <ProjectSelector
                  value={formData.projectId}
                  onChange={(value) => setFormData(prev => ({ ...prev, projectId: value || '' }))}
                  disabled
                />
              </div>
              
              <div>
                <Label htmlFor="inspector">{t('inspection.common.inspector_required')}</Label>
                <Input
                  id="inspector"
                  value={formData.inspector}
                  onChange={(e) => setFormData(prev => ({ ...prev, inspector: e.target.value }))}
                  required
                  placeholder={t('inspection.common.inspector_placeholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">{t('inspection.common.date_label')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="status">{t('inspection.common.status_label')}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="progress">{t('inspection.common.progress_label')}</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progressAtInspection}
                  onChange={(e) => setFormData(prev => ({ ...prev, progressAtInspection: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="comments">{t('inspection.common.comments_label')}</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                rows={4}
                placeholder={t('inspection.common.comments_placeholder')}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                {t('inspection.common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('inspection.common.saving') : t('inspection.common.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionEdit;
