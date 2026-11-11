import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Task } from '../../models/task.model';
import { TaskDetailComponent } from './task-detail.component';

const BASE: Task = { id: 4, userId: 1, title: 'Estudiar Angular', completed: false, priority: 'high', createdAt: '2026-01-01T00:00:00Z' };

describe('TaskDetailComponent: planificación (Lab 16.2)', () => {
  function crear(task: Task) {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TaskDetailComponent);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
    http.match('https://jsonplaceholder.typicode.com/users').forEach((r) => r.flush([{ id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' }]));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }
  const filas = (el: HTMLElement) => Array.from(el.querySelectorAll('.row')).map((r) => r.textContent?.replace(/\s+/g, ' ').trim());

  it('muestra la descripción, las fechas (dd/MM/yyyy) y las etiquetas cuando la tarea las tiene', () => {
    const el = crear({ ...BASE, description: 'Capítulo 16', startDate: '2026-03-01', endDate: '2026-03-05', tags: ['rxjs', 'forms'] });
    const texto = filas(el).join(' | ');
    expect(texto).toContain('DescripciónCapítulo 16');
    expect(texto).toContain('Inicio01/03/2026');
    expect(texto).toContain('Fin05/03/2026');
    expect(Array.from(el.querySelectorAll('.tag')).map((t) => t.textContent?.trim())).toEqual(['rxjs', 'forms']);
  });

  it('no muestra las filas de lo que la tarea no tiene', () => {
    const texto = filas(crear(BASE)).join(' | ');
    for (const etiqueta of ['Descripción', 'Inicio', 'Fin', 'Etiquetas']) expect(texto).not.toContain(etiqueta);
  });

  it('solo muestra lo que existe (p. ej. una fecha de inicio sin fin)', () => {
    const texto = filas(crear({ ...BASE, startDate: '2026-03-01' })).join(' | ');
    expect(texto).toContain('Inicio01/03/2026');
    expect(texto).not.toContain('Fin0');
  });
});
