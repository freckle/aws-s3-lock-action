export function normalizePrefix(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return trimmed;
  }

  const leadingSlashRemoved = trimmed.startsWith("/")
    ? trimmed.substring(1)
    : trimmed;

  const trailingSlashAdded = leadingSlashRemoved.endsWith("/")
    ? leadingSlashRemoved
    : `${leadingSlashRemoved}/`;

  return trailingSlashAdded;
}
