
### **📌 Título: Gestor de Tareas (To-Do App Avanzado)**

---

### **🎯 Objetivo**

Desarrollar una aplicación SPA (Single Page Application) usando Angular que permita gestionar una lista de tareas, categorizarlas y visualizarlas con filtros personalizados. Esta práctica evaluará la comprensión de los siguientes conceptos clave:

* **Directivas estructurales y de atributos**
* **Pipes personalizados y built-in**
* **Servicios para gestión de datos**
* **Routing con parámetros y rutas hijas**
* **Data binding (one-way, two-way y event binding)**

---

### **📁 Estructura mínima de la app**

#### Rutas requeridas:

| Ruta           | Componente     | Descripción                      |
| -------------- | -------------- | --------------------------------- |
| `/`          | `Home`       | Página de bienvenida             |
| `/tasks`     | `TaskList`   | Muestra lista de tareas           |
| `/tasks/:id` | `TaskDetail` | Muestra detalles de una tarea     |
| `/add-task`  | `AddTask`    | Formulario para crear nueva tarea |

---

### **📌 Requerimientos funcionales**

#### ✅ Tareas

* Crear, listar, editar y eliminar tareas.
* Cada tarea debe tener:

  * Título
  * Id de Usuario
  * Completado (Verdadero o Falso)

#### ✅ Data Binding

* Mostrar tareas en una lista con _interpolación_ y _property binding_.
* Usar _event binding_ para botones (editar, eliminar).
* _Two-way binding_ para formularios con `[(ngModel)]`.

#### ✅ Directivas

* Usar `*@If` y `*@For` para mostrar elementos condicionales y listas.
* Crear una directiva que **resalte un usuario** si su nombre comienza con una vocal (A, E, I, O, U).

#### ✅ Pipes

* Usar pipes integrados como `date`, `uppercase`, etc.
* Crear un **pipe personalizado** para mostrar el estado de la tarea en texto coloreado o como emoji.

#### ✅ Servicios

* Crear un servicio (`Task`) que consuma una API pública (`https://jsonplaceholder.typicode.com/todos`) usando `HttpClient`. Este servicio debe permitir:
* Obtener todas las tareas
* Obtener una tarea por ID
* (Opcional) Agregar, editar o eliminar tareas simuladas (aunque la API no guarda los cambios, puedes hacer el _POST_/_PUT_/_DELETE_ para practicar).
* Utilizar _inyección de dependencias_ para consumir el servicio desde los componentes.
* Para obtener información del **ID de usuario** y **Nombre de Usuario** asociado a cada tarea, puedes utilizar el **servicio de usuarios mockeado** que se describe en [Lab-10.1: Final Lab](Lab-10.1-Final-Lab.md). Este servicio consume la API `https://jsonplaceholder.typicode.com/users` y te permitirá **cruzar datos** entre tareas y usuarios para mostrar, por ejemplo, el nombre completo del usuario responsable de cada tarea.

#### ✅ Routing

* Configurar rutas básicas y navegación.
* Mostrar detalles de una tarea con `ActivatedRoute` (usando `:id`).

---

### **✨ Requerimientos extra **

* Implementación de un mecanismo de confirmación previa a la eliminación de una tarea, utilizando window.confirm o un cuadro de diálogo modal para garantizar acciones de borrado explícitas y seguras.
* Incorporación de un sistema de filtrado de tareas por estado o categoría mediante un componente select, permitiendo la segmentación dinámica de la lista según los criterios establecidos.
* Implementación de la funcionalidad de edición de tareas mediante rutas anidadas (/tasks/:id/edit). Se ofrece la posibilidad de extender la edición a otros atributos del modelo, además del título y completitud, así como la opción de definir validadores adicionales para garantizar la integridad y consistencia de los datos introducidos.
* Aunque los servicios son mockeados y **no se guarda el estado en el servidor**, debes **mantener el estado en memoria** de la aplicación para simular correctamente las operaciones de creación, actualización y borrado. Esto significa que los cambios deben reflejarse en la interfaz durante la sesión actual de la aplicación.

---

### **📤 Entrega de la práctica**

* La práctica debe realizarse en un **repositorio público propio de GitHub**.
* Una vez completada, deberás **añadir a los tutores como colaboradores** del repositorio para que puedan descargar y validar tu código.
* Asegúrate de que el repositorio incluya:

  * El código fuente completo del proyecto Angular.
  * Un archivo `README.md` con instrucciones para instalar dependencias y ejecutar la aplicación.
  * **Comentarios en el código** cuando resulte necesario para clarificar bloques de lógica compleja o decisiones de diseño.
* Además, deberá verificarse lo siguiente:

  * **Integridad de los paquetes utilizados** en la práctica, garantizando que no existan alteraciones, inconsistencias o dependencias no esperadas.
  * Utilización de las últimas versiones estables disponibles de las dependencias relevantes, especialmente las relacionadas con Angular 19 y su ecosistema.
  * Ejecución de una **revisión de vulnerabilidades** (por ejemplo, mediante npm audit u otras herramientas equivalentes) y resolución o documentación de los hallazgos detectados.
