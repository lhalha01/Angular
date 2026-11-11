import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiUser } from '../../interfaces/user';
import { UserList } from './user-list';

const API = 'https://jsonplaceholder.typicode.com/users';

// 7 usuarios: con 5 por página hay 2 páginas (5 + 2).
const apiUsers: ApiUser[] = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  name: `Nombre${i + 1} Apellido${i + 1}`,
  email: `user${i + 1}@example.com`,
}));

describe('UserList', () => {
  let fixture: ComponentFixture<UserList>;
  let http: HttpTestingController;

  const rows = () => Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.user-row'));
  const click = (selector: string, index = 0) => {
    (fixture.nativeElement.querySelectorAll(selector)[index] as HTMLElement).click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UserList);
    fixture.detectChanges();
    http.expectOne(API).flush(apiUsers);
    fixture.detectChanges();
  });

  it('muestra la primera página con 5 usuarios', () => {
    expect(rows().length).toBe(5);
    expect(fixture.nativeElement.textContent).toContain('Sr. Apellido1, Nombre1');
  });

  it('pagina: la página 2 muestra los 2 usuarios restantes', () => {
    click('.page-btn', 1);
    expect(rows().length).toBe(2);
  });

  it('resalta únicamente las filas con id par', () => {
    const highlighted = rows().map((r) => r.style.backgroundColor !== '');
    expect(highlighted).toEqual([false, true, false, true, false]);
  });

  it('filtra por nombre o email y vuelve a la primera página', () => {
    click('.page-btn', 1);
    const input = fixture.nativeElement.querySelector('.search') as HTMLInputElement;
    input.value = 'user3@';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Apellido3');
  });

  it('muestra un mensaje si el filtro no encuentra usuarios', () => {
    const input = fixture.nativeElement.querySelector('.search') as HTMLInputElement;
    input.value = 'zzz';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay usuarios que mostrar');
  });

  it('elimina un usuario tras confirmar y actualiza la lista', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    click('.btn-danger', 0);
    http.expectOne({ method: 'DELETE', url: `${API}/1` }).flush({});
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Apellido1,');
    // Al quedar 6 usuarios, la primera página sigue mostrando 5.
    expect(rows().length).toBe(5);
  });

  it('con la API pública no consulta tareas: la confirmación es la sencilla', () => {
    const confirm = spyOn(window, 'confirm').and.returnValue(false);
    click('.btn-danger', 0);
    http.expectNone((r) => r.url.includes('/todos'));
    expect(confirm).toHaveBeenCalledOnceWith('¿Eliminar a Nombre1 Apellido1?');
  });

  it('no elimina nada si se cancela la confirmación', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    click('.btn-danger', 0);
    http.expectNone(`${API}/1`);
    expect(rows().length).toBe(5);
  });
});
