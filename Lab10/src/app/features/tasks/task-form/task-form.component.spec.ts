import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TaskDraft } from '../../../core/models/task.model';
import { TaskFormComponent } from './task-form.component';

const USERS_URL = 'https://jsonplaceholder.typicode.com/users';
const USERS = [
  { id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' },
  { id: 2, name: 'Ervin', username: 'e', email: 'e@e.com' },
];

describe('TaskFormComponent', () => {
  async function setup(options: { value?: TaskDraft; users?: typeof USERS } = {}) {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TaskFormComponent);
    if (options.value) fixture.componentRef.setInput('value', options.value);
    fixture.detectChanges();
    http.expectOne(USERS_URL).flush(options.users ?? USERS);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const title = el.querySelector<HTMLInputElement>('#title')!;
    const user = el.querySelector<HTMLSelectElement>('#userId')!;
    const completed = el.querySelector<HTMLInputElement>('#completed')!;
    const submit = el.querySelector<HTMLButtonElement>('button[type="submit"]')!;

    const typeTitle = async (value: string) => {
      title.value = value;
      title.dispatchEvent(new Event('input'));
      title.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const saved = jasmine.createSpy('saved');
    const cancelled = jasmine.createSpy('cancelled');
    fixture.componentInstance.saved.subscribe(saved);
    fixture.componentInstance.cancelled.subscribe(cancelled);
    return { fixture, el, title, user, completed, submit, typeTitle, saved, cancelled };
  }

  const errorText = (el: HTMLElement) => el.querySelector('.error')?.textContent?.trim() ?? '';

  it('starts with the submit button disabled (empty title)', async () => {
    const { submit } = await setup();
    expect(submit.disabled).toBeTrue();
  });

  it('requires a title', async () => {
    const { el, typeTitle, submit } = await setup();
    await typeTitle('');
    expect(errorText(el)).toContain('obligatorio');
    expect(submit.disabled).toBeTrue();
  });

  it('rejects a title made only of spaces', async () => {
    const { el, typeTitle, submit } = await setup();
    await typeTitle('     ');
    expect(errorText(el)).toContain('obligatorio');
    expect(submit.disabled).toBeTrue();
  });

  it('rejects a title shorter than 3 characters', async () => {
    const { el, typeTitle, submit } = await setup();
    await typeTitle('ab');
    expect(errorText(el)).toContain('entre 3 y 120');
    expect(submit.disabled).toBeTrue();
  });

  it('rejects a title longer than 120 characters', async () => {
    const { el, typeTitle, submit } = await setup();
    await typeTitle('x'.repeat(121));
    expect(errorText(el)).toContain('entre 3 y 120');
    expect(submit.disabled).toBeTrue();
  });

  it('accepts a valid title and enables the submit button', async () => {
    const { el, typeTitle, submit } = await setup();
    await typeTitle('Comprar pan');
    expect(el.querySelector('.error')).toBeNull();
    expect(submit.disabled).toBeFalse();
  });

  it('lists the users and shows a warning when they could not be loaded', async () => {
    const ok = await setup();
    expect(Array.from(ok.user.options).map((o) => o.textContent?.trim())).toEqual(['1 · Leanne', '2 · Ervin']);
    TestBed.resetTestingModule();

    const empty = await setup({ users: [] });
    expect(errorText(empty.el)).toContain('No se pudo cargar la lista de usuarios');
  });

  it('starts from a copy of the initial value', async () => {
    const initial: TaskDraft = { title: 'Original', userId: 2, completed: true };
    const { title, completed, typeTitle } = await setup({ value: initial });
    expect(title.value).toBe('Original');
    expect(completed.checked).toBeTrue();

    await typeTitle('Cambiado');
    expect(initial.title).toBe('Original'); // el objeto de origen no se modifica
  });

  it('emits the trimmed values when submitted', async () => {
    const { fixture, typeTitle, completed, user, submit, saved } = await setup();
    await typeTitle('  Comprar pan  ');
    completed.click();
    user.selectedIndex = 1;
    user.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    submit.click();
    expect(saved).toHaveBeenCalledOnceWith({ title: 'Comprar pan', userId: 2, completed: true });
  });

  it('does not emit anything when the form is invalid', async () => {
    const { fixture, el, saved } = await setup();
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(saved).not.toHaveBeenCalled();
  });

  it('emits cancelled when Cancelar is pressed', async () => {
    const { el, cancelled } = await setup();
    el.querySelector<HTMLButtonElement>('button[type="button"]')!.click();
    expect(cancelled).toHaveBeenCalledTimes(1);
  });

  it('uses the given text for the submit button', async () => {
    const { fixture, el } = await setup();
    fixture.componentRef.setInput('submitLabel', 'Guardar cambios');
    fixture.detectChanges();
    expect(el.querySelector('button[type="submit"]')?.textContent).toContain('Guardar cambios');
  });

  describe('unsaved changes', () => {
    it('has none at the start', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeFalse();
    });

    it('has none at the start when editing an existing task', async () => {
      const { fixture } = await setup({ value: { title: 'Original', userId: 2, completed: true } });
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeFalse();
    });

    it('detects a change in the title, the user or the status', async () => {
      const first = await setup();
      await first.typeTitle('Algo');
      expect(first.fixture.componentInstance.hasUnsavedChanges()).toBeTrue();
      TestBed.resetTestingModule();

      const second = await setup();
      second.completed.click();
      second.fixture.detectChanges();
      await second.fixture.whenStable();
      expect(second.fixture.componentInstance.hasUnsavedChanges()).toBeTrue();
      TestBed.resetTestingModule();

      const third = await setup();
      third.user.selectedIndex = 1;
      third.user.dispatchEvent(new Event('change'));
      third.fixture.detectChanges();
      await third.fixture.whenStable();
      expect(third.fixture.componentInstance.hasUnsavedChanges()).toBeTrue();
    });

    it('does not count a change that was undone', async () => {
      const { fixture, typeTitle } = await setup({ value: { title: 'Original', userId: 1, completed: false } });
      await typeTitle('Otro');
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeTrue();
      await typeTitle('Original');
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeFalse();
    });

    it('has none after saving, so leaving afterwards does not ask', async () => {
      const { fixture, typeTitle, submit } = await setup();
      await typeTitle('Comprar pan');
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeTrue();
      submit.click();
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeFalse();
    });

    it('does not count as saved when the form was invalid and nothing was emitted', async () => {
      const { fixture, el, typeTitle } = await setup();
      await typeTitle('ab'); // inválido: menos de 3 caracteres
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeTrue();
    });

    it('asks the browser to confirm closing the tab only when there are changes', async () => {
      // Se llama al manejador directamente: disparar un `beforeunload` real en window haría
      // que Karma crea que un test ha recargado la página.
      const { fixture, typeTitle } = await setup();
      const handler = fixture.componentInstance as unknown as { onBeforeUnload(event: BeforeUnloadEvent): void };
      const fakeEvent = () => ({ preventDefault: jasmine.createSpy('preventDefault') }) as unknown as BeforeUnloadEvent;

      const quiet = fakeEvent();
      handler.onBeforeUnload(quiet);
      expect(quiet.preventDefault).not.toHaveBeenCalled();

      await typeTitle('Algo');
      const warned = fakeEvent();
      handler.onBeforeUnload(warned);
      expect(warned.preventDefault).toHaveBeenCalled();
    });
  });
});
