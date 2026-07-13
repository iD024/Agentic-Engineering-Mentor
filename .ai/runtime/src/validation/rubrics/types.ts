export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  /** Weight as percentage points (all criteria should sum to 100). */
  weight: number;
  /** Rule IDs whose results determine this criterion. */
  ruleIds: string[];
  /** Minimum number of matching rules that must PASS to earn this criterion. */
  requiredPassCount: number;
}

export interface Rubric {
  id: string;
  name: string;
  version: string;
  criteria: RubricCriterion[];
  /** Minimum percentage score to pass (e.g. 70 means 70%). */
  passingThreshold: number;
}

export interface CriterionScore {
  criterionId: string;
  earned: number;    // weight points earned
  possible: number;  // weight points possible
  passed: boolean;
  diagnosticMessages: string[];
}

export interface RubricScore {
  rubricId: string;
  totalEarned: number;
  totalPossible: number;
  percentage: number;
  passed: boolean;
  criterionScores: CriterionScore[];
}
