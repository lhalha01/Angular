import { TestBed } from '@angular/core/testing';
import { ToastService } from '../../core/services/toast.service';
import { ToastContainerComponent } from './toast-container.component';

describe('ToastContainerComponent', () => {
  function setup() {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    fixture.detectChanges();
    const service = TestBed.inject(ToastService);
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, service };
  }

  it('is a polite live region, so screen readers announce the messages', () => {
    const region = setup().el.querySelector('.toasts')!;
    expect(region.getAttribute('role')).toBe('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
  });

  it('shows the active toasts and nothing when there are none', () => {
    const { fixture, el, service } = setup();
    expect(el.querySelectorAll('.toast').length).toBe(0);

    service.show('Primero', { duration: 60_000 });
    service.show('Segundo', { duration: 60_000 });
    fixture.detectChanges();
    expect(Array.from(el.querySelectorAll('.toast span')).map((s) => s.textContent)).toEqual(['Primero', 'Segundo']);
    service.toasts().forEach((t) => service.dismiss(t.id)); // limpia los temporizadores
  });

  it('closes a toast with its close button', () => {
    const { fixture, el, service } = setup();
    service.show('Hola', { duration: 60_000 });
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.toast__close')!.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.toast').length).toBe(0);
  });

  it('shows the action button only when the toast has an action, and runs it', () => {
    const { fixture, el, service } = setup();
    service.show('Sin acción', { duration: 60_000 });
    fixture.detectChanges();
    expect(el.querySelector('.toast__action')).toBeNull();
    service.dismiss(service.toasts()[0].id);

    const action = jasmine.createSpy('action');
    service.show('Borrada', { actionLabel: 'Deshacer', action, duration: 60_000 });
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.toast__action')!.click();
    fixture.detectChanges();

    expect(action).toHaveBeenCalledTimes(1);
    expect(el.querySelectorAll('.toast').length).toBe(0);
  });
});
