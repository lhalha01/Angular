export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

/** Datos necesarios para crear un usuario (el id lo asigna el servicio). */
export type UserDraft = Omit<User, 'id'>;

/** Type guard para usuarios que vienen de la API (véase `isTask`). */
export function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['id'] === 'number' &&
    typeof v['name'] === 'string' &&
    typeof v['username'] === 'string' &&
    typeof v['email'] === 'string'
  );
}
