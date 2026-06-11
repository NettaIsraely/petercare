export type CompletingKey = `feeding:${string}` | `task:${string}` | `treatment:${string}`;

export function completingKey(
  kind: 'feeding' | 'task' | 'treatment',
  id: string
): CompletingKey {
  return `${kind}:${id}`;
}

export function isCompletingKey(
  completingIds: Set<string>,
  kind: 'feeding' | 'task' | 'treatment',
  id: string
): boolean {
  return completingIds.has(completingKey(kind, id));
}
