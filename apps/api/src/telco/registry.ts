import type { TelcoConnector } from "./types.js";
import { DigicelUssdConnector } from "./digicel-ussd.js";
import { VodafoneApiConnector } from "./vodafone-api.js";
import { VodafoneUssdConnector } from "./vodafone-ussd.js";

const connectors: TelcoConnector[] = [
  new DigicelUssdConnector(),
  // Prefer API if it returns definitive SUCCESS; fallback to USSD if needed.
  new VodafoneApiConnector(),
  new VodafoneUssdConnector()
];

export function pickConnector(network: "DIGICEL" | "VODAFONE"): TelcoConnector {
  const c = connectors.find(x => x.supports(network));
  if (!c) throw new Error(`No connector for network ${network}`);
  return c;
}
