export type TelcoResult =
  | { status: "SUCCESS"; telcoRef: string; raw: string }
  | { status: "FAILED"; telcoRef?: string; raw: string; reason: string }
  | { status: "PENDING"; telcoRef?: string; raw: string };

export interface TelcoConnector {
  name: string;
  supports(network: "DIGICEL" | "VODAFONE"): boolean;
  topupAirtime(opts: { toMsisdn: string; amount: number; idempotencyKey: string }): Promise<TelcoResult>;
}
