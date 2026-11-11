// DTO: forma de los datos que devuelve la API para un proyecto. Los proyectos se obtienen de `/todos` (cada tarea del
// backend hace de proyecto, como pide el enunciado del Lab 14). Solo debe importarlo `proyecto.mapper.ts`; el resto de
// la aplicación usa el modelo `Proyecto` (lo hace cumplir la regla `no-restricted-imports` de eslint.config.js).

export interface ProyectoDto {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
  /** Fecha ISO de creación; la API pública (JSONPlaceholder) no la devuelve, el backend local sí. */
  createdAt?: string;
}
