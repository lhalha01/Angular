// DTO: forma exacta de los datos que devuelve la API (`/users` del backend local, que devuelve los campos de JSONPlaceholder).
// Solo debe importarlo `empleado.mapper.ts`; el resto de la aplicación usa el modelo `Empleado`
// (lo hace cumplir la regla `no-restricted-imports` de eslint.config.js).

export interface EmpleadoDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  website: string;
  company: { name: string };
}

/** Cuerpo del alta (POST /users): el backend exige `name` y `email`; el resto de datos del empleado no los guarda la API. */
export interface NuevoEmpleadoDto {
  name: string;
  email: string;
}
