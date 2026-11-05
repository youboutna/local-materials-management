/** Port HTTP du géocodage : le service ne dépend jamais directement du transport réseau. */
export interface GeocodingHttpResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  json<T = unknown>(): Promise<T>;
}
export interface IGeocodingHttpPort {
  get(url: string, init?: { headers?: Record<string, string> }): Promise<GeocodingHttpResponse>;
}
