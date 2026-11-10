
[[_TOC_]]

# Lab 07: Pipes

Este laboratorio te enseñará a implementar los diferentes tipos de pipes en Angular.

### 1. Crear pipes

Navegamos a la carpeta src/app y creamos una estructura organizada:

```bash
# Crear pipe
ng generate pipe pipes/number-to-letter
```

### 2. Añadir un componente a un componente nuevo de ruta

```bash
# Crear componentes
ng generate component features/pipes --skip-tests
```

Creando Pipes Personalizadas

### Pipe básica

number-to-letter-pipe.ts

```typescript
    import { Pipe, PipeTransform } from "@angular/core";
  
    @Pipe({
      name: "numberToLetter",
    })
    export class NumberToLetterPipe implements PipeTransform {
      transform(value: number): string | null {
        const numeros = [
          "",
          "UNO",
          "DOS",
          "TRES",
          "CUATRO",
          "CINCO",
          "SEIS",
          "SIETE",
          "OCHO",
          "NUEVE",
          "DIEZ",
        ];
        if (value >= 1 && value <= 10) {
          return numeros[value];
        }
        return null;
      }
    }
```

### Uso de la pipe personalizada

  pipes.ts

```typescript
import { Component } from '@angular/core';
import { NumberToLetterPipe } from '../../pipes/number-to-letter-pipe';

@Component({
  selector: 'app-pipes',
  imports: [NumberToLetterPipe],
  template: `
    <p>Número 5 en español: {{ 5 | numberToLetter }}</p>
    <p>Número 15: {{ 15 | numberToLetter }}</p>
  `,
})
export class Pipes {}
```

### Pipe con parámetros

number-to-letter-pipe.ts

```typescript
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
```

### Uso de la pipe personalizada

  pipes.ts

```typescript
import { Component } from '@angular/core';
import { NumberToLetterPipe } from '../../pipes/number-to-letter-pipe';

@Component({
  selector: 'app-pipes',
  imports: [NumberToLetterPipe],
  template: `
    <p>Número 5 en español: {{ 5 | numberToLetter }}</p>
    <p>Número 5 en inglés: {{ 5 | numberToLetter : 'ENGLISH' }}</p>
    <p>Número 15: {{ 15 | numberToLetter }}</p>
  `,
})
export class Pipes {}
```

### Pipe para filtrado (avanzada) (archivo no creado)

```typescript
    import { Pipe, PipeTransform } from "@angular/core";
  
    interface Producto {
      id: number;
      nombre: string;
      categoria: string;
      precio: number;
    }
  
    @Pipe({
      name: "filtrarProductos",
      pure: false, // Solo si necesitas que se ejecute en cada ciclo
    })
    export class FiltrarProductosPipe implements PipeTransform {
      transform(productos: Producto[], filtro: string): Producto[] {
        if (!productos || !filtro) {
          return productos;
        }
  
        const filtroLower = filtro.toLowerCase();
  
        return productos.filter(
          (producto) =>
            producto.nombre.toLowerCase().includes(filtroLower) ||
            producto.categoria.toLowerCase().includes(filtroLower)
        );
      }
    }
  

    <input [(ngModel)]="filtro" placeholder="Buscar productos..." />
  
    <div *ngFor="let producto of productos | filtrarProductos:filtro">
      <h3>{{ producto.nombre }}</h3>
      <p>{{ producto.categoria }} - {{ producto.precio | currency }}</p>
    </div>
```

### 3. Configurar la nueva navegación

Añadir en app.routes.ts la nueva navegación:

```javascript
  {
    path: 'pipes',
    loadComponent: () =>
      import('./features/pipes/pipes').then((m) => m.Pipes),
    title: 'Pipes',
  },
```

Añadir en header.ts, dentro del template, la navegación a pipes:

```html
    <nav class="navigation">
      <ul>
        <li><a (click)="navigate('home')">Inicio</a></li>
        <li><a (click)="navigate('counter')">Counter</a></li>
        <li><a (click)="navigate('users')">Users</a></li>
        <li><a (click)="navigate('directives')">Directivas</a></li>
        <li><a (click)="navigate('databindings')">Data Bindings</a></li>
        <li><a (click)="navigate('pipes')">Pipes</a></li>
      </ul>
    </nav>
```

## 4. Iniciar la aplicación

```bash
ng serve
```

Navega a `http://localhost:4200/` para ver todos los ejemplos de pipes en acción.
