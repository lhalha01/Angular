import { Task } from '../models/task.model';
import { TaskDto } from './task.dto';
import { aTaskDto, leerTask, mapearTask } from './task.mapper';

const dto: TaskDto = { id: 4, userId: 2, title: 'Comprar pan', completed: false, createdAt: '2026-01-02T00:00:00.000Z' };
const task: Task = { id: 4, userId: 2, title: 'Comprar pan', completed: false, createdAt: '2026-01-02T00:00:00.000Z' };

describe('mapearTask (API → dominio)', () => {
  it('traduce los campos de la API al modelo de dominio', () => {
    expect(mapearTask(dto)).toEqual(task);
  });

  it('la fecha de creación es opcional (JSONPlaceholder no la trae)', () => {
    const sinFecha: TaskDto = { id: 4, userId: 2, title: 'Comprar pan', completed: false };
    const resultado = mapearTask(sinFecha);
    expect('createdAt' in resultado).toBeFalse();
  });

  it('descarta lo que la API añada de más: no entra en el dominio', () => {
    const conExtra = { ...dto, secreto: 'x', otro: 1 } as TaskDto;
    expect(Object.keys(mapearTask(conExtra)).sort()).toEqual(['completed', 'createdAt', 'id', 'title', 'userId']);
  });
});

describe('aTaskDto (dominio → API)', () => {
  it('con id (sustituir o restaurar) lleva todos los campos', () => {
    expect(aTaskDto(task, true)).toEqual({ ...dto });
  });

  it('sin id (crear con el backend propio) no lleva el id, que asigna el servidor', () => {
    const cuerpo = aTaskDto(task, false);
    expect('id' in cuerpo).toBeFalse();
    expect(cuerpo.title).toBe('Comprar pan');
  });

  it('no envía la fecha si el dominio no la tiene', () => {
    const sinFecha: Task = { id: 4, userId: 2, title: 'Comprar pan', completed: false };
    expect('createdAt' in aTaskDto(sinFecha, true)).toBeFalse();
  });
});

describe('leerTask (frontera de datos de la API)', () => {
  it('mapea un elemento con la forma esperada', () => {
    expect(leerTask(dto)).toEqual(task);
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
});
