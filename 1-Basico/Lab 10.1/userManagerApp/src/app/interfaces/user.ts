/** Usuario tal y como lo usa la aplicación (ya normalizado). */
export interface UserInterface {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  website: string;
  city: string;
  company: string;
  /** URL generada dinámicamente (JSONPlaceholder no proporciona avatar). */
  avatar: string;
  /** Fecha de alta simulada: la API tampoco la proporciona. */
  createdAt: Date;
  /** true si el usuario solo existe en memoria (creado en esta sesión). */
  isLocal: boolean;
}

/** Datos editables desde el formulario de alta / edición. */
export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  company: string;
  website: string;
}

/** Forma (parcial) de un usuario en la API de JSONPlaceholder. */
export interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: { city?: string };
  company?: { name?: string };
}
