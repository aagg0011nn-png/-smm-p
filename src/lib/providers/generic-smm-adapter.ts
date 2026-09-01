import {
  ProviderAdapter,
  ProviderServiceListItem,
  CreateOrderParams,
  CreateOrderResult,
  OrderStatusResult,
  ProviderApiError,
} from "./types";

// Most third-party SMM providers expose a single POST endpoint that takes an
// `action` field (services | add | status | balance | refill | cancel).
// This adapter implements that widely-used convention. If you add a provider
// with a different API shape, implement ProviderAdapter directly instead.

interface GenericSmmAdapterConfig {
  name: string;
  apiUrl: string;
  apiKey: string;
}

async function post(apiUrl: string, body: Record<string, string>): Promise<any> {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
    // Provider calls should not hang indefinitely
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export class GenericSmmAdapter implements ProviderAdapter {
  constructor(private config: GenericSmmAdapterConfig) {}

  private async call(body: Record<string, string>) {
    try {
      return await post(this.config.apiUrl, { key: this.config.apiKey, ...body });
    } catch (err) {
      throw new ProviderApiError(`Request to provider failed`, this.config.name, err);
    }
  }

  async listServices(): Promise<ProviderServiceListItem[]> {
    const data = await this.call({ action: "services" });
    if (!Array.isArray(data)) {
      throw new ProviderApiError("Unexpected services response shape", this.config.name);
    }
    return data.map((s: any) => ({
      externalServiceId: String(s.service),
      name: String(s.name),
      category: String(s.category ?? "Uncategorized"),
      rate: Number(s.rate),
      min: Number(s.min),
      max: Number(s.max),
      refillSupported: Boolean(s.refill),
      cancelSupported: Boolean(s.cancel),
    }));
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const data = await this.call({
      action: "add",
      service: params.externalServiceId,
      link: params.link,
      quantity: String(params.quantity),
    });
    if (data?.error) {
      throw new ProviderApiError(`Provider rejected order: ${data.error}`, this.config.name);
    }
    if (!data?.order) {
      throw new ProviderApiError("Provider did not return an order id", this.config.name);
    }
    return { providerOrderId: String(data.order) };
  }

  async getOrderStatus(providerOrderId: string): Promise<OrderStatusResult> {
    const data = await this.call({ action: "status", order: providerOrderId });
    if (data?.error) {
      throw new ProviderApiError(`Provider status error: ${data.error}`, this.config.name);
    }
    return {
      status: data.status,
      startCount: data.start_count != null ? Number(data.start_count) : null,
      remains: data.remains != null ? Number(data.remains) : null,
    };
  }

  async getBalance(): Promise<number> {
    const data = await this.call({ action: "balance" });
    return Number(data.balance ?? 0);
  }

  async requestRefill(providerOrderId: string): Promise<{ refillId: string }> {
    const data = await this.call({ action: "refill", order: providerOrderId });
    if (data?.error) {
      throw new ProviderApiError(`Refill rejected: ${data.error}`, this.config.name);
    }
    return { refillId: String(data.refill) };
  }

  async requestCancel(providerOrderId: string): Promise<{ canceled: boolean }> {
    const data = await this.call({ action: "cancel", orders: providerOrderId });
    if (data?.error) {
      throw new ProviderApiError(`Cancel rejected: ${data.error}`, this.config.name);
    }
    return { canceled: true };
  }
}
