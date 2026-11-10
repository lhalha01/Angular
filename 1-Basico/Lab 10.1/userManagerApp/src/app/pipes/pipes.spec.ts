import { UserInterface } from '../interfaces/user';
import { FilterUsersPipe } from './filter-users-pipe';
import { FullNamePipe } from './full-name-pipe';

function user(id: number, firstName: string, lastName: string, email: string): UserInterface {
  return {
    id, firstName, lastName, email,
    phone: '', website: '', city: '', company: '', avatar: '',
    createdAt: new Date(), isLocal: false,
  };
}

describe('FullNamePipe', () => {
  const pipe = new FullNamePipe();

  it('formatea como "Sr. Apellido, Nombre"', () => {
    expect(pipe.transform({ firstName: 'Leanne', lastName: 'Graham' })).toBe('Sr. Graham, Leanne');
  });

  it('devuelve cadena vacía si no hay usuario', () => {
    expect(pipe.transform(null)).toBe('');
  });
});

describe('FilterUsersPipe', () => {
  const pipe = new FilterUsersPipe();
  const users = [
    user(1, 'Leanne', 'Graham', 'sincere@april.biz'),
    user(2, 'Ervin', 'Howell', 'shanna@melissa.tv'),
    user(3, 'José', 'Pérez', 'jose@example.com'),
  ];

  it('devuelve todos si el filtro está vacío', () => {
    expect(pipe.transform(users, '  ')).toEqual(users);
  });

  it('filtra por nombre sin distinguir mayúsculas', () => {
    expect(pipe.transform(users, 'GRAHAM').map((u) => u.id)).toEqual([1]);
  });

  it('filtra por email', () => {
    expect(pipe.transform(users, 'melissa').map((u) => u.id)).toEqual([2]);
  });

  it('ignora las tildes', () => {
    expect(pipe.transform(users, 'jose perez').map((u) => u.id)).toEqual([3]);
  });
});
