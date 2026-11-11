import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FormularioAlta } from './formulario-alta.component';

describe('FormularioAlta', () => {
  function crear() {
    TestBed.configureTestingModule({ imports: [FormularioAlta], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(FormularioAlta);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const escribir = (name: string, valor: string) => {
      const input = el.querySelector<HTMLInputElement>(`input[name=${name}]`)!;
      input.value = valor;
      input.dispatchEvent(new Event('input'));
    };
    return { fixture, escribir };
  }

  it('al empezar no hay cambios pendientes', () => {
    expect(crear().fixture.componentInstance.tieneCambiosPendientes()).toBeFalse();
  });

  it('escribir en el nombre o en el email genera cambios pendientes', () => {
    const a = crear();
    a.escribir('nombre', 'Marta');
    expect(a.fixture.componentInstance.tieneCambiosPendientes()).toBeTrue();

    TestBed.resetTestingModule();
    const b = crear();
    b.escribir('email', 'm@example.com');
    expect(b.fixture.componentInstance.tieneCambiosPendientes()).toBeTrue();
  });

  it('vaciar los campos o dejar solo espacios deja de contar como cambio', () => {
    const { fixture, escribir } = crear();
    escribir('nombre', 'Marta');
    escribir('nombre', '   ');
    expect(fixture.componentInstance.tieneCambiosPendientes()).toBeFalse();
  });
});
