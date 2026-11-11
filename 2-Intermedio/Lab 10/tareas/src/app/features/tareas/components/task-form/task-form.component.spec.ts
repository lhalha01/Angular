import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TaskDraft } from '../../models/task.model';
import { TaskFormComponent } from './task-form.component';

const USERS_URL = 'https://jsonplaceholder.typicode.com/users';
const USERS = [
  { id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' },
  { id: 2, name: 'Ervin', username: 'e', email: 'e@e.com' },
];
const BASE: TaskDraft = { title: 'Original', userId: 1, completed: false, priority: 'medium' };

describe('TaskFormComponent (Reactive Forms)', () => {
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
    const q = <T extends HTMLElement>(selector: string) => el.querySelector<T>(selector)!;
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const set = async (selector: string, value: string, event: 'input' | 'change' = 'input', blur = false) => {
      const c = q<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector);
      c.value = value;
      c.dispatchEvent(new Event(event));
      if (blur) c.dispatchEvent(new Event('blur'));
      await settle();
    };
    const typeTitle = (value: string) => set('#title', value, 'input', true);
    const submit = () => q<HTMLButtonElement>('button[type="submit"]');
    const send = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await settle();
    };
    const addTag = async () => {
      Array.from(el.querySelectorAll<HTMLButtonElement>('button[type="button"]')).find((b) => b.textContent?.includes('Añadir etiqueta'))!.click();
      await settle();
    };
    const tagInputs = () => Array.from(el.querySelectorAll<HTMLInputElement>('.tag-row input'));
    const errors = () => Array.from(el.querySelectorAll('.error')).map((e) => e.textContent?.replace(/\s+/g, ' ').trim());
    const saved = jasmine.createSpy('saved');
    const cancelled = jasmine.createSpy('cancelled');
    fixture.componentInstance.saved.subscribe(saved);
    fixture.componentInstance.cancelled.subscribe(cancelled);
    return { fixture, el, q, set, typeTitle, submit, send, addTag, tagInputs, errors, saved, cancelled, settle };
  }

  describe('título', () => {
    it('al empezar no muestra ningún error y el botón de guardar está activo', async () => {
      const { errors, submit } = await setup();
      expect(errors()).toEqual([]);
      expect(submit().disabled).toBeFalse();
    });

    it('lo exige (al tocarlo vacío)', async () => {
      const { typeTitle, errors } = await setup();
      await typeTitle('');
      expect(errors()).toEqual(['El título es obligatorio.']);
    });

    it('rechaza un título de solo espacios', async () => {
      const { typeTitle, errors } = await setup();
      await typeTitle('     ');
      expect(errors()).toEqual(['El título es obligatorio.']);
    });

    it('rechaza menos de 3 y más de 120 caracteres', async () => {
      const { typeTitle, errors } = await setup();
      await typeTitle('ab');
      expect(errors()).toEqual(['Debe tener entre 3 y 120 caracteres.']);
      await typeTitle('x'.repeat(121));
      expect(errors()).toEqual(['Debe tener entre 3 y 120 caracteres.']);
      await typeTitle('x'.repeat(120));
      expect(errors()).toEqual([]);
    });

    it('un campo inválido pero sin tocar no muestra error', async () => {
      const { set, errors } = await setup();
      await set('#title', 'ab'); // sin blur
      expect(errors()).toEqual([]);
    });
  });

  describe('envío', () => {
    it('al intentar enviar con errores no emite nada y los muestra todos', async () => {
      const { send, errors, saved } = await setup();
      await send();
      expect(saved).not.toHaveBeenCalled();
      expect(errors()).toEqual(['El título es obligatorio.']);
    });

    it('el botón no se desactiva por estar inválido (así se pueden ver los errores)', async () => {
      const { submit, send } = await setup();
      await send();
      expect(submit().disabled).toBeFalse();
    });

    it('el botón se desactiva y cambia su texto mientras el padre está guardando', async () => {
      const { fixture, submit, settle } = await setup();
      fixture.componentRef.setInput('saving', true);
      await settle();
      expect(submit().disabled).toBeTrue();
      expect(submit().textContent).toContain('Guardando');
      fixture.componentRef.setInput('saving', false);
      await settle();
      expect(submit().disabled).toBeFalse();
    });

    it('emite los valores recortados, con los opcionales vacíos como undefined explícito', async () => {
      const { typeTitle, set, q, send, saved, settle } = await setup();
      await typeTitle('  Comprar pan  ');
      q<HTMLInputElement>('#completed').click();
      await set('#userId', '1', 'change'); // el valor de un select con ngValue se elige por posición
      const user = q<HTMLSelectElement>('#userId');
      user.selectedIndex = 1;
      user.dispatchEvent(new Event('change'));
      await settle();
      await send();
      expect(saved).toHaveBeenCalledTimes(1);
      const draft = saved.calls.mostRecent().args[0] as TaskDraft;
      expect(draft).toEqual({
        title: 'Comprar pan',
        userId: 2,
        completed: true,
        priority: 'medium',
        description: undefined,
        startDate: undefined,
        endDate: undefined,
        tags: undefined,
      });
      expect(Object.keys(draft)).toContain('description'); // la clave está: al editar, borra el valor antiguo
    });

    it('emite la descripción, las fechas, la prioridad y las etiquetas', async () => {
      const { typeTitle, set, q, addTag, tagInputs, send, saved, settle } = await setup();
      await typeTitle('Preparar la demo');
      await set('#description', '  Revisar las diapositivas  ');
      const priority = q<HTMLSelectElement>('#priority');
      priority.selectedIndex = 0; // Alta
      priority.dispatchEvent(new Event('change'));
      await set('#startDate', '2026-03-01');
      await set('#endDate', '2026-03-05');
      await addTag();
      await addTag();
      const inputs = tagInputs();
      inputs[0].value = ' demo ';
      inputs[0].dispatchEvent(new Event('input'));
      inputs[1].value = 'urgente';
      inputs[1].dispatchEvent(new Event('input'));
      await settle();

      await send();
      expect(saved).toHaveBeenCalledOnceWith({
        title: 'Preparar la demo',
        userId: 1,
        completed: false,
        priority: 'high',
        description: 'Revisar las diapositivas',
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        tags: ['demo', 'urgente'],
      });
    });

    it('emite cancelled al pulsar Cancelar', async () => {
      const { q, cancelled } = await setup();
      Array.from(q<HTMLElement>('form').querySelectorAll<HTMLButtonElement>('button[type="button"]')).find((b) => b.textContent?.includes('Cancelar'))!.click();
      expect(cancelled).toHaveBeenCalledTimes(1);
    });

    it('usa el texto indicado para el botón', async () => {
      const { fixture, submit, settle } = await setup();
      fixture.componentRef.setInput('submitLabel', 'Guardar cambios');
      await settle();
      expect(submit().textContent).toContain('Guardar cambios');
    });
  });

  describe('usuarios', () => {
    it('los lista y avisa si no se pudieron cargar', async () => {
      const ok = await setup();
      expect(Array.from(ok.q<HTMLSelectElement>('#userId').options).map((o) => o.textContent?.trim())).toEqual(['1 · Leanne', '2 · Ervin']);
      TestBed.resetTestingModule();
      const empty = await setup({ users: [] });
      expect(empty.errors()).toEqual(['No se pudo cargar la lista de usuarios.']);
    });
  });

  describe('fechas (validación cruzada)', () => {
    it('una fecha de fin anterior a la de inicio da el error del grupo, que se muestra al tocar un campo', async () => {
      const { q, set, errors, settle } = await setup();
      await set('#startDate', '2026-03-10');
      await set('#endDate', '2026-03-01');
      expect(errors()).toEqual([]); // aún sin tocar ningún campo
      q<HTMLInputElement>('#endDate').dispatchEvent(new Event('blur'));
      await settle();
      expect(errors()).toEqual(['La fecha de fin no puede ser anterior a la de inicio.']);
    });

    it('el error es del grupo, no de ningún campo', async () => {
      const { fixture, set } = await setup();
      await set('#startDate', '2026-03-10');
      await set('#endDate', '2026-03-01');
      const form = (fixture.componentInstance as unknown as { form: { hasError(e: string): boolean; controls: Record<string, { errors: unknown }> } }).form;
      expect(form.hasError('endBeforeStart')).toBeTrue();
      expect(form.controls['startDate'].errors).toBeNull();
      expect(form.controls['endDate'].errors).toBeNull();
    });

    it('el mismo día, o solo una de las dos fechas, es válido', async () => {
      const { set, errors, send, saved, typeTitle } = await setup();
      await typeTitle('Con fechas');
      await set('#startDate', '2026-03-05');
      await set('#endDate', '2026-03-05');
      await send();
      expect(errors()).toEqual([]);
      expect(saved).toHaveBeenCalledTimes(1);
    });

    it('con el error de fechas no se envía', async () => {
      const { typeTitle, set, send, saved, errors } = await setup();
      await typeTitle('Con fechas');
      await set('#startDate', '2026-03-10');
      await set('#endDate', '2026-03-01');
      await send();
      expect(saved).not.toHaveBeenCalled();
      expect(errors()).toEqual(['La fecha de fin no puede ser anterior a la de inicio.']);
    });

    it('el error desaparece al corregir la fecha', async () => {
      const { set, errors } = await setup();
      await set('#startDate', '2026-03-10');
      await set('#endDate', '2026-03-01', 'input', true);
      expect(errors().length).toBe(1);
      await set('#endDate', '2026-03-12', 'input', true);
      expect(errors()).toEqual([]);
    });
  });

  describe('descripción', () => {
    it('admite hasta 500 caracteres', async () => {
      const { set, errors } = await setup();
      await set('#description', 'x'.repeat(500), 'input', true);
      expect(errors()).toEqual([]);
      await set('#description', 'x'.repeat(501), 'input', true);
      expect(errors()).toEqual(['La descripción admite como máximo 500 caracteres.']);
    });
  });

  describe('etiquetas (FormArray)', () => {
    it('empiezan vacías y se pueden añadir y quitar dinámicamente', async () => {
      const { el, addTag, tagInputs, settle } = await setup();
      expect(el.textContent).toContain('Sin etiquetas');
      await addTag();
      await addTag();
      await addTag();
      expect(tagInputs().length).toBe(3);
      el.querySelectorAll<HTMLButtonElement>('.tag-row button')[1].click();
      await settle();
      expect(tagInputs().length).toBe(2);
    });

    it('al quitar una se conservan los valores de las demás', async () => {
      const { el, addTag, tagInputs, settle } = await setup();
      for (let i = 0; i < 3; i++) await addTag();
      ['uno', 'dos', 'tres'].forEach((v, i) => {
        tagInputs()[i].value = v;
        tagInputs()[i].dispatchEvent(new Event('input'));
      });
      await settle();
      el.querySelectorAll<HTMLButtonElement>('.tag-row button')[1].click();
      await settle();
      expect(tagInputs().map((i) => i.value)).toEqual(['uno', 'tres']);
    });

    it('cada etiqueta es obligatoria (o se quita) y admite 20 caracteres como máximo', async () => {
      const { addTag, tagInputs, errors, settle } = await setup();
      await addTag();
      tagInputs()[0].dispatchEvent(new Event('blur'));
      await settle();
      expect(errors()).toEqual(['Escribe la etiqueta o quítala.']);

      tagInputs()[0].value = 'x'.repeat(21);
      tagInputs()[0].dispatchEvent(new Event('input'));
      await settle();
      expect(errors()).toEqual(['Máximo 20 caracteres.']);

      tagInputs()[0].value = 'x'.repeat(20);
      tagInputs()[0].dispatchEvent(new Event('input'));
      await settle();
      expect(errors()).toEqual([]);
    });

    it('una etiqueta de solo espacios no vale', async () => {
      const { addTag, tagInputs, errors, settle } = await setup();
      await addTag();
      tagInputs()[0].value = '   ';
      tagInputs()[0].dispatchEvent(new Event('input'));
      tagInputs()[0].dispatchEvent(new Event('blur'));
      await settle();
      expect(errors()).toEqual(['Escribe la etiqueta o quítala.']);
    });

    it('una etiqueta vacía impide enviar y se señala al intentarlo', async () => {
      const { typeTitle, addTag, send, saved, errors } = await setup();
      await typeTitle('Con etiqueta vacía');
      await addTag();
      await send();
      expect(saved).not.toHaveBeenCalled();
      expect(errors()).toEqual(['Escribe la etiqueta o quítala.']);
    });

    it('no se pueden añadir más de 20', async () => {
      const { el, addTag, tagInputs } = await setup();
      for (let i = 0; i < 20; i++) await addTag();
      expect(tagInputs().length).toBe(20);
      const boton = Array.from(el.querySelectorAll<HTMLButtonElement>('button[type="button"]')).find((b) => b.textContent?.includes('Añadir etiqueta'))!;
      expect(boton.disabled).toBeTrue();
    });

    it('los controles tienen un nombre accesible que incluye su número', async () => {
      const { el, addTag } = await setup();
      await addTag();
      await addTag();
      expect(Array.from(el.querySelectorAll('.tag-row button')).map((b) => b.getAttribute('aria-label'))).toEqual(['Quitar la etiqueta 1', 'Quitar la etiqueta 2']);
      expect(Array.from(el.querySelectorAll('.tag-row input')).map((b) => b.getAttribute('aria-label'))).toEqual(['Etiqueta 1', 'Etiqueta 2']);
    });
  });

  describe('valor inicial (edición)', () => {
    const FULL: TaskDraft = {
      title: 'Original',
      userId: 2,
      completed: true,
      priority: 'low',
      description: 'Una descripción',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      tags: ['a', 'b'],
    };

    it('rellena todos los campos con una copia del valor', async () => {
      const { q, tagInputs } = await setup({ value: FULL });
      expect(q<HTMLInputElement>('#title').value).toBe('Original');
      expect(q<HTMLInputElement>('#completed').checked).toBeTrue();
      expect(q<HTMLTextAreaElement>('#description').value).toBe('Una descripción');
      expect(q<HTMLInputElement>('#startDate').value).toBe('2026-03-01');
      expect(q<HTMLInputElement>('#endDate').value).toBe('2026-03-05');
      const priority = q<HTMLSelectElement>('#priority');
      expect(priority.options[priority.selectedIndex].textContent?.trim()).toBe('Baja');
      expect(tagInputs().map((i) => i.value)).toEqual(['a', 'b']);
    });

    it('vaciar un opcional emite undefined (así se borra al guardar)', async () => {
      const { set, send, saved } = await setup({ value: FULL });
      await set('#description', '');
      await set('#endDate', '');
      await send();
      const draft = saved.calls.mostRecent().args[0] as TaskDraft;
      expect(draft.description).toBeUndefined();
      expect(draft.endDate).toBeUndefined();
      expect(draft.startDate).toBe('2026-03-01');
      expect(draft.tags).toEqual(['a', 'b']);
    });

    it('trabaja sobre una copia: el objeto del padre no se modifica', async () => {
      const parent: TaskDraft = { ...FULL, tags: ['a', 'b'] };
      const { typeTitle, addTag, set } = await setup({ value: parent });
      await typeTitle('Cambiado');
      await addTag();
      await set('#description', 'Otra');
      expect(parent.title).toBe('Original');
      expect(parent.tags).toEqual(['a', 'b']);
      expect(parent.description).toBe('Una descripción');
    });

    it('cada vez que el padre pasa un valor nuevo, el formulario empieza de cero', async () => {
      const { fixture, q, typeTitle, tagInputs, settle } = await setup({ value: BASE });
      await typeTitle('Editada a mano');
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeTrue();
      fixture.componentRef.setInput('value', FULL);
      await settle();
      expect(q<HTMLInputElement>('#title').value).toBe('Original');
      expect(tagInputs().map((i) => i.value)).toEqual(['a', 'b']);
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeFalse();
    });

    it('sin valor inicial arranca con sus valores por defecto', async () => {
      const { fixture, q, errors } = await setup();
      expect(q<HTMLInputElement>('#title').value).toBe('');
      expect(q<HTMLInputElement>('#completed').checked).toBeFalse();
      const priority = q<HTMLSelectElement>('#priority');
      expect(priority.options[priority.selectedIndex].textContent?.trim()).toBe('Media');
      expect(errors()).toEqual([]);
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeFalse();
    });
  });

  describe('cambios sin guardar', () => {
    it('no hay ninguno al empezar, ni al editar una tarea existente', async () => {
      expect((await setup()).fixture.componentInstance.hasUnsavedChanges()).toBeFalse();
      TestBed.resetTestingModule();
      expect((await setup({ value: BASE })).fixture.componentInstance.hasUnsavedChanges()).toBeFalse();
    });

    it('detecta un cambio en cualquier campo', async () => {
      const casos: [string, (s: Awaited<ReturnType<typeof setup>>) => Promise<void>][] = [
        ['título', (s) => s.typeTitle('Algo')],
        ['completada', async (s) => { s.q<HTMLInputElement>('#completed').click(); await s.settle(); }],
        ['usuario', async (s) => { const u = s.q<HTMLSelectElement>('#userId'); u.selectedIndex = 1; u.dispatchEvent(new Event('change')); await s.settle(); }],
        ['prioridad', async (s) => { const p = s.q<HTMLSelectElement>('#priority'); p.selectedIndex = 0; p.dispatchEvent(new Event('change')); await s.settle(); }],
        ['descripción', (s) => s.set('#description', 'Hola')],
        ['fecha de inicio', (s) => s.set('#startDate', '2026-03-01')],
        ['fecha de fin', (s) => s.set('#endDate', '2026-03-01')],
        ['etiquetas', (s) => s.addTag()],
      ];
      for (const [nombre, accion] of casos) {
        TestBed.resetTestingModule();
        const s = await setup();
        await accion(s);
        expect(s.fixture.componentInstance.hasUnsavedChanges()).withContext(nombre).toBeTrue();
      }
    });

    it('no cuenta un cambio que se deshizo', async () => {
      const { fixture, typeTitle, addTag, el, settle } = await setup({ value: BASE });
      await typeTitle('Otro');
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeTrue();
      await typeTitle('Original');
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeFalse();

      await addTag();
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeTrue();
      el.querySelector<HTMLButtonElement>('.tag-row button')!.click();
      await settle();
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeFalse();
    });

    it('no hay ninguno tras guardar, para que salir después no pregunte', async () => {
      const { fixture, typeTitle, send } = await setup();
      await typeTitle('Comprar pan');
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeTrue();
      await send();
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeFalse();
    });

    it('no cuenta como guardado si el formulario era inválido y no se emitió nada', async () => {
      const { fixture, typeTitle, send } = await setup();
      await typeTitle('ab');
      await send();
      expect(fixture.componentInstance.hasUnsavedChanges()).toBeTrue();
    });

    it('pide confirmar el cierre de la pestaña solo si hay cambios', async () => {
      // Se llama al manejador directamente: disparar un `beforeunload` real en window haría que Karma crea que un test ha recargado la página.
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
