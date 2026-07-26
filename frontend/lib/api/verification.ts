import { api } from "./client";

export interface SubmitCredentialPayload {
  credential_body: "nca" | "epra";
  credential_number: string;
}

export function submitCredential(payload: SubmitCredentialPayload) {
  return api.post<{ detail: string; verification_status: string }>("/verification/submit/", payload);
}
