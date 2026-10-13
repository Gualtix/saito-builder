import type { ZodError } from 'zod';

export interface ConfigIssue {
  path: string;
  message: string;
}

export class SiteConfigError extends Error {
  readonly issues: ConfigIssue[];

  constructor(subject: string, issues: ConfigIssue[]) {
    super(`${subject} is invalid:\n${issues.map((i) => `  - ${i.path || '(root)'}: ${i.message}`).join('\n')}`);
    this.name = 'SiteConfigError';
    this.issues = issues;
  }
}

export function zodIssues(error: ZodError, prefix = ''): ConfigIssue[] {
  return error.issues.map((issue) => ({
    path: [prefix, ...issue.path.map(String)].filter(Boolean).join('.'),
    message: issue.message,
  }));
}
