export type Network = "DIGICEL" | "VODAFONE";
export type ProductType = "AIRTIME" | "DATA";

export type TopUpStatus =
  | "CREATED"
  | "HELD"
  | "SENT"
  | "SUCCESS"
  | "FAILED"
  | "PENDING"
  | "REVERSED";

export type UserRole = "SUPER_ADMIN" | "EMPLOYER_ADMIN" | "FINANCE" | "VIEWER";

export interface SmsInboundPayload {
  from: string;      // MSISDN, e.g. +67570xxxxxx
  text: string;      // message body
  messageId: string; // unique id from gateway (idempotency key)
  receivedAt?: string;
}
