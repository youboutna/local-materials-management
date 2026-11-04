/**
 * Port transitoire fournissant le client de données par schéma.
 * Les services qui n'ont pas encore de port métier dédié l'obtiennent
 * exclusivement via RepositoryFactory, jamais par import direct du fournisseur.
 */
export interface IDataClientProvider {
  /** Client du schéma métier BTP. */
  btp(): any;
  /** Client du schéma transverse public. */
  public(): any;
}
