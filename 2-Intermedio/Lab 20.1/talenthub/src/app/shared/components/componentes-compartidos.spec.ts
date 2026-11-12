import { TestBed } from '@angular/core/testing';
import { Avatar } from './avatar/avatar';
import { BadgeDisponibilidad } from './badge-disponibilidad/badge-disponibilidad';
import { Spinner } from './spinner/spinner';

describe('Spinner', () => {
  it('anuncia el texto como estado (role=status) y tiene uno por defecto', () => {
    const fixture = TestBed.createComponent(Spinner);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role=status]')?.textContent).toContain('Cargando…');
    expect(el.querySelector('.spinner__rueda')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('muestra el texto que se le da', () => {
    const fixture = TestBed.createComponent(Spinner);
    fixture.componentRef.setInput('texto', 'Cargando proyectos…');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando proyectos…');
  });
});

describe('Avatar', () => {
  function crear(nombre: string) {
    const fixture = TestBed.createComponent(Avatar);
    fixture.componentRef.setInput('nombre', nombre);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.avatar')!;
  }

  it('muestra las iniciales de la primera y la última palabra', () => {
    expect(crear('Ervin Howell').textContent).toBe('EH');
    expect(crear('Mrs. Dennis Schulist').textContent).toBe('MS');
  });

  it('con una sola palabra, una inicial; sin nombre, «?»', () => {
    expect(crear('Ana').textContent).toBe('A');
    expect(crear('   ').textContent).toBe('?');
  });

  it('el nombre es su etiqueta accesible', () => {
    const el = crear('Ervin Howell');
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Ervin Howell');
  });

  it('el mismo nombre da siempre el mismo color, y nombres distintos suelen dar otro', () => {
    expect(crear('Ervin Howell').style.backgroundColor).toBe(crear('Ervin Howell').style.backgroundColor);
    expect(crear('Ervin Howell').style.backgroundColor).not.toBe(crear('Clementine Bauch').style.backgroundColor);
  });
});

describe('BadgeDisponibilidad', () => {
  function crear(disponible: boolean) {
    const fixture = TestBed.createComponent(BadgeDisponibilidad);
    fixture.componentRef.setInput('disponible', disponible);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.badge')!;
  }

  it('«Disponible» con la clase verde', () => {
    const badge = crear(true);
    expect(badge.textContent).toBe('Disponible');
    expect(badge.classList).toContain('badge--disponible');
    expect(badge.classList).not.toContain('badge--ocupado');
  });

  it('«Ocupado» con la clase ámbar', () => {
    const badge = crear(false);
    expect(badge.textContent).toBe('Ocupado');
    expect(badge.classList).toContain('badge--ocupado');
  });
});
