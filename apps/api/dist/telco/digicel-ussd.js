import axios from "axios";
import { env } from "../lib/env.js";
/**
 * Digicel reseller USSD connector via your SIM Gateway.
 * You must implement a SIM gateway that can send USSD on a specific device/SIM and return the raw USSD response.
 *
 * Expected SIM gateway API (example):
 * POST {SIM_GATEWAY_URL}/v1/ussd
 *  { network: "DIGICEL", toMsisdn: "+6757xxxxxxx", amount: 5, idempotencyKey: "..." }
 *  -> { status: "SUCCESS"|"FAILED"|"PENDING", telcoRef: "abc", raw: "..." , reason?: "..." }
 */
export class DigicelUssdConnector {
    name = "DIGICEL_USSD";
    supports(network) {
        return network === "DIGICEL";
    }
    async topupAirtime(opts) {
        const r = await axios.post(`${env.simGatewayUrl}/v1/ussd`, { network: "DIGICEL", toMsisdn: opts.toMsisdn, amount: opts.amount, idempotencyKey: opts.idempotencyKey }, { headers: { "x-api-key": env.simGatewayApiKey }, timeout: 30000 });
        return r.data;
    }
}
