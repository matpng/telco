import axios from "axios";
import type { TelcoConnector, TelcoResult } from "./types.js";

/**
 * Vodafone partner API connector (stub).
 * Replace with the actual Vodafone enterprise/reseller API once you have documentation/credentials.
 */
export class VodafoneApiConnector implements TelcoConnector {
  name = "VODAFONE_API";
  supports(network: "DIGICEL" | "VODAFONE") {
    return network === "VODAFONE";
  }

  async topupAirtime(opts: { toMsisdn: string; amount: number; idempotencyKey: string }): Promise<TelcoResult> {
    // Placeholder: in production call Vodafone endpoint with auth headers.
    // Example:
    // const r = await axios.post(`${baseUrl}/topup`, { msisdn: opts.toMsisdn, amount: opts.amount, txnId: opts.idempotencyKey }, { headers });
    // return normalize(r.data);
    await new Promise((res) => setTimeout(res, 300));
    return { status: "PENDING", raw: "VODAFONE_API_STUB: pending" };
  }
}
