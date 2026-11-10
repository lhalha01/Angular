export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

/** Datos necesarios para crear un usuario (el id lo asigna el servicio). */
export type UserDraft = Omit<User, 'id'>;
