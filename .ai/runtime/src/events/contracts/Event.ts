export interface Event<T = unknown> {
  id: string;
  type: string;
  timestamp: string;
  version: number;
  payload: T;
  // Event Sourcing Readiness fields
  eventId: string;
  correlationId?: string;
  causationId?: string;
  source: string;
}
