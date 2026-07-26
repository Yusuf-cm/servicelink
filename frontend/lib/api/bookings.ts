import { api } from "./client";
import type { ServiceRequest, Booking, Message, Paginated } from "@/lib/types";

export interface CreateServiceRequestPayload {
  provider: string;
  category: number;
  description: string;
  location: string;
  preferred_date: string;
}

export function createServiceRequest(payload: CreateServiceRequestPayload) {
  return api.post<ServiceRequest>("/bookings/requests/", payload);
}

export function listServiceRequests() {
  return api.get<Paginated<ServiceRequest>>("/bookings/requests/");
}

export function getServiceRequest(id: string) {
  return api.get<ServiceRequest>(`/bookings/requests/${id}/`);
}

export interface DecisionPayload {
  decision: "accept" | "decline";
  agreed_price_kes?: string;
  scheduled_date?: string;
}

export function decideServiceRequest(id: string, payload: DecisionPayload) {
  return api.post<{ service_request: ServiceRequest; booking?: Booking }>(
    `/bookings/requests/${id}/decision/`,
    payload
  );
}

export function listMessages(requestId: string) {
  return api.get<Paginated<Message>>(`/bookings/requests/${requestId}/messages/`);
}

export function sendMessage(requestId: string, body: string) {
  return api.post<Message>(`/bookings/requests/${requestId}/messages/`, { body });
}

export function listBookings() {
  return api.get<Paginated<Booking>>("/bookings/");
}

export function getBooking(id: string) {
  return api.get<Booking>(`/bookings/${id}/`);
}

export function updateBookingStatus(id: string, status: "in_progress" | "completed") {
  return api.post<Booking>(`/bookings/${id}/status/`, { status });
}
