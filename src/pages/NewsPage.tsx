/**
 * NewsPage - Public page for viewing news articles
 * Accessible to all users, shows only published articles
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useArticlesHex } from '@/hooks/hexagonal/useArticlesHex';
import { ArticleDTO } from '@/dtos/entities/ArticleDTO';
import { Calendar, ArrowLeft, Building2, FileText } from 'lucide-react';
import { sanitizeArticleHtml } from '@/utils/sanitizeArticleHtml';
import { useDocumentViewer } from '@/components/documents/viewer';

export function NewsPage() {
  const { slug } = useParams<{ slug?: string }>();

  // If slug is provided, show single article
  if (slug) {
    return <ArticleDetail slug={slug} />;
  }

  // Otherwise show article list
  return <ArticleList />;
}

function ArticleList() {
  const { useAllArticles } = useArticlesHex();
  const { data: articles, isLoading, error } = useAllArticles('published');

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div role="alert" className="p-8 text-destructive">Unable to load news articles. Please try again.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">News & Updates</h1>
          <p className="text-muted-foreground">Latest news and announcements</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles?.map((article) => (
            <Link key={article.id} to={`/news/${article.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                  </div>
                  <CardTitle className="text-xl line-clamp-2">{article.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{article.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  {article.projectName && article.showProjectInfo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Building2 className="h-4 w-4" />
                      <span>Related to: {article.projectName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Read more</Badge>
                    {!!article.documentCount && article.documentCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{article.documentCount}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {articles?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No news articles available at this time.
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleDetail({ slug }: { slug: string }) {
  const { useArticleBySlug } = useArticlesHex();
  const { data: article, isLoading, error } = useArticleBySlug(slug);
  const { openDocument } = useDocumentViewer();

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 text-center">
          <p role="alert" className="mb-4 text-destructive">Unable to load this article. Please try again.</p>
          <Link to="/news">
            <Button>Back to News</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <Link to="/news">
              <Button>Back to News</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/news">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to News
          </Button>
        </Link>

        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4" />
              {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
            </div>
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
            <p className="text-xl text-muted-foreground">{article.summary}</p>
          </header>

          {article.showProjectInfo && article.projectName && (
            <Card className="mb-6 bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Related Project</div>
                    <div className="font-semibold">{article.projectName}</div>
                    {article.projectProgress !== undefined && (
                      <div className="text-sm text-muted-foreground">
                        Progress: {article.projectProgress}%
                      </div>
                    )}
                    {article.projectDuration && (
                      <div className="text-sm text-muted-foreground">
                        Duration: {article.projectDuration}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div 
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }}
          />

          {article.documents && article.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Related Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {article.documents.map((doc) => (
                    <Button
                      key={doc.id}
                      type="button"
                      variant="ghost"
                      className="flex h-auto w-full items-center justify-start gap-2 p-3 hover:bg-muted"
                      onClick={() => openDocument({
                        id: doc.id,
                        title: doc.title,
                        documentType: doc.type,
                        fileName: doc.fileName,
                        fileUrl: doc.url,
                        mimeType: doc.mimeType,
                        fileSize: doc.fileSize,
                        status: doc.status,
                      }, { allowStatusChange: false })}
                    >
                      <FileText className="h-4 w-4" />
                      <span>{doc.title}</span>
                      <Badge variant="outline" className="ml-auto">{doc.type}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </article>
      </div>
    </div>
  );
}
