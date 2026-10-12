/**
 * useArticlesHex - Hexagonal Hook for Articles
 * React hook for article management using hexagonal architecture
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArticleService } from '@/application/services/ArticleService';
import { CreateArticleDTO, UpdateArticleDTO, ArticleStatus } from '@/dtos/entities/ArticleDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { ProjectService } from '@/application/services/ProjectService';
import { DocumentService } from '@/application/services/DocumentService';

const articleService = new ArticleService(
  RepositoryFactory.getArticleRepository(),
  new ProjectService(RepositoryFactory.getProjectRepository()),
  new DocumentService(RepositoryFactory.getDocumentRepository()),
);

export function useArticlesHex() {
  const queryClient = useQueryClient();

  // Query: Get all articles
  const useAllArticles = (status?: ArticleStatus) => {
    return useQuery({
      queryKey: ['articles', status],
      queryFn: () => articleService.getAllArticles(status),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Query: Get article by ID
  const useArticleById = (id: string) => {
    return useQuery({
      queryKey: ['article', id],
      queryFn: () => articleService.getArticleById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Query: Get article by slug (public access)
  const useArticleBySlug = (slug: string) => {
    return useQuery({
      queryKey: ['article', 'slug', slug],
      queryFn: () => articleService.getArticleBySlug(slug),
      enabled: !!slug,
      staleTime: 10 * 60 * 1000, // 10 minutes for public content
    });
  };

  // Query: Search articles
  const useSearchArticles = (term: string, status?: ArticleStatus) => {
    return useQuery({
      queryKey: ['articles', 'search', term, status],
      queryFn: () => articleService.searchArticles(term, status),
      enabled: term.length > 2,
      staleTime: 2 * 60 * 1000,
    });
  };

  // Mutation: Create article
  const useCreateArticle = () => {
    return useMutation({
      mutationFn: ({ dto, authorId }: { dto: CreateArticleDTO; authorId: string }) =>
        articleService.createArticle(dto, authorId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['articles'] });
      },
    });
  };

  // Mutation: Update article
  const useUpdateArticle = () => {
    return useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: UpdateArticleDTO }) =>
        articleService.updateArticle(id, dto),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        queryClient.invalidateQueries({ queryKey: ['article', data.id] });
      },
    });
  };

  // Mutation: Publish article
  const usePublishArticle = () => {
    return useMutation({
      mutationFn: (id: string) => articleService.publishArticle(id),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        queryClient.invalidateQueries({ queryKey: ['article', data.id] });
      },
    });
  };

  // Mutation: Archive article
  const useArchiveArticle = () => {
    return useMutation({
      mutationFn: (id: string) => articleService.archiveArticle(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['articles'] });
      },
    });
  };

  // Mutation: Delete article
  const useDeleteArticle = () => {
    return useMutation({
      mutationFn: (id: string) => articleService.deleteArticle(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['articles'] });
      },
    });
  };

  // Mutation: Add document to article
  const useAddDocumentToArticle = () => {
    return useMutation({
      mutationFn: ({ articleId, documentId }: { articleId: string; documentId: string }) =>
        articleService.addDocumentToArticle(articleId, documentId),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['article', data.id] });
      },
    });
  };

  // Mutation: Remove document from article
  const useRemoveDocumentFromArticle = () => {
    return useMutation({
      mutationFn: ({ articleId, documentId }: { articleId: string; documentId: string }) =>
        articleService.removeDocumentFromArticle(articleId, documentId),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['article', data.id] });
      },
    });
  };

  return {
    useAllArticles,
    useArticleById,
    useArticleBySlug,
    useSearchArticles,
    useCreateArticle,
    useUpdateArticle,
    usePublishArticle,
    useArchiveArticle,
    useDeleteArticle,
    useAddDocumentToArticle,
    useRemoveDocumentFromArticle,
  };
}
