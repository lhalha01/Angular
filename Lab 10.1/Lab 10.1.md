
📝 Práctica Final de Angular Básico
-------------------------------------

### **📌 Título: Gestor de Usuarios**

---

### **🎯 Objetivo**

Construir una aplicación en Angular que permita listar, ver detalles, agregar y eliminar usuarios, integrando consumo de una API mockeada. Esta práctica evalúa el uso de:

* **Directivas estructurales y de atributos**
* **Pipes (built-in y personalizados)**
* **Servicios HTTP con `HttpClient`**
* **Routing (con parámetros y rutas hijas)**
* **Data binding en formularios y vistas**

---

### **📁 Estructura de rutas de la aplicación**

| Ruta           | Componente     | Descripción                     |
| -------------- | -------------- | -------------------------------- |
| `/`          | `Home`       | Página de bienvenida            |
| `/users`     | `UserList`   | Lista de usuarios                |
| `/users/:id` | `UserDetail` | Detalle del usuario seleccionado |
| `/add-user`  | `AddUser`    | Formulario para crear usuario    |

---

### **🌐 API Pública Mockeada**

Utilizaremos la API de **Reqres**:

* **Lista de usuarios:** `https://jsonplaceholder.typicode.com/users`
* **Usuario por ID:** `https://jsonplaceholder.typicode.com/users/:id`
* **Crear usuario (simulado):** `https://jsonplaceholder.typicode.com/users` (POST)
* **Eliminar usuario (simulado):** `https://jsonplaceholder.typicode.com/users/:id` (DELETE)

> ⚠️ Nota: Los cambios no se guardan en servidor. Son solo para práctica de llamadas HTTP.

---

### **📌 Requerimientos funcionales**

#### ✅ Usuarios

Cada usuario debe mostrar:

* Nombre completo
* Email
* Avatar (*)
* ID

> (*) **Nota:** El avatar no es proporcionado por el servicio mockeado de JSONPlaceholder, pero se recomienda que generes esta imagen de forma dinámica al obtener la información del servicio. Puedes usar servicios como [UI Avatars](https://ui-avatars.com/) o [DiceBear](https://www.dicebear.com/) para generar avatares basados en el nombre del usuario.

Debe ser posible:

* Listar usuarios
* Ver detalles individuales
* Agregar un nuevo usuario (formulario)
* Eliminar un usuario

#### ✅ Data Binding

* Usar `[(ngModel)]` para crear nuevos usuarios.
* Mostrar información con interpolación y property binding.
* Usar event binding para botones (detalle, eliminar).

#### ✅ Directivas

* `@For` para mostrar la lista de usuarios.
* `@If` para estados condicionales (como “no hay usuarios”).
* Crear una **directiva personalizada** que resalte usuarios con IDs pares (cambia el color del fondo, por ejemplo).

#### ✅ Pipes

* Usar `uppercase`, `date` y otros built-in.
* Crear un **pipe personalizado** que formatee el nombre completo (`first_name + last_name` → `Sr. Apellido, Nombre`).

#### ✅ Servicios

* Crear un servicio `User` para consumir la API de Reqres usando `HttpClient`.
  * Métodos: `getUsers()`, `getUser(id)`, `addUser()`, `deleteUser()`

#### ✅ Routing

* Navegar entre `/users`, `/users/:id` y `/add-user`
* Mostrar detalle de usuario con parámetros de ruta

---

### **🎁 Requerimientos extra **

* Implementación de un mecanismo de paginación básica, aprovechando el sistema de paginación nativo proporcionado por la API de Reqres.
* Implementación de un mecanismo de filtrado por nombre o email mediante un campo de entrada (input) y el uso de un pipe personalizado para procesar los criterios de búsqueda.
* Implementación de la funcionalidad de edición de datos de usuario mediante rutas anidadas (/users/:id/edit). Se ofrece la posibilidad de extender la edición a otros atributos del modelo, además del nombre y el email, así como la opción de definir validadores adicionales para garantizar la integridad y consistencia de los datos introducidos.
* Implementación de un sistema de notificaciones para informar al usuario tras la creación o eliminación de un registro.
* Aunque los servicios son mockeados y **no se guarda el estado en el servidor**, debes **mantener el estado en memoria** de la aplicación para simular correctamente las operaciones de creación, actualización y borrado. Esto significa que los cambios deben reflejarse en la interfaz durante la sesión actual de la aplicación.

---

### **📤 Entrega de la práctica**

* La práctica debe realizarse en un **repositorio público propio de GitHub**.
* Una vez completada, deberás **añadir a los tutores como colaboradores** del repositorio para que puedan descargar y validar tu código.
* Asegúrate de que el repositorio incluya:

  * El código fuente completo del proyecto Angular
  * Un archivo `README.md` con instrucciones para instalar dependencias y ejecutar la aplicación
  * **Comentarios en el código** cuando resulte necesario para clarificar bloques de lógica compleja o decisiones de diseño.
* Además, deberá verificarse lo siguiente:

  * **Integridad de los paquetes utilizados** en la práctica, garantizando que no existan alteraciones, inconsistencias o dependencias no esperadas.
  * Utilización de las últimas versiones estables disponibles de las dependencias relevantes, especialmente las relacionadas con Angular 19 y su ecosistema.
  * Ejecución de una **revisión de vulnerabilidades** (por ejemplo, mediante npm audit u otras herramientas equivalentes) y resolución o documentación de los hallazgos detectados.
