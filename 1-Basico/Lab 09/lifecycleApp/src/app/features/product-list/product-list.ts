import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
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
  private router = inject(Router);
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
    if (category === 'all') {
      this.router.navigate(['/products']);
    } else {
      this.router.navigate(['/products', 'category', category]);
    }
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
