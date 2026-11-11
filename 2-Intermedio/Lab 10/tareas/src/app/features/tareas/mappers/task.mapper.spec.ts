import { Task } from '../models/task.model';
import { TaskDto } from './task.dto';
import { aTaskDto, leerTask, mapearTask } from './task.mapper';

const dto: TaskDto = {
  id: 4,
  userId: 2,
  title: 'Comprar pan',
  completed: false,
  priority: 'high',
  createdAt: '2026-01-02T00:00:00.000Z',
};
const task: Task = {
  id: 4,
  userId: 2,
  title: 'Comprar pan',
  completed: false,
  priority: 'high',
  createdAt: '2026-01-02T00:00:00.000Z',
};

describe('mapearTask (API → dominio)', () => {
  it('traduce los campos de la API al modelo de dominio', () => {
    expect(mapearTask(dto)).toEqual(task);
  });

  it('la fecha de creación es opcional (JSONPlaceholder no la trae)', () => {
    const sinFecha: TaskDto = { id: 4, userId: 2, title: 'Comprar pan', completed: false };
    const resultado = mapearTask(sinFecha);
    expect('createdAt' in resultado).toBeFalse();
  });

  it('la prioridad de la API se respeta; si la API no la trae (JSONPlaceholder) queda en media', () => {
    expect(mapearTask({ ...dto, priority: 'low' }).priority).toBe('low');
    expect(mapearTask({ id: 1, userId: 1, title: 'x', completed: false }).priority).toBe('medium');
  });

  it('descarta lo que la API añada de más: no entra en el dominio', () => {
    const conExtra = { ...dto, secreto: 'x', otro: 1 } as TaskDto;
    expect(Object.keys(mapearTask(conExtra)).sort()).toEqual(['completed', 'createdAt', 'id', 'priority', 'title', 'userId']);
  });
});

describe('aTaskDto (dominio → API)', () => {
  it('con id (sustituir o restaurar) lleva todos los campos, también la prioridad', () => {
    expect(aTaskDto(task, true)).toEqual({
      id: 4,
      userId: 2,
      title: 'Comprar pan',
      completed: false,
      priority: 'high',
      createdAt: '2026-01-02T00:00:00.000Z',
    });
  });

  it('sin id (crear con el backend propio) no lleva el id, que asigna el servidor', () => {
    const cuerpo = aTaskDto(task, false);
    expect('id' in cuerpo).toBeFalse();
    expect(cuerpo.title).toBe('Comprar pan');
    expect(cuerpo.priority).toBe('high');
  });

  it('no envía la fecha si el dominio no la tiene', () => {
    const sinFecha: Task = { id: 4, userId: 2, title: 'Comprar pan', completed: false, priority: 'medium' };
    expect('createdAt' in aTaskDto(sinFecha, true)).toBeFalse();
  });
});

describe('leerTask (frontera de datos de la API)', () => {
  it('mapea un elemento con la forma esperada', () => {
    expect(leerTask(dto)).toEqual(task);
  });

  it('acepta un elemento sin prioridad (API pública) y le pone la prioridad por defecto', () => {
    const sinPrioridad: TaskDto = { ...dto };
    delete sinPrioridad.priority;
    expect(leerTask(sinPrioridad)?.priority).toBe('medium');
  });

  it('devuelve null si falta un campo o tiene el tipo equivocado', () => {
    expect(leerTask({ ...dto, id: '4' })).toBeNull();
    expect(leerTask({ ...dto, userId: undefined })).toBeNull();
    expect(leerTask({ ...dto, title: 3 })).toBeNull();
    expect(leerTask({ ...dto, completed: 'no' })).toBeNull();
    expect(leerTask({ ...dto, createdAt: 5 })).toBeNull();
    expect(leerTask(null)).toBeNull();
    expect(leerTask('texto')).toBeNull();
  });

  it('rechaza una prioridad que no sea alta, media o baja', () => {
    expect(leerTask({ ...dto, priority: 'urgente' })).toBeNull();
    expect(leerTask({ ...dto, priority: 3 })).toBeNull();
    expect(leerTask({ ...dto, priority: null })).toBeNull();
  });
});
