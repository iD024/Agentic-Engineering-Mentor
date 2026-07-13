import type { Rubric } from './types.js';

/**
 * Loads and validates Rubric definitions from plain objects (e.g., JSON files).
 */
export class RubricLoader {
  loadFromObject(obj: unknown): Rubric {
    const errors = this.validate(obj as Partial<Rubric>);
    if (errors.length > 0) throw new Error(`Invalid rubric: ${errors.join('; ')}`);
    return obj as Rubric;
  }

  validate(rubric: Partial<Rubric>): string[] {
    const errors: string[] = [];
    if (!rubric.id) errors.push('rubric.id is required');
    if (!rubric.name) errors.push('rubric.name is required');
    if (!rubric.criteria || rubric.criteria.length === 0) {
      errors.push('rubric.criteria must have at least one criterion');
    }
    if (typeof rubric.passingThreshold !== 'number') {
      errors.push('rubric.passingThreshold must be a number');
    }
    return errors;
  }
}
