/**
 * NewsletterCampaignsAdminPage - Admin interface for newsletter campaign management
 * Provides CRUD operations for email campaigns
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNewsletterCampaignsHex } from '@/hooks/hexagonal/useNewsletterCampaignsHex';
import { useNewsletterSubscribersHex } from '@/hooks/hexagonal/useNewsletterSubscribersHex';
import { NewsletterCampaignDTO, CreateCampaignDTO, UpdateCampaignDTO, CampaignStatus } from '@/dtos/entities/NewsletterCampaignDTO';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Plus, Edit, Trash2, Send, Calendar, Search, Filter, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/hexagonal/useAuth';

export function NewsletterCampaignsAdminPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const {
    useAllCampaigns,
    useCampaignById,
    useCreateCampaign,
    useUpdateCampaign,
    useScheduleCampaign,
    useSendCampaign,
    useDeleteCampaign,
  } = useNewsletterCampaignsHex();

  const { useCountActiveSubscribers } = useNewsletterSubscribersHex();

  const { data: campaigns, isLoading, error: campaignsError } = useAllCampaigns(statusFilter === 'all' ? undefined : statusFilter);
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
  const visibleCampaigns = campaigns?.filter((campaign) =>
    !normalizedSearchTerm ||
    campaign.subject.toLocaleLowerCase().includes(normalizedSearchTerm) ||
    campaign.preheader?.toLocaleLowerCase().includes(normalizedSearchTerm)
  );
  const { data: selectedCampaign } = useCampaignById(selectedCampaignId || '');
  const { data: activeSubscriberCount } = useCountActiveSubscribers();

  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const scheduleMutation = useScheduleCampaign();
  const sendMutation = useSendCampaign();
  const deleteMutation = useDeleteCampaign();

  const handleCreate = async (data: CreateCampaignDTO) => {
    if (!user?.id) {
      toast({ title: 'You must be signed in to create a campaign', variant: 'destructive' });
      return;
    }
    try {
      await createMutation.mutateAsync({ dto: data, authorId: user.id });
      setIsCreateDialogOpen(false);
      toast({ title: 'Campaign created successfully' });
    } catch (error) {
      toast({ title: 'Failed to create campaign', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    }
  };

  const handleUpdate = async (data: UpdateCampaignDTO) => {
    if (!selectedCampaignId) return;
    try {
      await updateMutation.mutateAsync({ id: selectedCampaignId, dto: data });
      setIsEditDialogOpen(false);
      setSelectedCampaignId(null);
      toast({ title: 'Campaign updated successfully' });
    } catch (error) {
      toast({ title: 'Failed to update campaign', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    }
  };

  const handleSchedule = async (id: string, scheduledDate: string) => {
    try {
      await scheduleMutation.mutateAsync({ id, scheduledDate });
      toast({ title: 'Campaign scheduled successfully' });
    } catch (error) {
      toast({ title: 'Failed to schedule campaign', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm(`Send this campaign to ${activeSubscriberCount || 0} active subscribers?`)) return;
    try {
      await sendMutation.mutateAsync(id);
      toast({ title: 'Campaign sent successfully' });
    } catch (error) {
      toast({ title: 'Failed to send campaign', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Campaign deleted successfully' });
    } catch (error) {
      toast({ title: 'Failed to delete campaign', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    }
  };

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'sending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Newsletter Campaigns</h1>
          <p className="text-muted-foreground">Manage email campaigns and newsletters</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{activeSubscriberCount || 0} Active Subscribers</span>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
                <DialogDescription>Create a new email campaign</DialogDescription>
              </DialogHeader>
              <CampaignForm onSubmit={handleCreate} onCancel={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CampaignStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {campaignsError && (
          <div role="alert" className="py-8 text-center text-destructive">
            Failed to load campaigns. Please try again.
          </div>
        )}
        {visibleCampaigns?.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl">{campaign.subject}</CardTitle>
                  {campaign.preheader && (
                    <CardDescription className="mt-1">{campaign.preheader}</CardDescription>
                  )}
                </div>
                <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                </div>
                {campaign.scheduledFor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span>{new Date(campaign.scheduledFor).toLocaleString()}</span>
                  </div>
                )}
                {campaign.sentAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sent:</span>
                    <span>{new Date(campaign.sentAt).toLocaleString()}</span>
                  </div>
                )}
                {campaign.status === 'sent' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span>{campaign.successRate.toFixed(1)}%</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recipients:</span>
                  <span>{campaign.totalRecipients}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {campaign.status !== 'sent' && campaign.status !== 'sending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCampaignId(campaign.id);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {campaign.status === 'draft' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const date = prompt('Enter scheduled date (ISO format):', new Date(Date.now() + 86400000).toISOString());
                        if (date) handleSchedule(campaign.id, date);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSend(campaign.id)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </Button>
                  </>
                )}
                {campaign.status !== 'sent' && campaign.status !== 'sending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {visibleCampaigns?.length === 0 && !campaignsError && (
          <div className="py-8 text-center text-muted-foreground">No campaigns match your search.</div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>Edit the selected campaign</DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <CampaignForm
              campaign={selectedCampaign}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedCampaignId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Campaign Form Component
interface CampaignFormProps {
  campaign?: NewsletterCampaignDTO;
  onSubmit: (data: CreateCampaignDTO) => void;
  onCancel: () => void;
}

function CampaignForm({ campaign, onSubmit, onCancel }: CampaignFormProps) {
  const [subject, setSubject] = useState(campaign?.subject || '');
  const [preheader, setPreheader] = useState(campaign?.preheader || '');
  const [content, setContent] = useState(campaign?.content || '');
  const [scheduledFor, setScheduledFor] = useState(
    campaign?.scheduledFor ? new Date(campaign.scheduledFor).toISOString().slice(0, 16) : '',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateCampaignDTO = {
      subject,
      preheader,
      content,
      scheduledFor: scheduledFor || undefined,
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preheader">Preheader (Optional)</Label>
        <Input
          id="preheader"
          value={preheader}
          onChange={(e) => setPreheader(e.target.value)}
          placeholder="Short preview text"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          minHeight={300}
        />
      </div>

      {!campaign && (
        <div className="space-y-2">
          <Label htmlFor="scheduledFor">Schedule For (Optional)</Label>
          <Input
            id="scheduledFor"
            type="datetime-local"
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
          />
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{campaign ? 'Update' : 'Create'}</Button>
      </DialogFooter>
    </form>
  );
}
