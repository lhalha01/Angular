export interface Task {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
  /** Campo local (la API no lo devuelve): se rellena al cargar/crear. */
  createdAt?: string;
}

/** Campos editables por el usuario en los formularios. */
export type TaskDraft = Pick<Task, 'title' | 'userId' | 'completed'>;

export type TaskFilter = 'all' | 'completed' | 'pending';

/** Tipos derivados con Utility Types: se mantienen solos si cambia `Task`. */
export type NewTask = Omit<Task, 'id' | 'createdAt'>;
export type UpdateTask = Partial<Pick<Task, 'title' | 'completed' | 'userId'>>;
export type TaskSummary = Pick<Task, 'id' | 'title' | 'completed'>;

/**
 * Type guard para datos que vienen de fuera (respuestas HTTP): comprueba la forma antes de que el
 * resto de la aplicación los trate como `Task`.
 */
export function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['id'] === 'number' &&
    typeof v['userId'] === 'number' &&
    typeof v['title'] === 'string' &&
    typeof v['completed'] === 'boolean' &&
    (v['createdAt'] === undefined || typeof v['createdAt'] === 'string')
  );
}
