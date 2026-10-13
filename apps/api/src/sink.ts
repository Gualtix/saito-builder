import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface Submission {
  siteId: string;
  tenant: string;
  kind: 'contact';
  receivedAt: string;
  data: { name: string; email: string; message: string; page?: string };
}

/** Where accepted submissions are persisted. Swap for a database or queue in production. */
export interface SubmissionSink {
  save(submission: Submission): Promise<void>;
}

/** Appends JSON lines to data/<tenant>/<site>.jsonl — tenants never share a file. */
export function fileSink(dir: string): SubmissionSink {
  return {
    async save(submission) {
      const tenantDir = join(dir, submission.tenant);
      await mkdir(tenantDir, { recursive: true });
      await appendFile(join(tenantDir, `${submission.siteId}.jsonl`), `${JSON.stringify(submission)}\n`);
    },
  };
}

export function memorySink(): SubmissionSink & { items: Submission[] } {
  const items: Submission[] = [];
  return {
    items,
    async save(submission) {
      items.push(submission);
    },
  };
}
