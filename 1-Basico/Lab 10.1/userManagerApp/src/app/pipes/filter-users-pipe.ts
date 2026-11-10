import { Pipe, PipeTransform } from '@angular/core';
import { UserInterface } from '../interfaces/user';

/** Filtra usuarios por nombre o email (sin distinguir mayúsculas ni tildes). */
@Pipe({ name: 'filterUsers' })
export class FilterUsersPipe implements PipeTransform {
  transform(users: UserInterface[], term: string): UserInterface[] {
    const needle = normalize(term);
    if (!needle) {
      return users;
    }
    return users.filter((u) =>
      normalize(`${u.firstName} ${u.lastName} ${u.email}`).includes(needle),
    );
  }
}

function normalize(text: string): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}
