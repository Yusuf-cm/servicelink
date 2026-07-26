import { api } from "./client";
import type { FundiProfileListItem, FundiProfileDetail, ServiceCategory, Paginated, PortfolioImage } from "@/lib/types";

export function getCategories() {
  return api.get<ServiceCategory[]>("/providers/categories/");
}

export interface ProviderSearchParams {
  category?: string;
  location?: string;
  min_rating?: number;
  verified_only?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
}

export function searchProviders(params: ProviderSearchParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const qs = query.toString();
  return api.get<Paginated<FundiProfileListItem>>(`/providers/${qs ? `?${qs}` : ""}`);
}

export function getProvider(id: string) {
  return api.get<FundiProfileDetail>(`/providers/${id}/`);
}

export function getMyProfile() {
  return api.get<FundiProfileDetail>("/providers/me/");
}

export interface MyProfileUpdate {
  bio?: string;
  category_ids?: number[];
  coverage_areas?: string[];
  years_of_experience?: number;
  is_available?: boolean;
}

export function updateMyProfile(payload: MyProfileUpdate) {
  return api.patch<FundiProfileDetail>("/providers/me/", payload);
}

export function uploadPortfolioImage(file: File, caption: string) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("caption", caption);
  return api.post<PortfolioImage>("/providers/me/portfolio/", formData, { isFormData: true });
}

export function deletePortfolioImage(id: number) {
  return api.delete(`/providers/me/portfolio/${id}/`);
}
