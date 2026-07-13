export interface GraphEdge<TPayload = any> {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  payload?: TPayload;
}
