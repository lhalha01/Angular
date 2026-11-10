import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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
