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
