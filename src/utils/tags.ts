const tagPattern = /#([\p{L}\p{N}_-]+)/gu;

export function extractTags(text: string): string[] {
  const found = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(text)) !== null) {
    const raw = match[1].trim();
    if (raw) {
      found.add(raw.toLowerCase());
    }
  }

  return Array.from(found);
}

