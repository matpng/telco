import axios from "axios";
import { env } from "../lib/env.js";
/**
 * Vodafone reseller USSD connector via SIM Gateway (same pattern as Digicel).
 */
export class VodafoneUssdConnector {
    name = "VODAFONE_USSD";
    supports(network) {
        return network === "VODAFONE";
    }
    async topupAirtime(opts) {
        const r = await axios.post(`${env.simGatewayUrl}/v1/ussd`, { network: "VODAFONE", toMsisdn: opts.toMsisdn, amount: opts.amount, idempotencyKey: opts.idempotencyKey }, { headers: { "x-api-key": env.simGatewayApiKey }, timeout: 30000 });
        return r.data;
    }
}
