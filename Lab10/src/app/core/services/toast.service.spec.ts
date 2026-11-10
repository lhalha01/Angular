import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('shows a toast and hides it automatically', fakeAsync(() => {
    const service = new ToastService();
    service.show('hola', { duration: 1000 });
    expect(service.toasts().map((t) => t.message)).toEqual(['hola']);
    tick(1000);
    expect(service.toasts()).toEqual([]);
  }));

  it('runs the action and closes the toast', fakeAsync(() => {
    const service = new ToastService();
    const action = jasmine.createSpy('action');
    service.show('borrada', { actionLabel: 'Deshacer', action });
    service.runAction(service.toasts()[0]);
    expect(action).toHaveBeenCalledTimes(1);
    expect(service.toasts()).toEqual([]);
    tick(5000); // el temporizador pendiente se cancela sin errores
  }));

  it('cancels the pending timers when the service is destroyed (ngOnDestroy)', fakeAsync(() => {
    const service = new ToastService();
    service.show('uno', { duration: 1000 });
    service.show('dos', { duration: 2000 });

    service.ngOnDestroy();
    tick(5000);

    // Si los temporizadores siguieran vivos, los avisos se habrían cerrado solos.
    expect(service.toasts().length).toBe(2);
  }));

  it('is destroyed with the injector, which also stops its timers', fakeAsync(() => {
    const service = TestBed.inject(ToastService);
    service.show('hola', { duration: 1000 });
    TestBed.resetTestingModule(); // destruye el inyector -> llama a ngOnDestroy
    tick(2000);
    expect(service.toasts().length).toBe(1);
  }));
});
