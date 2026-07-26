export type Role = "client" | "provider" | "admin";

export interface User {
  id: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: Role;
  email_verified: boolean;
  phone_verified: boolean;
  date_joined: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  requires_regulatory_credential: boolean;
  icon: string;
  is_active: boolean;
}

export type VerificationStatus = "unsubmitted" | "pending" | "verified" | "rejected";
export type CredentialBody = "nca" | "epra";

export interface FundiProfileListItem {
  id: string;
  full_name: string;
  categories: ServiceCategory[];
  coverage_areas: string[];
  verification_status: VerificationStatus;
  average_rating: string;
  completed_jobs_count: number;
  trust_score: string;
  is_available: boolean;
}

export interface PortfolioImage {
  id: number;
  image: string;
  caption: string;
  uploaded_at: string;
}

export interface FundiProfileDetail {
  id: string;
  user: User;
  bio: string;
  categories: ServiceCategory[];
  coverage_areas: string[];
  years_of_experience: number;
  is_available: boolean;
  credential_body: CredentialBody | "";
  credential_number: string;
  verification_status: VerificationStatus;
  is_verified: boolean;
  verified_at: string | null;
  average_rating: string;
  completed_jobs_count: number;
  trust_score: string;
  portfolio_images: PortfolioImage[];
  created_at: string;
  updated_at: string;
}

export type ServiceRequestStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface ServiceRequest {
  id: string;
  client: User;
  provider: FundiProfileListItem;
  category: ServiceCategory;
  description: string;
  location: string;
  preferred_date: string;
  status: ServiceRequestStatus;
  has_booking: boolean;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = "pending_payment" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";

export interface Booking {
  id: string;
  service_request: ServiceRequest;
  client: User;
  provider: FundiProfileListItem;
  agreed_price_kes: string;
  scheduled_date: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  has_review: boolean;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface Message {
  id: number;
  service_request: string;
  sender: string;
  sender_name: string;
  body: string;
  sent_at: string;
  read_at: string | null;
}

export interface Review {
  id: number;
  booking: string;
  client: string;
  client_name: string;
  provider: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface MpesaTransaction {
  id: string;
  booking: string;
  phone_number: string;
  amount_kes: string;
  status: "pending" | "success" | "failed";
  mpesa_receipt_number: string;
  result_desc: string;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [field: string]: unknown;
}
