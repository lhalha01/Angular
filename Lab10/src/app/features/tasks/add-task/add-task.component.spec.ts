import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { AddTaskComponent } from './add-task.component';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';
const USERS = 'https://jsonplaceholder.typicode.com/users';

describe('AddTaskComponent', () => {
  async function setup() {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(AddTaskComponent);
    fixture.detectChanges();
    http.match(USERS).forEach((r) => r.flush([{ id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' }]));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, http, navigate, el: fixture.nativeElement as HTMLElement };
  }

  async function fill(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }, el: HTMLElement, text: string) {
    const title = el.querySelector<HTMLInputElement>('#title')!;
    title.value = text;
    title.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('shows the creation form', async () => {
    const { el } = await setup();
    expect(el.querySelector('h2')?.textContent).toContain('Crear tarea');
    expect(el.querySelector('app-task-form')).not.toBeNull();
  });

  it('creates the task, shows a toast and goes back to the list', async () => {
    const { fixture, http, navigate, el } = await setup();
    await fill(fixture, el, 'Comprar pan');

    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    http.expectOne({ method: 'GET', url: TODOS }).flush([]); // carga inicial del TaskService
    const post = http.expectOne({ method: 'POST', url: TODOS });
    expect(post.request.body).toEqual(jasmine.objectContaining({ title: 'Comprar pan', userId: 1, completed: false }));
    post.flush({ id: 201 });

    expect(TestBed.inject(ToastService).toasts()[0].message).toContain('creada');
    expect(navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('goes back to the list when cancelled, without creating anything', async () => {
    const { el, http, navigate } = await setup();
    el.querySelector<HTMLButtonElement>('button[type="button"]')!.click();
    expect(navigate).toHaveBeenCalledWith(['/tasks']);
    http.expectNone({ method: 'POST' });
  });
});
