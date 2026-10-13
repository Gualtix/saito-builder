export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export function parseVersion(value: string): Version {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) throw new Error(`Invalid version "${value}"`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  return va.major - vb.major || va.minor - vb.minor || va.patch - vb.patch;
}

/**
 * Supported ranges (deliberately small, matching how sites pin templates):
 *  - "latest"        any version
 *  - "1"             >=1.0.0 <2.0.0
 *  - "1.2"           >=1.2.0 <2.0.0
 *  - "^1.2.3"        >=1.2.3 <2.0.0
 *  - "~1.2.3"        >=1.2.3 <1.3.0
 *  - "1.2.3"         exactly 1.2.3
 */
export function satisfies(version: string, range: string): boolean {
  const v = parseVersion(version);
  if (range === 'latest' || range === '*') return true;

  const caret = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range);
  if (caret) {
    const min = `${caret[1]}.${caret[2]}.${caret[3]}`;
    return v.major === Number(caret[1]) && compareVersions(version, min) >= 0;
  }

  const tilde = /^~(\d+)\.(\d+)\.(\d+)$/.exec(range);
  if (tilde) {
    const min = `${tilde[1]}.${tilde[2]}.${tilde[3]}`;
    return v.major === Number(tilde[1]) && v.minor === Number(tilde[2]) && compareVersions(version, min) >= 0;
  }

  const majorOnly = /^(\d+)$/.exec(range);
  if (majorOnly) return v.major === Number(majorOnly[1]);

  const majorMinor = /^(\d+)\.(\d+)$/.exec(range);
  if (majorMinor) return v.major === Number(majorMinor[1]) && v.minor >= Number(majorMinor[2]);

  if (/^\d+\.\d+\.\d+$/.test(range)) return compareVersions(version, range) === 0;

  throw new Error(`Unsupported version range "${range}"`);
}

export function parseTemplateRef(ref: string): { id: string; range: string } {
  const at = ref.lastIndexOf('@');
  if (at <= 0) throw new Error(`Invalid template reference "${ref}" (expected "<template>@<range>")`);
  return { id: ref.slice(0, at), range: ref.slice(at + 1) };
}
