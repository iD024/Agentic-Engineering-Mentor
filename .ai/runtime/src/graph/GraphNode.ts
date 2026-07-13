export interface GraphNode<TPayload = any> {
  id: string;
  type: string;
  payload: TPayload;
}
