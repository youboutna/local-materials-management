/**
 * Authorization Request Repository Interface
 * Domain contract for submitting DGP fuel-station authorization requests.
 */

export interface AuthorizationRequestInput {
  applicantType: string;
  individualFirstName?: string;
  individualLastName?: string;
  email: string;
  phoneNumber: string;
  address?: string;
  nationalId: string;
  companyName?: string;
  companyNif?: string;
  requestType: string;
  parcelAddress?: string;
  description?: string;
}

export interface AuthorizationRequestRecord {
  id: string;
  requestNumber?: string;
  status: string;
  createdAt: string;
}

export interface IAuthorizationRequestRepository {
  submit(input: AuthorizationRequestInput): Promise<AuthorizationRequestRecord>;
}
