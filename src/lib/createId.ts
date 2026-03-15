export function createId(prefix = ''): string {
  const baseId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 11);

  return prefix ? `${prefix}-${baseId}` : baseId;
}
