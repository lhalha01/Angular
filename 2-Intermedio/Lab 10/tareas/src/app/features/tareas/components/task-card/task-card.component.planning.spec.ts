import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Task } from '../../models/task.model';
import { TaskCardComponent } from './task-card.component';

const BASE: Task = { id: 1, userId: 1, title: 'Comprar pan', completed: false, priority: 'medium', createdAt: '2026-01-01T00:00:00Z' };

describe('TaskCardComponent: etiquetas (Lab 16.2)', () => {
  function crear(task: Task) {
    TestBed.configureTestingModule({ imports: [TaskCardComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TaskCardComponent);
    fixture.componentRef.setInput('task', task);
    fixture.componentRef.setInput('userName', 'Leanne');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra las etiquetas de la tarea', () => {
    const el = crear({ ...BASE, tags: ['demo', 'urgente'] });
    expect(Array.from(el.querySelectorAll('.tag')).map((t) => t.textContent?.trim())).toEqual(['demo', 'urgente']);
  });

  it('sin etiquetas no muestra nada', () => {
    expect(crear(BASE).querySelector('.tags')).toBeNull();
    TestBed.resetTestingModule();
    expect(crear({ ...BASE, tags: [] }).querySelector('.tags')).toBeNull();
  });
});
