import { env } from "../config/env.js";

export function isProviderNetworkEnabled(): boolean {
  return env.noveProvidersEnableNetwork;
}
