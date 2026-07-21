/**
 * PostgrestClient
 * Minimal fetch wrapper around a PostgREST API, JWT-aware, with a small query builder.
 * Used by non-Supabase self-hosted deployments.
 */

export interface PostgrestClientOptions {
  baseUrl: string;
  apiKey?: string;
  getToken?: () => string | null | undefined;
  defaultSchema?: string;
}

export class PostgrestError extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message);
  }
}

export class PostgrestQuery<T = any> {
  private params = new URLSearchParams();
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  private body?: unknown;
  private prefer?: string;

  constructor(private client: PostgrestClient, private table: string) {}

  select(cols = '*') {
    this.params.set('select', cols);
    return this;
  }
  eq(col: string, val: string | number | boolean) {
    this.params.append(col, `eq.${val}`);
    return this;
  }
  in(col: string, vals: Array<string | number>) {
    this.params.append(col, `in.(${vals.join(',')})`);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.params.append('order', `${col}.${opts?.ascending === false ? 'desc' : 'asc'}`);
    return this;
  }
  limit(n: number) {
    this.params.set('limit', String(n));
    return this;
  }
  insert(rows: Partial<T> | Partial<T>[]) {
    this.method = 'POST';
    this.body = rows;
    this.prefer = 'return=representation';
    return this;
  }
  update(patch: Partial<T>) {
    this.method = 'PATCH';
    this.body = patch;
    this.prefer = 'return=representation';
    return this;
  }
  delete() {
    this.method = 'DELETE';
    this.prefer = 'return=representation';
    return this;
  }

  async execute(): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    try {
      const data = await this.client.request<T[]>(this.table, {
        method: this.method,
        params: this.params,
        body: this.body,
        prefer: this.prefer,
      });
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e instanceof PostgrestError ? e : new PostgrestError(String(e), 0) };
    }
  }
}

export class PostgrestClient {
  constructor(private opts: PostgrestClientOptions) {}

  from<T = any>(table: string) {
    return new PostgrestQuery<T>(this, table);
  }

  async request<T = unknown>(
    path: string,
    init: {
      method?: string;
      params?: URLSearchParams;
      body?: unknown;
      prefer?: string;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = new URL(`${this.opts.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`);
    if (init.params) {
      init.params.forEach((v, k) => url.searchParams.append(k, v));
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {}),
    };
    if (this.opts.apiKey) headers['apikey'] = this.opts.apiKey;
    const token = this.opts.getToken?.();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (this.opts.defaultSchema) headers['Accept-Profile'] = this.opts.defaultSchema;
    if (init.prefer) headers['Prefer'] = init.prefer;

    const res = await fetch(url.toString(), {
      method: init.method ?? 'GET',
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

    const text = await res.text();
    const json = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
    if (!res.ok) throw new PostgrestError(res.statusText, res.status, json);
    return json as T;
  }
}
