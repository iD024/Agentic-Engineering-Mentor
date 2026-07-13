/** Immutable runtime setting key-value pair. */
export interface Setting {
  readonly key: string;
  readonly value: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
