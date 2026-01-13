import "dotenv/config";
import Fastify from "fastify";

/**
 * LOCAL SIM GATEWAY STUB
 * This simulates a USSD/Dealer-SIM topup gateway.
 * In production, replace this service with one that actually:
 * - controls GSM modems / Android devices
 * - sends USSD commands
 * - parses responses
 */
const app = Fastify({ logger: true });

app.post("/v1/ussd", async (req, reply) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== (process.env.SIM_GATEWAY_API_KEY || "dev_key")) {
    return reply.code(401).send({ status: "FAILED", raw: "unauthorized", reason: "Invalid API key" });
  }

  const body = req.body as any;
  const { network, toMsisdn, amount, idempotencyKey } = body;

  // Simulate deterministic behavior: amounts <= 50 succeed, else pending
  if (Number(amount) <= 50) {
    return { status: "SUCCESS", telcoRef: `${network}-${Date.now()}`, raw: `SIM_GATEWAY_STUB OK ${toMsisdn} ${amount}` };
  }
  return { status: "PENDING", raw: `SIM_GATEWAY_STUB PENDING ${toMsisdn} ${amount}`, telcoRef: `${network}-P-${Date.now()}` };
});

const port = Number(process.env.PORT || 5050);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`SIM gateway stub listening on :${port}`);
});
