import { publicApiFetch } from "@/lib/publicApi/utils";

export interface Endpoint {
  id: string;
  environmentId: string;
  name: string;
  description?: string | null;
  url: string;
  enabled: boolean;
  retryPolicy: string;
  maxAttempts: number;
  timeoutMs: number;
  customHeaders?: Record<string, string>;
  proxyGroupId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EndpointGroup {
  id: string;
  environmentId: string;
  name: string;
  description?: string | null;
  endpointIds: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventType {
  id: string;
  environmentId: string;
  name: string;
  description?: string | null;
  schema?: Record<string, unknown> | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProxyGroup {
  id: string;
  name: string;
  description?: string;
  loadBalancingStrategy: string;
  isActive: boolean;
}

export type ErrorBody = {
  error?: string;
  message?: string;
};

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response =
    typeof input === "string" && input.startsWith("/") ? await publicApiFetch(input, init) : await fetch(input, init);

  if (!response.ok) {
    let message = "Request failed";

    try {
      const errorBody = (await response.json()) as ErrorBody;
      message = errorBody.message || errorBody.error || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function fetchEndpoints() {
  const data = await requestJson<{ endpoints: Endpoint[] }>("/endpoints");
  return data.endpoints;
}

export async function createEndpoint(payload: {
  name: string;
  description?: string;
  url: string;
  enabled: boolean;
  retryPolicy: string;
  maxAttempts: number;
  timeoutMs: number;
  customHeaders?: Record<string, string>;
  proxyGroupId?: string | null;
}) {
  return requestJson<Endpoint>("/endpoints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateEndpoint(
  id: string,
  payload: Partial<Omit<Endpoint, "id" | "environmentId" | "createdAt" | "updatedAt">>
) {
  const data = await requestJson<{ message: string; endpoint: Endpoint }>(`/endpoints/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data.endpoint;
}

export async function deleteEndpoint(id: string) {
  await requestJson(`/endpoints/${id}`, { method: "DELETE" });
}

export async function fetchEndpointGroups() {
  const data = await requestJson<{ endpointGroups: EndpointGroup[] }>("/endpoint-groups");
  return data.endpointGroups;
}

export async function createEndpointGroup(payload: {
  name: string;
  description?: string;
  endpointIds: string[];
  enabled: boolean;
}) {
  return requestJson<EndpointGroup>("/endpoint-groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateEndpointGroup(
  id: string,
  payload: Partial<Pick<EndpointGroup, "name" | "description" | "endpointIds" | "enabled">>
) {
  const data = await requestJson<{ message: string; group: EndpointGroup }>(`/endpoint-groups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data.group;
}

export async function deleteEndpointGroup(id: string) {
  await requestJson(`/endpoint-groups/${id}`, { method: "DELETE" });
}

export async function fetchEventTypes() {
  const data = await requestJson<{ eventTypes: EventType[] }>("/event-types");
  return data.eventTypes;
}

export async function createEventType(payload: {
  name: string;
  description?: string;
  schema?: Record<string, unknown> | null;
  enabled: boolean;
}) {
  return requestJson<EventType>("/event-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateEventType(
  id: string,
  payload: Partial<Pick<EventType, "name" | "description" | "schema" | "enabled">>
) {
  const data = await requestJson<{ message: string; eventType: EventType }>(`/event-types/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data.eventType;
}

export async function deleteEventType(id: string) {
  await requestJson(`/event-types/${id}`, { method: "DELETE" });
}

export async function fetchProxyGroups() {
  const data = await requestJson<{ proxyGroups: ProxyGroup[] }>("/proxy-groups?active=true");
  return data.proxyGroups ?? [];
}
