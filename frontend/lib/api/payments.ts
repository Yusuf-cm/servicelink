import { api } from "./client";
import type { MpesaTransaction, Paginated } from "@/lib/types";

export function initiateMpesaPayment(bookingId: string, phoneNumber: string) {
  return api.post<{ detail: string; transaction: MpesaTransaction }>("/payments/mpesa/initiate/", {
    booking_id: bookingId,
    phone_number: phoneNumber,
  });
}

export function getMpesaStatus(checkoutRequestId: string) {
  return api.get<MpesaTransaction>(`/payments/mpesa/status/${checkoutRequestId}/`);
}

export function getBookingTransactions(bookingId: string) {
  return api.get<Paginated<MpesaTransaction>>(`/payments/booking/${bookingId}/transactions/`);
}
