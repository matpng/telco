import { z } from "zod";

export const MsisdnSchema = z
  .string()
  .trim()
  .min(6)
  .transform((v) => v.replace(/\s+/g, ""));

export const MoneySchema = z.number().finite().nonnegative();

export const SmsInboundSchema = z.object({
  from: MsisdnSchema,
  text: z.string().trim().min(1),
  messageId: z.string().trim().min(1),
  receivedAt: z.string().optional()
});

export const EmployerSignupSchema = z.object({
  companyName: z.string().trim().min(2),
  ipaRegNo: z.string().trim().optional(),
  billingEmail: z.string().email(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8)
});

export const EmployeeCreateSchema = z.object({
  fullName: z.string().trim().min(2),
  msisdn: MsisdnSchema,
  department: z.string().trim().optional()
});

export const AllowancePolicySchema = z.object({
  name: z.string().trim().min(2),
  dailyCap: MoneySchema,
  weeklyCap: MoneySchema,
  monthlyCap: MoneySchema,
  perTxnCap: MoneySchema,
  requireApprovalOver: MoneySchema.optional()
});

export const TopupCreateSchema = z.object({
  employeeId: z.string().uuid().optional(),
  msisdn: MsisdnSchema,
  network: z.enum(["DIGICEL", "VODAFONE"]),
  productType: z.enum(["AIRTIME", "DATA"]).default("AIRTIME"),
  amount: z.number().finite().positive(),
  idempotencyKey: z.string().min(1)
});
