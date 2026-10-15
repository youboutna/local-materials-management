/**
 * NewsletterSubscribersAdminPage - Admin interface for newsletter subscriber management
 * Provides CRUD operations for newsletter subscribers
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNewsletterSubscribersHex } from '@/hooks/hexagonal/useNewsletterSubscribersHex';
import { SubscriberStatus } from '@/dtos/entities/NewsletterSubscriberDTO';
import { Trash2, Search, Filter, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function NewsletterSubscribersAdminPage() {
  const [statusFilter, setStatusFilter] = useState<SubscriberStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    useAllSubscribers,
    useSearchSubscribers,
    useUnsubscribe,
    useDeleteSubscriber,
    useCountActiveSubscribers,
  } = useNewsletterSubscribersHex();

  const { data: subscribers, isLoading, error: subscribersError } = useAllSubscribers(statusFilter === 'all' ? undefined : statusFilter);
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    error: searchError,
  } = useSearchSubscribers(normalizedSearchTerm);
  const { data: activeCount } = useCountActiveSubscribers();

  const unsubscribeMutation = useUnsubscribe();
  const deleteMutation = useDeleteSubscriber();

  const handleUnsubscribe = async (id: string) => {
    try {
      await unsubscribeMutation.mutateAsync(id);
      toast({ title: 'Subscriber unsubscribed successfully' });
    } catch (error) {
      toast({ title: 'Failed to unsubscribe', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Subscriber deleted successfully' });
    } catch (error) {
      toast({ title: 'Failed to delete subscriber', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    }
  };

  const getStatusColor = (status: SubscriberStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending_confirmation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'unsubscribed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filterByStatus = (subscriber: NonNullable<typeof subscribers>[number]) =>
    (statusFilter === 'all' || subscriber.status === statusFilter) &&
    (!normalizedSearchTerm || subscriber.email.toLocaleLowerCase().includes(normalizedSearchTerm));
  const displaySubscribers = normalizedSearchTerm.length > 2
    ? searchResults?.filter(filterByStatus)
    : subscribers?.filter(filterByStatus);

  if (isLoading || (normalizedSearchTerm.length > 2 && isSearchLoading)) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Newsletter Subscribers</h1>
          <p className="text-muted-foreground">Manage newsletter subscriptions</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg font-semibold">{activeCount || 0} Active</span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SubscriberStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending_confirmation">Pending</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {(normalizedSearchTerm.length > 2 ? searchError : subscribersError) && (
          <div role="alert" className="py-8 text-center text-destructive">
            Failed to load subscribers. Please try again.
          </div>
        )}
        {displaySubscribers?.map((subscriber) => (
          <Card key={subscriber.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{subscriber.email}</CardTitle>
                  <CardDescription className="mt-2">
                    Subscribed: {new Date(subscriber.subscribedAt).toLocaleDateString()}
                    {subscriber.source && ` • Source: ${subscriber.source}`}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(subscriber.status)}>{subscriber.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {subscriber.confirmedAt && `Confirmed: ${new Date(subscriber.confirmedAt).toLocaleDateString()}`}
                  {subscriber.unsubscribedAt && ` • Unsubscribed: ${new Date(subscriber.unsubscribedAt).toLocaleDateString()}`}
                </div>
                <div className="flex gap-2">
                  {subscriber.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnsubscribe(subscriber.id)}
                    >
                      Unsubscribe
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(subscriber.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {displaySubscribers?.length === 0 && !(normalizedSearchTerm.length > 2 ? searchError : subscribersError) && (
        <div className="text-center py-12 text-muted-foreground">
          No subscribers found
        </div>
      )}
    </div>
  );
}
