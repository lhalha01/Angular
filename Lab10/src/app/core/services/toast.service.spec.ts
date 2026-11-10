import { fakeAsync, tick } from '@angular/core/testing';
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
});
