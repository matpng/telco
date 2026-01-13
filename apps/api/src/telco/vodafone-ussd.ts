import axios from "axios";
import { env } from "../lib/env.js";
import type { TelcoConnector, TelcoResult } from "./types.js";

/**
 * Vodafone reseller USSD connector via SIM Gateway (same pattern as Digicel).
 */
export class VodafoneUssdConnector implements TelcoConnector {
  name = "VODAFONE_USSD";
  supports(network: "DIGICEL" | "VODAFONE") {
    return network === "VODAFONE";
  }

  async topupAirtime(opts: { toMsisdn: string; amount: number; idempotencyKey: string }): Promise<TelcoResult> {
    const r = await axios.post(
      `${env.simGatewayUrl}/v1/ussd`,
      { network: "VODAFONE", toMsisdn: opts.toMsisdn, amount: opts.amount, idempotencyKey: opts.idempotencyKey },
      { headers: { "x-api-key": env.simGatewayApiKey }, timeout: 30000 }
    );
    return r.data as TelcoResult;
  }
}
