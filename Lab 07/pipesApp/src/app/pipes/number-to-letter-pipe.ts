import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberToLetter',
})
export class NumberToLetterPipe implements PipeTransform {
  transform(value: number, language: string = 'ESPAÑOL'): string | null {
    if (language === 'ESPAÑOL') {
      return this.getValueSpanish(value);
    } else if (language === 'ENGLISH') {
      return this.getValueEnglish(value);
    }
    return null;
  }

  private getValueSpanish(value: number): string | null {
    const numbers = {
      1: 'UNO',
      2: 'DOS',
      3: 'TRES',
      4: 'CUATRO',
      5: 'CINCO',
      6: 'SEIS',
      7: 'SIETE',
      8: 'OCHO',
      9: 'NUEVE',
      10: 'DIEZ',
    };
    return numbers[value as keyof typeof numbers] || null;
  }

  private getValueEnglish(value: number): string | null {
    const numbers = {
      1: 'ONE',
      2: 'TWO',
      3: 'THREE',
      4: 'FOUR',
      5: 'FIVE',
      6: 'SIX',
      7: 'SEVEN',
      8: 'EIGHT',
      9: 'NINE',
      10: 'TEN',
    };
    return numbers[value as keyof typeof numbers] || null;
  }
}
