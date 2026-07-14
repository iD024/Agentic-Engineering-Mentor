/** Immutable dependency health metric domain model. */
export interface DependencyMetric {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly version: string;
  readonly outdated: boolean;
  readonly vulnerable: boolean;
  readonly notes: string;
  readonly rowVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
