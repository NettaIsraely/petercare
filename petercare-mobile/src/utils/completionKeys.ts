export type CompletingKey = `feeding:${string}` | `task:${string}`;

export function completingKey(kind: 'feeding' | 'task', id: string): CompletingKey {
  return `${kind}:${id}`;
}

export function isCompletingKey(
  completingIds: Set<string>,
  kind: 'feeding' | 'task',
  id: string
): boolean {
  return completingIds.has(completingKey(kind, id));
}
