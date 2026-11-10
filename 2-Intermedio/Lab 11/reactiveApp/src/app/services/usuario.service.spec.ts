import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiUser } from '../interfaces/user';
import { Usuario } from '../models/usuario.model';
import { User } from './user'; // servicio del Lab 10.1 que guarda el estado en memoria
import { UsuarioService } from './usuario.service';

const API = 'https://jsonplaceholder.typicode.com/users';

const apiUsers: ApiUser[] = [
  { id: 1, name: 'Leanne Graham', username: 'Bret', email: 'sincere@april.biz' },
  { id: 2, name: 'Ervin Howell', username: 'Antonette', email: 'shanna@melissa.tv' },
];

describe('UsuarioService', () => {
  let service: UsuarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtenerUsuarios adapta los usuarios al modelo simple (nombre completo y alias)', () => {
    let lista: Usuario[] = [];
    service.obtenerUsuarios().subscribe((l) => (lista = l));
    http.expectOne(API).flush(apiUsers);

    expect(lista.length).toBe(2);
    expect(lista[0]).toEqual({
      id: 1,
      name: 'Leanne Graham',
      username: 'Bret',
      email: 'sincere@april.biz',
      avatar: jasmine.stringMatching('ui-avatars.com'),
    });
  });

  it('obtenerUsuario devuelve un usuario o undefined si la API responde 404', () => {
    const resultados: (Usuario | undefined)[] = [];
    service.obtenerUsuario(1).subscribe((u) => resultados.push(u));
    http.expectOne(`${API}/1`).flush(apiUsers[0]);
    service.obtenerUsuario(999).subscribe((u) => resultados.push(u));
    http.expectOne(`${API}/999`).flush({}, { status: 404, statusText: 'Not Found' });

    expect(resultados[0]?.name).toBe('Leanne Graham');
    expect(resultados[1]).toBeUndefined();
  });

  it('usuarios$ vuelve a emitir cuando cambia el estado (patrón Observer)', () => {
    const emisiones: number[] = [];
    const sub = service.usuarios$.subscribe((l) => emisiones.push(l.length));

    http.expectOne(API).flush(apiUsers);
    TestBed.tick(); // toObservable emite a través de un effect
    expect(emisiones).toEqual([2]);

    // Un borrado en el servicio de origen llega solo a los suscriptores, sin que pregunten.
    TestBed.inject(User).deleteUser(1).subscribe();
    http.expectOne({ method: 'DELETE', url: `${API}/1` }).flush({});
    TestBed.tick();
    expect(emisiones).toEqual([2, 1]);

    sub.unsubscribe();
  });

  it('un usuario creado en local usa la parte local del email como alias', () => {
    const origen = TestBed.inject(User);
    origen.getUsers().subscribe();
    http.expectOne(API).flush(apiUsers);

    origen
      .addUser({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@x.com', phone: '', city: '', company: '', website: '' })
      .subscribe();
    http.expectOne({ method: 'POST', url: API }).flush({ id: 11 });

    let lista: Usuario[] = [];
    service.obtenerUsuarios().subscribe((l) => (lista = l));
    const ada = lista.find((u) => u.name === 'Ada Lovelace');
    expect(ada?.username).toBe('ada');
  });
});
