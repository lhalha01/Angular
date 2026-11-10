
[[_TOC_]]

## Lab 08: s

Aprender a implementar un sistema de navegación completo usando el Router de Angular 17+ con enfoque en standalone components, lazy loading, guards, resolvers y las mejores prácticas modernas.

### 1. Crear Servicio

```bash
# Crear Servicio
ng generate service services/product --skip-tests
```

### 2. Añadir un componente a un componente nuevo de ruta

```bash
# Crear componentes
ng generate component features/product-list --skip-tests
```

### 3. Modelos

```bash
# Crear componentes
ng generate interface interfaces/product
```

```typescript
export interface ProductInterface {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  inStock: boolean;
  imageUrl: string;
  createdAt: Date;
}

export enum ProductCategory {
  ELECTRONICS = "electronics",
  CLOTHING = "clothing",
  BOOKS = "books",
  HOME = "home",
  SPORTS = "sports",
}
```

#### 3.1 Servicio de Productos

**services/product.ts**:

```typescript
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
```

### 4 Componente de Lista de Productos

**features/product-list/product-list.ts**:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductInterface, ProductCategory } from '../../interfaces/product';
import { Product } from '../../services/product';
  
@Component({
  selector: 'app-product-list',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="product-list-container">
      <div class="page-header">
        <h1>{{ getPageTitle() }}</h1>
        <div class="category-filters">
          <button
            (click)="navigateToCategory('all')"
            class="filter-btn"
            [class.active]="!currentCategory()"
          >
            Todas
          </button>
          <button
            *ngFor="let category of categories"
            (click)="navigateToCategory(category)"
            class="filter-btn"
            [class.active]="currentCategory() === category"
          >
            {{ getCategoryLabel(category) }}
          </button>
        </div>
      </div>
      <div *ngIf="loading()" class="loading">
        <div class="spinner"></div>
        <p>Cargando productos...</p>
      </div>
      <div *ngIf="!loading() && products().length > 0" class="product-grid">
        <div
          *ngFor="let product of products(); trackBy: trackByProductId"
          class="product-card"
        >
          <div class="product-image">
            <img [src]="product.imageUrl" [alt]="product.name" />
            <div *ngIf="!product.inStock" class="out-of-stock-badge">
              Agotado
            </div>
          </div>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-description">{{ product.description }}</p>
            <div class="product-price">
              {{ product.price | currency : 'EUR' : 'symbol' : '1.2-2' }}
            </div>
            <div class="product-actions">
              <a
                [routerLink]="['/products', product.id]"
                class="btn btn-primary"
              >
                Ver Detalles
              </a>
              <button class="btn btn-outline" [disabled]="!product.inStock">
                {{ product.inStock ? 'Añadir al Carrito' : 'No Disponible' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div *ngIf="!loading() && products().length === 0" class="no-products">
        <div class="no-products-icon">📦</div>
        <h3>No hay productos</h3>
        <p>
          No se encontraron productos
          {{ currentCategory() ? 'en esta categoría' : '' }}.
        </p>
      </div>
    </div>
  `,
  styleUrls: ['./product-list.scss'],
})
export class ProductList implements OnInit {
  private product = inject(Product);
  private route = inject(ActivatedRoute);
  products = signal<ProductInterface[]>([]);
  loading = signal(false);
  currentCategory = signal<ProductCategory | null>(null);
  categories = Object.values(ProductCategory);
  categoryLabels: Record<ProductCategory, string> = {
    [ProductCategory.ELECTRONICS]: 'Electrónicos',
    [ProductCategory.CLOTHING]: 'Ropa',
    [ProductCategory.BOOKS]: 'Libros',
    [ProductCategory.HOME]: 'Hogar',
    [ProductCategory.SPORTS]: 'Deportes',
  };
 
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const category = params.get('category') as ProductCategory;
      this.currentCategory.set(category);
      this.loadProducts();
    });
  }

  private loadProducts(): void {
    this.loading.set(true);
    const category = this.currentCategory();
    const request = category
      ? this.product.getProductsByCategory(category)
      : this.product.getAllProducts();

    request.subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading.set(false);
      },
    });
  }

  navigateToCategory(category: ProductCategory | 'all'): void {
    // Implementar navegación usando Router
    // this.router.navigate(['/product-list', 'category', category]);
  }

  getPageTitle(): string {
    const category = this.currentCategory();
    if (category) {
      return `Productos - ${this.categoryLabels[category]}`;
    }
    return 'Todos los Productos';
  }

  getCategoryLabel(category: ProductCategory): string {
    return this.categoryLabels[category];
  }

  trackByProductId(index: number, product: ProductInterface): string {
    return product.id;
  }
}
```

### 5. Estilos

**/product-list.scss**:

```scss
.product-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.btn-primary {
    background: #007bff;
    color: white;
    &:hover {
      background: #0056b3;
    }
  }

  &.btn-outline {
    background: transparent;
    border: 2px solid #007bff;
    color: #007bff;
    &:hover {
      background: #007bff;
      color: white;
    }
  }

  &.btn-large {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }

  &.btn-full {
    width: 100%;
    justify-content: center;
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
} 

.loading {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}
```

### 6. Configurar la nueva navegación

Añadir en app.routes.ts la nueva navegación:

```typescript
{
    path: 'products',
    loadComponent: () =>
      import('./features/product-list/product-list.component').then((m) => m.ProductList),
    title: 'Products',
  },
```

Añadir en header.ts, dentro del template, la navegación a product-list:

```typescript
<nav class="navigation">
      <ul>
        <li><a (click)="navigate('home')">Inicio</a></li>
        <li><a (click)="navigate('counter')">Counter</a></li>
        <li><a (click)="navigate('users')">Users</a></li>
        <li><a (click)="navigate('directives')">Directivas</a></li>
        <li><a (click)="navigate('databindings')">Data Bindings</a></li>
        <li><a (click)="navigate('pipes')">Pipes</a></li>
        <li><a (click)="navigate('products')">Products</a></li>
      </ul>
    </nav>
```

### 7. Iniciar la aplicación

```bash
ng serve
```

Navega a `http://localhost:4200/` para ver todos el ejemplo de como usar servicos en componentes.
