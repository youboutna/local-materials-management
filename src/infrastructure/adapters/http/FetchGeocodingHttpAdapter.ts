import type { IGeocodingHttpPort, GeocodingHttpResponse } from '@/domain/repositories/IGeocodingHttpPort';

export class FetchGeocodingHttpAdapter implements IGeocodingHttpPort {
  async get(url: string, init?: { headers?: Record<string, string> }): Promise<GeocodingHttpResponse> {
    const r = await fetch(url, { headers: init?.headers });
    return { ok: r.ok, status: r.status, statusText: r.statusText, json: () => r.json() };
  }
}
