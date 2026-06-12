import { UserSummary } from '../types/user';

export function orderUsersForAssignment(
  users: UserSummary[],
  currentUserId?: string,
): UserSummary[] {
  const assignable = users.filter((user) => user.role !== 'GUEST');
  const sorted = [...assignable].sort(
    (a, b) =>
      (a.display_order ?? 0) - (b.display_order ?? 0) ||
      a.name.localeCompare(b.name),
  );

  if (!currentUserId) {
    return sorted;
  }

  const me = sorted.find((user) => user.id === currentUserId);
  if (!me) {
    return sorted;
  }

  return [me, ...sorted.filter((user) => user.id !== currentUserId)];
}
