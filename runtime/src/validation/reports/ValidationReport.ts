import type { GradeReport } from '../grading/GradeReport.js';
import type { Diagnostic } from '../diagnostics/Diagnostic.js';

export interface ValidationReport {
  id: string;
  gradeReport: GradeReport;
  diagnostics: Diagnostic[];
  markdownSummary: string;
  generatedAt: string;
}
