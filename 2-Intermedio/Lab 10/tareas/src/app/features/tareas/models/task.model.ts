/** Prioridad de una tarea. Es el valor que usa la API (`/todos`): 'high', 'medium' o 'low'. */
export type Priority = 'high' | 'medium' | 'low';

/** Prioridades en el orden en que se ofrecen en los filtros y formularios, con su texto para el usuario. */
export const PRIORITIES: readonly { value: Priority; label: string }[] = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
];

export const DEFAULT_PRIORITY: Priority = 'medium';

/** Límites que impone el backend y que valida el formulario. */
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_TAG_LENGTH = 20;
export const MAX_TAGS = 20;

export const isPriority = (value: unknown): value is Priority => value === 'high' || value === 'medium' || value === 'low';

export interface Task {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
  priority: Priority;
  /** Descripción opcional (hasta `MAX_DESCRIPTION_LENGTH` caracteres). Ausente = sin descripción. */
  description?: string;
  /** Día de inicio (`AAAA-MM-DD`), opcional. */
  startDate?: string;
  /** Día de fin (`AAAA-MM-DD`), opcional; no anterior al de inicio. */
  endDate?: string;
  /** Etiquetas (hasta `MAX_TAG_LENGTH` caracteres cada una). Ausente = sin etiquetas. */
  tags?: string[];
  /** Campo local (la API no lo devuelve): se rellena al cargar/crear. */
  createdAt?: string;
}

/** Campos editables por el usuario en los formularios. */
export type TaskDraft = Pick<Task, 'title' | 'userId' | 'completed' | 'priority'> &
  Partial<Pick<Task, 'description' | 'startDate' | 'endDate' | 'tags'>>;

export type TaskFilter = 'all' | 'completed' | 'pending';
export type TaskPriorityFilter = 'all' | Priority;

/** Tipos derivados con Utility Types: se mantienen solos si cambia `Task`. */
export type NewTask = Omit<Task, 'id' | 'createdAt'>;
export type UpdateTask = Partial<Pick<Task, 'title' | 'completed' | 'userId' | 'priority' | 'description' | 'startDate' | 'endDate' | 'tags'>>;
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
    isPriority(v['priority']) &&
    (v['description'] === undefined || typeof v['description'] === 'string') &&
    (v['startDate'] === undefined || typeof v['startDate'] === 'string') &&
    (v['endDate'] === undefined || typeof v['endDate'] === 'string') &&
    (v['tags'] === undefined || (Array.isArray(v['tags']) && v['tags'].every((t) => typeof t === 'string'))) &&
    (v['createdAt'] === undefined || typeof v['createdAt'] === 'string')
  );
}
