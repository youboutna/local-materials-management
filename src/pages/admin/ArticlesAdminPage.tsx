/**
 * ArticlesAdminPage - Admin interface for article management
 * Provides CRUD operations for news articles
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useArticlesHex } from '@/hooks/hexagonal/useArticlesHex';
import { ArticleDTO, CreateArticleDTO, UpdateArticleDTO, ArticleStatus } from '@/dtos/entities/ArticleDTO';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import EnhancedProjectSelector from '@/components/selectors/EnhancedProjectSelector';
import DocumentSelector from '@/components/selectors/DocumentSelector';
import { Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/hexagonal/useAuth';

export function ArticlesAdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    useAllArticles,
    useArticleById,
    useCreateArticle,
    useUpdateArticle,
    usePublishArticle,
    useArchiveArticle,
    useDeleteArticle,
  } = useArticlesHex();

  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // Queries
  const { data: articles, isLoading } = useAllArticles(statusFilter === 'all' ? undefined : statusFilter);
  const { data: selectedArticle } = useArticleById(selectedArticleId || '');

  // Mutations
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const publishMutation = usePublishArticle();
  const archiveMutation = useArchiveArticle();
  const deleteMutation = useDeleteArticle();

  const handleCreate = async (data: CreateArticleDTO) => {
    if (!user?.id) {
      toast({ title: 'You must be signed in to create an article', variant: 'destructive' });
      return;
    }
    try {
      await createMutation.mutateAsync({ dto: data, authorId: user.id });
      setIsCreateDialogOpen(false);
      toast({ title: 'Article created successfully' });
    } catch (error) {
      toast({ title: 'Failed to create article', variant: 'destructive' });
    }
  };

  const handleUpdate = async (data: UpdateArticleDTO) => {
    if (!selectedArticleId) return;
    try {
      await updateMutation.mutateAsync({ id: selectedArticleId, dto: data });
      setIsEditDialogOpen(false);
      setSelectedArticleId(null);
      toast({ title: 'Article updated successfully' });
    } catch (error) {
      toast({ title: 'Failed to update article', variant: 'destructive' });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishMutation.mutateAsync(id);
      toast({ title: 'Article published successfully' });
    } catch (error) {
      toast({ title: 'Failed to publish article', variant: 'destructive' });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
      toast({ title: 'Article archived successfully' });
    } catch (error) {
      toast({ title: 'Failed to archive article', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Article deleted successfully' });
    } catch (error) {
      toast({ title: 'Failed to delete article', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: ArticleStatus) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
          <h1 className="text-3xl font-bold">Articles</h1>
          <p className="text-muted-foreground">Manage news articles and blog posts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Article</DialogTitle>
              <DialogDescription>Create a new news article or blog post</DialogDescription>
            </DialogHeader>
            <ArticleForm onSubmit={handleCreate} onCancel={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ArticleStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {articles?.map((article) => (
          <Card key={article.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl">{article.title}</CardTitle>
                  <CardDescription className="mt-2">{article.summary}</CardDescription>
                </div>
                <Badge className={getStatusColor(article.status)}>{article.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(article.createdAt).toLocaleDateString()}
                  {article.publishedAt && ` • Published: ${new Date(article.publishedAt).toLocaleDateString()}`}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/news/${article.slug}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedArticleId(article.id);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {article.status === 'draft' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePublish(article.id)}
                    >
                      Publish
                    </Button>
                  )}
                  {article.status === 'published' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(article.id)}
                    >
                      Archive
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(article.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
            <DialogDescription>Edit the selected article</DialogDescription>
          </DialogHeader>
          {selectedArticle && (
            <ArticleForm
              article={selectedArticle}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedArticleId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Article Form Component
interface ArticleFormProps {
  article?: ArticleDTO;
  onSubmit: (data: CreateArticleDTO) => void;
  onCancel: () => void;
}

function ArticleForm({ article, onSubmit, onCancel }: ArticleFormProps) {
  const [title, setTitle] = useState(article?.title || '');
  const [summary, setSummary] = useState(article?.summary || '');
  const [content, setContent] = useState(article?.content || '');
  const [projectId, setProjectId] = useState(article?.projectId);
  const [documentIds, setDocumentIds] = useState<string[]>(article?.documentIds || []);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>();
  const [showProjectInfo, setShowProjectInfo] = useState(article?.showProjectInfo || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateArticleDTO = {
      title,
      summary,
      content,
      projectId,
      documentIds,
      showProjectInfo,
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          required
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

      <Tabs defaultValue="project">
        <TabsList>
          <TabsTrigger value="project">Project</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="space-y-4">
          <EnhancedProjectSelector
            value={projectId}
            onChange={(id) => setProjectId(id)}
            label="Associated Project (Optional)"
            showProjectDetails
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <DocumentSelector
            value={selectedDocumentId}
            onChange={(documentId) => {
              if (documentId && !documentIds.includes(documentId)) {
                setDocumentIds((currentIds) => [...currentIds, documentId]);
              }
              setSelectedDocumentId(undefined);
            }}
            label="Associated Documents"
          />
          <div className="flex flex-wrap gap-2">
            {documentIds.map((documentId) => (
              <Badge key={documentId} variant="secondary" className="gap-2">
                {documentId}
                <button
                  type="button"
                  aria-label={`Remove document ${documentId}`}
                  onClick={() => setDocumentIds((currentIds) => currentIds.filter((id) => id !== documentId))}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showProjectInfo"
              checked={showProjectInfo}
              onChange={(e) => setShowProjectInfo(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="showProjectInfo">Show project information in public view</Label>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{article ? 'Update' : 'Create'}</Button>
      </DialogFooter>
    </form>
  );
}
