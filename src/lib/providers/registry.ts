import { Provider } from "@prisma/client";
import { decryptSecret } from "@/lib/crypto";
import { GenericSmmAdapter } from "./generic-smm-adapter";
import { ProviderAdapter } from "./types";

// Central place to turn a `Provider` DB row into a live adapter instance.
// Every provider in this panel currently speaks the generic SMM API
// convention. If you integrate a provider with a bespoke API, branch on
// provider.name (or add a `kind` column) and return a different adapter here.
export function getAdapterForProvider(provider: Provider): ProviderAdapter {
  const apiKey = decryptSecret(provider.apiKey);
  return new GenericSmmAdapter({
    name: provider.name,
    apiUrl: provider.apiUrl,
    apiKey,
  });
}
