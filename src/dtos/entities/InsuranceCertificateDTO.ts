/**
 * Insurance Certificate DTO — shim de compatibilité
 * La source de vérité unique est `@/dtos/entities/InsuranceDTO`.
 * Ce fichier ne fait que ré-exporter les types canoniques sous leurs anciens noms.
 */

export type {
  InsuranceCertificateDTO,
  InsuranceCertificateFormData,
  InsuranceFilterDTO as InsuranceCertificateFilterData,
  CreateInsuranceCertificateDTO as InsuranceCertificateCreateData,
  UpdateInsuranceCertificateDTO as InsuranceCertificateUpdateData,
} from './InsuranceDTO';

export { InsuranceCertificateStatus, InsuranceType } from './InsuranceDTO';
