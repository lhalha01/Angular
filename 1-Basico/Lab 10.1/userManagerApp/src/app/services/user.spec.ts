import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ApiUser, UserFormData } from '../interfaces/user';
import { User } from './user';

const API = 'https://jsonplaceholder.typicode.com/users';

const apiUsers: ApiUser[] = [
  { id: 1, name: 'Leanne Graham', email: 'a@x.com', phone: '1-770-736-8031 x56442', address: { city: 'Gwenborough' }, company: { name: 'Romaguera' } },
  { id: 2, name: 'Mrs. Dennis Schulist', email: 'b@x.com' },
];

const formData: UserFormData = {
  firstName: 'Ada', lastName: 'Lovelace', email: 'ada@x.com', phone: '', city: 'Londres', company: '', website: '',
};

describe('User service', () => {
  let service: User;
  let http: HttpTestingController;

  /** Atiende la carga inicial (GET /users) para dejar la memoria cargada. */
  function loadUsers(): void {
    service.getUsers().subscribe();
    http.expectOne(API).flush(apiUsers);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(User);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('normaliza los usuarios de la API (nombre, apellidos y avatar)', () => {
    loadUsers();
    const [first, second] = service.users();
    expect(first.firstName).toBe('Leanne');
    expect(first.lastName).toBe('Graham');
    expect(first.avatar).toContain('ui-avatars.com');
    // Se elimina el tratamiento "Mrs." del nombre.
    expect(second.firstName).toBe('Dennis');
    expect(second.lastName).toBe('Schulist');
  });

  it('solo llama a la API una vez: después sirve desde memoria', () => {
    loadUsers();
    let result: unknown;
    service.getUsers().subscribe((list) => (result = list));
    expect(http.match(API).length).toBe(0);
    expect(result).toEqual(service.users());
  });

  it('getUser pide /users/:id si la lista aún no está cargada', () => {
    let result;
    service.getUser(1).subscribe((u) => (result = u));
    http.expectOne(`${API}/1`).flush(apiUsers[0]);
    expect(result).toBeDefined();
  });

  it('getUser devuelve undefined si la API responde 404', () => {
    let result: unknown = 'pendiente';
    service.getUser(999).subscribe((u) => (result = u));
    http.expectOne(`${API}/999`).flush({}, { status: 404, statusText: 'Not Found' });
    expect(result).toBeUndefined();
  });

  it('addUser asigna un id local nuevo y lo añade a la memoria', () => {
    loadUsers();
    let created;
    service.addUser(formData).subscribe((u) => (created = u));
    http.expectOne({ method: 'POST', url: API }).flush({ id: 11 });
    expect(created).toBeDefined();
    expect(service.users().length).toBe(3);
    expect(service.users()[2].id).toBe(3);
    expect(service.users()[2].isLocal).toBeTrue();
  });

  it('updateUser hace PUT para usuarios de la API y actualiza la memoria', () => {
    loadUsers();
    service.updateUser(1, { ...formData, firstName: 'Nuevo' }).subscribe();
    http.expectOne({ method: 'PUT', url: `${API}/1` }).flush({});
    expect(service.users()[0].firstName).toBe('Nuevo');
  });

  it('deleteUser hace DELETE y quita al usuario de la memoria', () => {
    loadUsers();
    service.deleteUser(1).subscribe();
    http.expectOne({ method: 'DELETE', url: `${API}/1` }).flush({});
    expect(service.users().map((u) => u.id)).toEqual([2]);
  });

  it('no llama a la API para editar o borrar usuarios creados en local', () => {
    loadUsers();
    service.addUser(formData).subscribe();
    http.expectOne({ method: 'POST', url: API }).flush({ id: 11 });
    const localId = service.users()[2].id;

    service.updateUser(localId, { ...formData, firstName: 'Grace' }).subscribe();
    expect(service.users()[2].firstName).toBe('Grace');

    service.deleteUser(localId).subscribe();
    expect(service.users().length).toBe(2);
    http.expectNone(`${API}/${localId}`);
  });

  it('deleteUser falla si el usuario no existe', () => {
    loadUsers();
    let failed = false;
    service.deleteUser(999).subscribe({ error: () => (failed = true) });
    expect(failed).toBeTrue();
  });
});

describe('User service con el backend propio (persistentApi)', () => {
  const LOCAL = 'http://localhost:8000/users';
  const original = { ...environment };
  let service: User;
  let http: HttpTestingController;

  /** Atiende la carga inicial (GET) para dejar la memoria cargada. */
  function loadUsers(): void {
    service.getUsers().subscribe();
    http.expectOne(LOCAL).flush(apiUsers);
  }

  beforeEach(() => {
    environment.apiUrl = 'http://localhost:8000';
    environment.persistentApi = true;
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(User);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    Object.assign(environment, original); // no contaminar al resto de tests
  });

  it('carga los usuarios desde la URL del backend', () => {
    loadUsers();
    expect(service.users().length).toBe(2);
  });

  it('getUser pide /users/:id al backend si la lista aún no está cargada', () => {
    let result;
    service.getUser(2).subscribe((u) => (result = u));
    http.expectOne(`${LOCAL}/2`).flush(apiUsers[1]);
    expect(result).toBeDefined();
  });

  it('addUser usa el id que asigna el servidor, no uno calculado en el cliente', () => {
    loadUsers(); // en el cliente el siguiente id sería 3
    let created;
    service.addUser(formData).subscribe((u) => (created = u));
    http.expectOne({ method: 'POST', url: LOCAL }).flush({ id: 11, name: 'Ada Lovelace', email: 'ada@x.com' });

    expect(created).toBeDefined();
    const user = service.users()[2];
    expect(user.id).toBe(11);
    expect(user.firstName).toBe('Ada');
    expect(user.isLocal).toBeFalse(); // el backend sí lo conoce
  });

  it('updateUser usa PATCH (no PUT) para no borrar los campos que el formulario no incluye', () => {
    loadUsers();
    service.updateUser(1, { ...formData, firstName: 'Nuevo' }).subscribe();
    const req = http.expectOne({ method: 'PATCH', url: `${LOCAL}/1` });
    expect(req.request.body.name).toBe('Nuevo Lovelace');
    req.flush({});
    expect(service.users()[0].firstName).toBe('Nuevo');
  });

  it('un usuario creado también se edita y se borra contra la API', () => {
    loadUsers();
    service.addUser(formData).subscribe();
    http.expectOne({ method: 'POST', url: LOCAL }).flush({ id: 11, name: 'Ada Lovelace', email: 'ada@x.com' });

    service.updateUser(11, { ...formData, firstName: 'Grace' }).subscribe();
    http.expectOne({ method: 'PATCH', url: `${LOCAL}/11` }).flush({});
    service.deleteUser(11).subscribe();
    http.expectOne({ method: 'DELETE', url: `${LOCAL}/11` }).flush(null, { status: 204, statusText: 'No Content' });

    expect(service.users().map((u) => u.id)).toEqual([1, 2]);
  });

  it('deleteUser hace DELETE y quita al usuario de la memoria', () => {
    loadUsers();
    service.deleteUser(1).subscribe();
    http.expectOne({ method: 'DELETE', url: `${LOCAL}/1` }).flush(null, { status: 204, statusText: 'No Content' });
    expect(service.users().map((u) => u.id)).toEqual([2]);
  });

  it('un error de la API llega al llamante y no cambia la memoria', () => {
    loadUsers();
    const errors: string[] = [];

    service.addUser(formData).subscribe({ error: () => errors.push('add') });
    http.expectOne({ method: 'POST', url: LOCAL }).flush({}, { status: 422, statusText: 'Unprocessable' });

    service.updateUser(1, { ...formData, firstName: 'X' }).subscribe({ error: () => errors.push('update') });
    http.expectOne({ method: 'PATCH', url: `${LOCAL}/1` }).flush({}, { status: 500, statusText: 'Error' });

    service.deleteUser(1).subscribe({ error: () => errors.push('delete') });
    http.expectOne({ method: 'DELETE', url: `${LOCAL}/1` }).flush({}, { status: 404, statusText: 'Not Found' });

    expect(errors).toEqual(['add', 'update', 'delete']);
    expect(service.users().length).toBe(2);
    expect(service.users()[0].firstName).toBe('Leanne');
  });

  describe('countTasks (tareas que se borrarían en cascada)', () => {
    const count = (userId: number) => {
      const result: { value?: number; error?: unknown } = {};
      service.countTasks(userId).subscribe({ next: (v) => (result.value = v), error: (e) => (result.error = e) });
      return result;
    };
    const countRequest = (userId: number) =>
      http.expectOne(
        (r) =>
          r.method === 'GET' &&
          r.url === 'http://localhost:8000/todos' &&
          r.params.get('userId') === String(userId) &&
          r.params.get('_limit') === '1',
      );

    it('pregunta al backend por las tareas del usuario y lee el total de X-Total-Count', () => {
      const result = count(2);
      countRequest(2).flush([], { headers: { 'X-Total-Count': '20' } });
      expect(result.value).toBe(20);
    });

    it('acepta 0 como total válido', () => {
      const result = count(2);
      countRequest(2).flush([], { headers: { 'X-Total-Count': '0' } });
      expect(result.value).toBe(0);
    });

    it('falla si el servidor no envía la cabecera, en lugar de dar un 0 falso', () => {
      const result = count(2);
      countRequest(2).flush([]);
      expect(result.error).toBeDefined();
      expect(result.value).toBeUndefined();
    });

    it('falla si la cabecera no es un número válido', () => {
      for (const bad of ['abc', '-3', '1.5', '']) {
        const result = count(2);
        countRequest(2).flush([], { headers: { 'X-Total-Count': bad } });
        expect(result.error).withContext(`cabecera "${bad}"`).toBeDefined();
      }
    });

    it('propaga los errores de la API', () => {
      const result = count(2);
      countRequest(2).flush({}, { status: 500, statusText: 'Error' });
      expect(result.error).toBeDefined();
    });
  });
});

describe('User.countTasks con la API pública', () => {
  it('devuelve 0 sin hacer ninguna petición (JSONPlaceholder no tiene cascada)', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    let total: number | undefined;
    TestBed.inject(User).countTasks(1).subscribe((n) => (total = n));
    expect(total).toBe(0);
    http.verify(); // ninguna petición pendiente
  });
});
