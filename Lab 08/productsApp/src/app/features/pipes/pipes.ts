import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NumberToLetterPipe } from '../../pipes/number-to-letter-pipe';
import { FiltrarProductosPipe, Producto } from '../../pipes/filtrar-productos-pipe';

@Component({
  selector: 'app-pipes',
  imports: [CommonModule, FormsModule, NumberToLetterPipe, FiltrarProductosPipe],
  template: `
    <h2>Pipe personalizada con parámetros</h2>
    <p>Número 5 en español: {{ 5 | numberToLetter }}</p>
    <p>Número 5 en inglés: {{ 5 | numberToLetter : 'ENGLISH' }}</p>
    <p>Número 15: {{ 15 | numberToLetter }}</p>

    <h2>Pipe de filtrado</h2>
    <input [(ngModel)]="filtro" placeholder="Buscar productos..." />

    <div *ngFor="let producto of productos | filtrarProductos:filtro">
      <h3>{{ producto.nombre }}</h3>
      <p>{{ producto.categoria }} - {{ producto.precio | currency }}</p>
    </div>
  `,
})
export class Pipes {
  filtro = '';

  productos: Producto[] = [
    { id: 1, nombre: 'Laptop Gaming', categoria: 'electronicos', precio: 1299.99 },
    { id: 2, nombre: 'Camiseta Angular', categoria: 'ropa', precio: 25.99 },
    { id: 3, nombre: 'Lámpara LED', categoria: 'hogar', precio: 89.99 },
    { id: 4, nombre: 'Smartphone', categoria: 'electronicos', precio: 699.99 },
  ];
}
