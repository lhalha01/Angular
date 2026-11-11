// API pública de la feature `tareas`: lo único que otras partes de la aplicación pueden importar.
// Los barrels que mezclan tipos y valores necesitan `export type` para los tipos (`isolatedModules`).
export { TaskService } from './services/task.service';
export { isTask } from './models/task.model';
export type { Task, TaskDraft, TaskFilter, NewTask, UpdateTask, TaskSummary } from './models/task.model';
