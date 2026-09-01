// Common contract every provider adapter must implement.
// This lets the order engine talk to any provider (or multiple providers)
// without caring about their specific API shape.

export interface ProviderServiceListItem {
  externalServiceId: string;
  name: string;
  category: string;
  rate: number; // provider's price per 1000
  min: number;
  max: number;
  refillSupported: boolean;
  cancelSupported: boolean;
}

export interface CreateOrderParams {
  externalServiceId: string;
  link: string;
  quantity: number;
}

export interface CreateOrderResult {
  providerOrderId: string;
}

export interface OrderStatusResult {
  status: "Pending" | "In progress" | "Processing" | "Completed" | "Partial" | "Canceled" | "Failed";
  startCount: number | null;
  remains: number | null;
}

export interface ProviderAdapter {
  listServices(): Promise<ProviderServiceListItem[]>;
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  getOrderStatus(providerOrderId: string): Promise<OrderStatusResult>;
  getBalance(): Promise<number>;
  requestRefill?(providerOrderId: string): Promise<{ refillId: string }>;
  requestCancel?(providerOrderId: string): Promise<{ canceled: boolean }>;
}

export class ProviderApiError extends Error {
  constructor(message: string, public readonly providerName: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ProviderApiError";
  }
}
