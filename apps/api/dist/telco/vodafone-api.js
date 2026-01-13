/**
 * Vodafone partner API connector (stub).
 * Replace with the actual Vodafone enterprise/reseller API once you have documentation/credentials.
 */
export class VodafoneApiConnector {
    name = "VODAFONE_API";
    supports(network) {
        return network === "VODAFONE";
    }
    async topupAirtime(opts) {
        // Placeholder: in production call Vodafone endpoint with auth headers.
        // Example:
        // const r = await axios.post(`${baseUrl}/topup`, { msisdn: opts.toMsisdn, amount: opts.amount, txnId: opts.idempotencyKey }, { headers });
        // return normalize(r.data);
        await new Promise((res) => setTimeout(res, 300));
        return { status: "PENDING", raw: "VODAFONE_API_STUB: pending" };
    }
}
