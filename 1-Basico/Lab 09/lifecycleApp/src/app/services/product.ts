import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ProductCategory, ProductInterface } from '../interfaces/product';

@Injectable({
  providedIn: 'root',
})
export class Product {
  private products = signal<ProductInterface[]>([]);
  private mockProducts: ProductInterface[] = [
    {
      id: '1',
      name: 'Laptop Gaming',
      description: 'Laptop de alto rendimiento para gaming',
      price: 1299.99,
      category: ProductCategory.ELECTRONICS,
      inStock: true,
      imageUrl: 'https://via.placeholder.com/300x200/007bff/ffffff?text=Laptop',
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Camiseta Angular',
      description: 'Camiseta oficial de Angular',
      price: 29.99,
      category: ProductCategory.CLOTHING,
      inStock: true,
      imageUrl:
        'https://via.placeholder.com/300x200/28a745/ffffff?text=Camiseta',
      createdAt: new Date(),
    },
    {
      id: '3',
      name: 'Angular: La Guía Completa',
      description: 'Libro sobre desarrollo con Angular',
      price: 45.99,
      category: ProductCategory.BOOKS,
      inStock: false,
      imageUrl: 'https://via.placeholder.com/300x200/dc3545/ffffff?text=Libro',
      createdAt: new Date(),
    },
  ];

  constructor() {
    this.products.set(this.mockProducts);
  }

  getAllProducts(): Observable<ProductInterface[]> {
    return of(this.products()).pipe(delay(500));
  }

  getProductById(id: string): Observable<ProductInterface | null> {
    const product = this.products().find((p) => p.id === id) || null;
    return of(product).pipe(delay(300));
  }

  getProductsByCategory(
    category: ProductCategory
  ): Observable<ProductInterface[]> {
    const filtered = this.products().filter((p) => p.category === category);
    return of(filtered).pipe(delay(400));
  }
}
