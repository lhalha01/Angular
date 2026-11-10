
[[_TOC_]]

## Lab 09: LifeCycle Hooks

Aprender a implementar un sistema de navegación completo usando el Router de Angular 17+ con enfoque en standalone components, lazy loading, guards, resolvers y las mejores prácticas modernas.

### 1. implementamos las siguientes lifecycle hooks en el header.ts

layout/header.ts

```typescript
import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  DoCheck,
  OnChanges,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})

export class Header
  implements
    OnChanges,
    OnInit,
    AfterContentInit,
    AfterViewInit,
    OnDestroy,
    DoCheck,
    AfterContentChecked,
    AfterViewChecked
{
  @Input() appTitle = '';
  @Input() currentUser: any = null;
  @Output() navigationClick = new EventEmitter<string>();
  @Output() loginClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();
  
  navigate(section: string) {
    this.navigationClick.emit(section);
  }

  login() {
    this.loginClick.emit();
  }

  logout() {
    this.logoutClick.emit();
  }
  
  constructor() {
    console.log('constructor called');
  }

  ngOnChanges() {
    console.log('ngOnChanges called');
  }
  
  ngOnInit() {
    console.log('ngOnInit called');
  }
  
  ngDoCheck() {
    console.log('ngDoCheck called');
  }

  ngAfterContentInit() {
    console.log('ngAfterContentInit called');
  }

  ngAfterContentChecked() {
    console.log('ngAfterContentChecked called');
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit called');
  }

  ngAfterViewChecked() {
    console.log('ngAfterViewChecked called');
  }
  
  ngOnDestroy() {
    console.log('ngOnDestroy called');
  }
}
```

### 2. Abrimos la consola del navegador y veriamos lo siguiente

![life.png](/.attachments/life-f01f71fd-9ffd-4e3c-8772-72e9dd21f724.png)
