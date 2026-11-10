import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HighlightUserDirective } from './highlight-user.directive';

@Component({
  imports: [HighlightUserDirective],
  template: `<span [appHighlightUser]="name()">x</span>`,
})
class HostComponent {
  name = signal('');
}

describe('HighlightUserDirective', () => {
  function setup(name: string): HTMLElement {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.name.set(name);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('span')!;
  }

  it('highlights names starting with a vowel', () => {
    expect(setup('Ervin Howell').classList).toContain('user-highlight');
  });

  it('highlights accented vowels', () => {
    expect(setup('Álvaro').classList).toContain('user-highlight');
  });

  it('does not highlight consonants', () => {
    expect(setup('Leanne Graham').classList).not.toContain('user-highlight');
  });
});
