import { TestBed } from '@angular/core/testing';
import { TaskToolbarComponent } from './task-toolbar.component';

const USERS = [
  { id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' },
  { id: 2, name: 'Ervin', username: 'e', email: 'e@e.com' },
];

describe('TaskToolbarComponent', () => {
  function setup() {
    const fixture = TestBed.createComponent(TaskToolbarComponent);
    fixture.componentRef.setInput('users', USERS);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const select = (label: string) =>
      Array.from(el.querySelectorAll('label'))
        .find((l) => l.textContent?.trim().startsWith(label))!
        .querySelector('select')!;
    const choose = (label: string, index: number) => {
      const s = select(label);
      s.selectedIndex = index;
      s.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };
    return { fixture, el, select, choose, component: fixture.componentInstance };
  }

  it('lists all the users in the user filter', () => {
    const { select } = setup();
    expect(Array.from(select('Filtrar por usuario').options).map((o) => o.textContent?.trim())).toEqual([
      'Todos',
      'Leanne',
      'Ervin',
    ]);
  });

  it('updates the search text', () => {
    const { fixture, el, component } = setup();
    const input = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = 'pan';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.search()).toBe('pan');
  });

  it('updates status, user and sort', () => {
    const { choose, component } = setup();
    choose('Filtrar por estado', 2);
    choose('Filtrar por usuario', 2);
    choose('Ordenar por', 2);
    expect(component.status()).toBe('pending');
    expect(component.user()).toBe(2);
    expect(component.sort()).toBe('title-asc');
  });

  it('reflects the values it receives', () => {
    const { fixture, select, component } = setup();
    component.status.set('completed');
    component.user.set(1);
    fixture.detectChanges();
    return fixture.whenStable().then(() => {
      expect(select('Filtrar por estado').value).toContain('completed');
      expect(select('Filtrar por usuario').selectedIndex).toBe(1);
    });
  });

  it('switches the view mode and marks the active button', () => {
    const { fixture, el, component } = setup();
    const buttons = el.querySelectorAll<HTMLButtonElement>('.view-toggle button');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    buttons[1].click();
    fixture.detectChanges();
    expect(component.view()).toBe('list');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
  });
});
