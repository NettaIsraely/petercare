function createActionId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export interface ApiActionContext {
  actionId: string;
  context: string;
}

let activeContext: ApiActionContext | null = null;

export function getActiveApiActionContext(): ApiActionContext | null {
  return activeContext;
}

export async function withApiAction<T>(
  context: string,
  fn: () => Promise<T>,
): Promise<T> {
  activeContext = {
    actionId: createActionId(),
    context,
  };

  try {
    return await fn();
  } finally {
    activeContext = null;
  }
}
