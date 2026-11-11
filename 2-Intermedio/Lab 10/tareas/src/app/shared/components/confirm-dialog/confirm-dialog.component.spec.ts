import { TestBed } from '@angular/core/testing';
import { ConfirmService } from '@core/services/confirm.service';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  function setup() {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const dialog = el.querySelector('dialog') as HTMLDialogElement;
    const service = TestBed.inject(ConfirmService);
    return { fixture, el, dialog, service };
  }

  it('opens as a modal with the given text and resolves true when accepted', async () => {
    const { fixture, el, dialog, service } = setup();
    expect(dialog.open).toBeFalse();

    const result = service.ask({ title: 'Borrar', message: '¿Seguro?', confirmLabel: 'Sí, borrar', danger: true });
    fixture.detectChanges();

    expect(dialog.open).toBeTrue();
    expect(el.querySelector('h2')?.textContent).toContain('Borrar');
    const buttons = el.querySelectorAll<HTMLButtonElement>('button');
    expect(buttons[1].textContent).toContain('Sí, borrar');

    buttons[1].click();
    fixture.detectChanges();
    expect(await result).toBeTrue();
    expect(dialog.open).toBeFalse();
  });

  it('resolves false when cancelled with the button', async () => {
    const { fixture, el, service } = setup();
    const result = service.ask({ title: 't', message: 'm' });
    fixture.detectChanges();
    el.querySelectorAll<HTMLButtonElement>('button')[0].click();
    expect(await result).toBeFalse();
  });

  it('resolves false when Escape is pressed', async () => {
    const { fixture, dialog, service } = setup();
    const result = service.ask({ title: 't', message: 'm' });
    fixture.detectChanges();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(await result).toBeFalse();
  });

  it('resolves false when the backdrop is clicked', async () => {
    const { fixture, dialog, service } = setup();
    const result = service.ask({ title: 't', message: 'm' });
    fixture.detectChanges();
    dialog.click(); // el objetivo es el propio <dialog>, no su contenido
    expect(await result).toBeFalse();
  });
});
