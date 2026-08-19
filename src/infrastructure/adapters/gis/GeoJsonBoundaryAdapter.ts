/**
 * Adapter GeoJSON des limites administratives.
 *
 * Source : jeu de données wilayas hébergé en asset CDN (pointeur .asset.json),
 * chargé à la demande puis mémorisé (une seule requête réseau par session).
 */
import type { IAdministrativeBoundaryRepository } from '@/domain/repositories/IAdministrativeBoundaryRepository';
import type { AdministrativeBoundaryFeature } from '@/dtos/entities/AdministrativeBoundaryDTO';
import wilayasAsset from '@/assets/mr-wilayas.geojson.asset.json';

export class GeoJsonBoundaryAdapter implements IAdministrativeBoundaryRepository {
  private cache: AdministrativeBoundaryFeature[] | null = null;
  private inflight: Promise<AdministrativeBoundaryFeature[]> | null = null;

  constructor(private readonly sourceUrl: string = wilayasAsset.url) {}

  async findAll(): Promise<AdministrativeBoundaryFeature[]> {
    if (this.cache) return this.cache;
    if (this.inflight) return this.inflight;

    this.inflight = (async () => {
      const response = await fetch(this.sourceUrl);
      if (!response.ok) {
        throw new Error(
          `Chargement des limites administratives impossible (${response.status})`,
        );
      }
      const collection = (await response.json()) as {
        features?: AdministrativeBoundaryFeature[];
      };
      const features = Array.isArray(collection?.features) ? collection.features : [];
      this.cache = features.filter(
        (feature) =>
          feature?.geometry?.type === 'Polygon' || feature?.geometry?.type === 'MultiPolygon',
      );
      return this.cache;
    })();

    try {
      return await this.inflight;
    } finally {
      this.inflight = null;
    }
  }
}
