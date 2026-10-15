/**
 * Article Entity - Hexagonal Architecture
 * Represents a news article or blog post
 */

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface ArticleData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: ArticleStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  documentIds: string[];
  authorId: string;
  metadata?: Record<string, unknown>;
}

export class Article {
  private readonly id: string;
  private title: string;
  private slug: string;
  private summary: string;
  private content: string;
  private status: ArticleStatus;
  private publishedAt?: string;
  private readonly createdAt: string;
  private updatedAt: string;
  private projectId?: string;
  private documentIds: string[];
  private readonly authorId: string;
  private metadata?: Record<string, unknown>;

  private constructor(data: ArticleData) {
    this.id = data.id;
    this.title = data.title;
    this.slug = data.slug;
    this.summary = data.summary;
    this.content = data.content;
    this.status = data.status;
    this.publishedAt = data.publishedAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.projectId = data.projectId;
    this.documentIds = data.documentIds || [];
    this.authorId = data.authorId;
    this.metadata = data.metadata;
  }

  static create(data: Omit<ArticleData, 'id' | 'createdAt' | 'updatedAt'>): Article {
    const now = new Date().toISOString();
    const slug = data.slug || Article.generateSlug(data.title);
    return new Article({
      ...data,
      id: crypto.randomUUID(),
      slug,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(data: ArticleData): Article {
    return new Article(data);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getSlug(): string {
    return this.slug;
  }

  getSummary(): string {
    return this.summary;
  }

  getContent(): string {
    return this.content;
  }

  getStatus(): ArticleStatus {
    return this.status;
  }

  getPublishedAt(): string | undefined {
    return this.publishedAt;
  }

  getCreatedAt(): string {
    return this.createdAt;
  }

  getUpdatedAt(): string {
    return this.updatedAt;
  }

  getProjectId(): string | undefined {
    return this.projectId;
  }

  getDocumentIds(): string[] {
    return [...this.documentIds];
  }

  getAuthorId(): string {
    return this.authorId;
  }

  getMetadata(): Record<string, unknown> | undefined {
    return this.metadata;
  }

  // Business methods
  publish(): void {
    if (this.status === 'published') {
      throw new Error('Article is already published');
    }
    this.status = 'published';
    this.publishedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  archive(): void {
    this.status = 'archived';
    this.updatedAt = new Date().toISOString();
  }

  revertToDraft(): void {
    this.status = 'draft';
    this.publishedAt = undefined;
    this.updatedAt = new Date().toISOString();
  }

  update(data: Partial<Omit<ArticleData, 'id' | 'createdAt' | 'authorId' | 'projectId'>> & { projectId?: string | null }): void {
    if (data.title !== undefined) {
      this.title = data.title;
      this.slug = data.slug || Article.generateSlug(data.title);
    }
    if (data.summary !== undefined) this.summary = data.summary;
    if (data.content !== undefined) this.content = data.content;
    if (data.status !== undefined) this.status = data.status;
    if (data.projectId !== undefined) this.projectId = data.projectId ?? undefined;
    if (data.documentIds !== undefined) this.documentIds = data.documentIds;
    if (data.metadata !== undefined) this.metadata = data.metadata;
    this.updatedAt = new Date().toISOString();
  }

  addDocument(documentId: string): void {
    if (!this.documentIds.includes(documentId)) {
      this.documentIds.push(documentId);
      this.updatedAt = new Date().toISOString();
    }
  }

  removeDocument(documentId: string): void {
    this.documentIds = this.documentIds.filter(id => id !== documentId);
    this.updatedAt = new Date().toISOString();
  }

  isPublished(): boolean {
    return this.status === 'published';
  }

  isDraft(): boolean {
    return this.status === 'draft';
  }

  isArchived(): boolean {
    return this.status === 'archived';
  }

  toData(): ArticleData {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      summary: this.summary,
      content: this.content,
      status: this.status,
      publishedAt: this.publishedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      projectId: this.projectId,
      documentIds: [...this.documentIds],
      authorId: this.authorId,
      metadata: this.metadata,
    };
  }

  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
