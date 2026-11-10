import { Pipe, PipeTransform } from '@angular/core';

/** Formatea el nombre completo como "Sr. Apellido, Nombre". */
@Pipe({ name: 'fullName' })
export class FullNamePipe implements PipeTransform {
  transform(user: { firstName: string; lastName: string } | null | undefined): string {
    if (!user) {
      return '';
    }
    return `Sr. ${user.lastName}, ${user.firstName}`;
  }
}
