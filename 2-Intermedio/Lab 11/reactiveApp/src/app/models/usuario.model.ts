/**
 * Modelo de usuario que usan los ejemplos de programación reactiva (Lab 11).
 * Es una vista simplificada de `UserInterface` (Lab 10.1): nombre completo en un
 * solo campo, que es lo que esperan los componentes de este laboratorio.
 */
export interface Usuario {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string;
}

/** Datos necesarios para crear un usuario (el id y el avatar los genera la aplicación). */
export type NuevoUsuario = Omit<Usuario, 'id' | 'avatar'>;
