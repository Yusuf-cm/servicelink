import { api } from "./client";
import type { Review, Paginated } from "@/lib/types";

export function createReview(booking: string, rating: number, comment: string) {
  return api.post<Review>("/reviews/", { booking, rating, comment });
}

export function getProviderReviews(providerId: string) {
  return api.get<Paginated<Review>>(`/reviews/provider/${providerId}/`);
}

export function getMyReviews() {
  return api.get<Paginated<Review>>("/reviews/mine/");
}
