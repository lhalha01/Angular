import { TestBed } from '@angular/core/testing';
import { PaginatorComponent } from './paginator.component';
import { PageSize } from './pagination';

describe('PaginatorComponent', () => {
  function setup(page = 2, totalPages = 3, pageSize: PageSize = 10) {
    const fixture = TestBed.createComponent(PaginatorComponent);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('pageSize', pageSize);
    fixture.componentRef.setInput('totalPages', totalPages);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const buttons = () => el.querySelectorAll<HTMLButtonElement>('.pager button');
    return { fixture, el, buttons, component: fixture.componentInstance };
  }

  it('shows the current page and the total', () => {
    expect(setup().el.querySelector('.pager')?.textContent).toContain('Página 2 de 3');
  });

  it('goes to the previous and the next page', () => {
    const { fixture, buttons, component } = setup();
    buttons()[1].click();
    expect(component.page()).toBe(3);
    fixture.detectChanges();
    buttons()[0].click();
    expect(component.page()).toBe(2);
  });

  it('disables Anterior on the first page and Siguiente on the last', () => {
    const first = setup(1, 3);
    expect(first.buttons()[0].disabled).toBeTrue();
    expect(first.buttons()[1].disabled).toBeFalse();
    TestBed.resetTestingModule();
    const last = setup(3, 3);
    expect(last.buttons()[1].disabled).toBeTrue();
  });

  it('hides the navigation when there is a single page but keeps the size selector', () => {
    const { el } = setup(1, 1);
    expect(el.querySelector('.pager')).toBeNull();
    expect(el.querySelector('.page-size select')).not.toBeNull();
  });

  it('offers 10, 25, 50, 100 and all by default and reports the choice', () => {
    const { fixture, el, component } = setup();
    const select = el.querySelector<HTMLSelectElement>('select')!;
    expect(Array.from(select.options).map((o) => o.textContent?.trim())).toEqual(['10', '25', '50', '100', 'Todos']);

    select.selectedIndex = 4;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.pageSize()).toBe('all');
  });
});
