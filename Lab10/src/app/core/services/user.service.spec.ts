import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { User } from '../models/user.model';
import { UserService } from './user.service';

const API = 'https://jsonplaceholder.typicode.com/users';
const seed: User[] = [
  { id: 1, name: 'Leanne Graham', username: 'Bret', email: 'a@a.com' },
  { id: 2, name: 'Ervin Howell', username: 'Antonette', email: 'b@b.com' },
];

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(UserService);
    http.expectOne(API).flush(seed);
  });

  afterEach(() => http.verify());

  it('lists users and resolves names', () => {
    expect(service.users().length).toBe(2);
    expect(service.nameOf(2)).toBe('Ervin Howell');
    expect(service.nameOf(99)).toBe('Usuario #99');
  });

  it('gets a user by id from memory', () => {
    let result: User | null | undefined;
    service.getUserById(1).subscribe((u) => (result = u));
    expect(result?.name).toBe('Leanne Graham');
    service.getUserById(99).subscribe((u) => (result = u));
    expect(result).toBeNull();
  });

  it('creates a user with a unique local id', () => {
    service.addUser({ name: 'Nuevo', username: 'nuevo', email: 'n@n.com' }).subscribe();
    http.expectOne({ method: 'POST', url: API }).flush({ id: 11 });
    service.addUser({ name: 'Otro', username: 'otro', email: 'o@o.com' }).subscribe();
    http.expectOne({ method: 'POST', url: API }).flush({ id: 11 });

    const ids = service.users().map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(4);
  });

  it('deletes a user in memory even if the API fails', () => {
    service.deleteUser(1).subscribe();
    http.expectOne({ method: 'DELETE', url: `${API}/1` }).error(new ProgressEvent('error'));
    expect(service.users().map((u) => u.id)).toEqual([2]);
  });
});
