import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ApiUser, UserInterface } from '../interfaces/user';
import { Notifier } from './notification';
import { User } from './user';
import { UserActions, confirmMessage, deletedMessage } from './user-actions';

const PUBLIC_USERS = 'https://jsonplaceholder.typicode.com/users';
const LOCAL = 'http://localhost:8000';

const apiUsers: ApiUser[] = [
  { id: 1, name: 'Leanne Graham', email: 'a@x.com' },
  { id: 2, name: 'Ervin Howell', email: 'b@x.com' },
];

describe('textos del borrado de usuarios', () => {
  it('sin tareas: confirmación sencilla', () => {
    expect(confirmMessage('Ana Pérez', 0)).toBe('¿Eliminar a Ana Pérez?');
    expect(deletedMessage('Ana Pérez', 0)).toBe('Usuario Ana Pérez eliminado');
  });

  it('con una tarea: avisa en singular', () => {
    const text = confirmMessage('Ana Pérez', 1);
    expect(text).toContain('Ana Pérez tiene 1 tarea asignada.');
    expect(text).toContain('también se eliminará su tarea'); // singular: "se eliminará", no "se eliminarán"
    expect(text).not.toContain('se eliminarán');
    expect(text).toContain('no se puede deshacer');
    expect(deletedMessage('Ana Pérez', 1)).toBe('Usuario Ana Pérez eliminado junto con su tarea');
  });

  it('con varias tareas: dice cuántas se perderán', () => {
    const text = confirmMessage('Ana Pérez', 20);
    expect(text).toContain('Ana Pérez tiene 20 tareas asignadas.');
    expect(text).toContain('también se eliminarán sus 20 tareas');
    expect(text).toContain('¿Eliminar al usuario y sus tareas?');
    expect(deletedMessage('Ana Pérez', 20)).toBe('Usuario Ana Pérez eliminado junto con sus 20 tareas');
  });
});

describe('UserActions.remove', () => {
  const original = { ...environment };
  let http: HttpTestingController;
  let users: User;
  let actions: UserActions;
  let notifier: Notifier;
  let confirmSpy: jasmine.Spy<(message?: string) => boolean>;
  let user: UserInterface;

  /** Prepara el servicio con los usuarios ya cargados y devuelve el usuario 1. */
  function setup(persistent: boolean, accept = true) {
    if (persistent) {
      environment.apiUrl = LOCAL;
      environment.persistentApi = true;
    }
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    users = TestBed.inject(User);
    actions = TestBed.inject(UserActions);
    notifier = TestBed.inject(Notifier);
    confirmSpy = spyOn(window, 'confirm').and.returnValue(accept);
    users.getUsers().subscribe();
    http.expectOne(persistent ? `${LOCAL}/users` : PUBLIC_USERS).flush(apiUsers);
    user = users.users()[0];
  }

  /** Atiende la consulta de cuántas tareas tiene el usuario y devuelve su petición. */
  const answerCount = (total: string | null) => {
    const req = http.expectOne(
      (r) =>
        r.url === `${LOCAL}/todos` && r.params.get('userId') === '1' && r.params.get('_limit') === '1',
    );
    req.flush([], total === null ? {} : { headers: { 'X-Total-Count': total } });
  };
  const texts = () => notifier.items().map((n) => n.text);
  const run = () => {
    let result: boolean | undefined;
    actions.remove(user).subscribe((r) => (result = r));
    return () => result;
  };

  afterEach(() => {
    http.verify();
    Object.assign(environment, original); // no contaminar al resto de tests
  });

  describe('con la API pública (sin cascada)', () => {
    it('no pregunta por las tareas y confirma con el texto sencillo', () => {
      setup(false);
      const result = run();
      http.expectNone((r) => r.url.includes('/todos')); // ninguna petición de tareas
      expect(confirmSpy).toHaveBeenCalledOnceWith('¿Eliminar a Leanne Graham?');
      http.expectOne({ method: 'DELETE', url: `${PUBLIC_USERS}/1` }).flush({});
      expect(result()).toBeTrue();
      expect(texts()).toEqual(['Usuario Leanne Graham eliminado']);
    });

    it('no borra nada si se cancela', () => {
      setup(false, false);
      const result = run();
      http.expectNone({ method: 'DELETE' });
      expect(result()).toBeFalse();
      expect(texts()).toEqual([]);
      expect(users.users().length).toBe(2);
    });
  });

  describe('con el backend propio (borrado en cascada)', () => {
    it('avisa de cuántas tareas se borrarán antes de preguntar', () => {
      setup(true);
      run();
      answerCount('20');
      expect(confirmSpy).toHaveBeenCalledTimes(1);
      const message = confirmSpy.calls.mostRecent().args[0]!;
      expect(message).toContain('Leanne Graham tiene 20 tareas asignadas.');
      expect(message).toContain('también se eliminarán sus 20 tareas');
      http.expectOne({ method: 'DELETE', url: `${LOCAL}/users/1` }).flush(null, { status: 204, statusText: 'No Content' });
    });

    it('si acepta, borra al usuario e informa de que también se borraron sus tareas', () => {
      setup(true);
      const result = run();
      answerCount('20');
      http.expectOne({ method: 'DELETE', url: `${LOCAL}/users/1` }).flush(null, { status: 204, statusText: 'No Content' });
      expect(result()).toBeTrue();
      expect(texts()).toEqual(['Usuario Leanne Graham eliminado junto con sus 20 tareas']);
      expect(users.users().map((u) => u.id)).toEqual([2]);
    });

    it('si cancela, no se borra el usuario ni sus tareas', () => {
      setup(true, false);
      const result = run();
      answerCount('20');
      http.expectNone({ method: 'DELETE' });
      expect(result()).toBeFalse();
      expect(texts()).toEqual([]);
      expect(users.users().length).toBe(2);
    });

    it('usa el singular con una sola tarea', () => {
      setup(true);
      run();
      answerCount('1');
      expect(confirmSpy.calls.mostRecent().args[0]).toContain('tiene 1 tarea asignada');
      http.expectOne({ method: 'DELETE', url: `${LOCAL}/users/1` }).flush(null, { status: 204, statusText: 'No Content' });
      expect(texts()).toEqual(['Usuario Leanne Graham eliminado junto con su tarea']);
    });

    it('un usuario sin tareas se confirma con el texto sencillo', () => {
      setup(true);
      run();
      answerCount('0');
      expect(confirmSpy).toHaveBeenCalledOnceWith('¿Eliminar a Leanne Graham?');
      http.expectOne({ method: 'DELETE', url: `${LOCAL}/users/1` }).flush(null, { status: 204, statusText: 'No Content' });
      expect(texts()).toEqual(['Usuario Leanne Graham eliminado']);
    });

    it('si no se puede comprobar las tareas, no pregunta ni borra nada y lo explica', () => {
      setup(true);
      const result = run();
      http
        .expectOne((r) => r.url === `${LOCAL}/todos`)
        .flush({}, { status: 500, statusText: 'Error' });
      expect(confirmSpy).not.toHaveBeenCalled();
      http.expectNone({ method: 'DELETE' });
      expect(result()).toBeFalse();
      expect(texts()).toEqual(['No se pudo comprobar si el usuario tiene tareas, así que no se ha eliminado.']);
      expect(notifier.items()[0].type).toBe('error');
      expect(users.users().length).toBe(2);
    });

    it('si el servidor no informa del total, lo trata como un fallo (no avisa de un "0" falso)', () => {
      setup(true);
      const result = run();
      answerCount(null); // respuesta sin la cabecera X-Total-Count
      expect(confirmSpy).not.toHaveBeenCalled();
      http.expectNone({ method: 'DELETE' });
      expect(result()).toBeFalse();
      expect(notifier.items()[0].type).toBe('error');
    });

    it('si el borrado falla, lo avisa y no da el usuario por eliminado', () => {
      setup(true);
      const result = run();
      answerCount('3');
      http.expectOne({ method: 'DELETE', url: `${LOCAL}/users/1` }).flush({}, { status: 500, statusText: 'Error' });
      expect(result()).toBeFalse();
      expect(texts()).toEqual(['No se pudo eliminar el usuario']);
      expect(users.users().length).toBe(2); // sigue en memoria
    });
  });
});
