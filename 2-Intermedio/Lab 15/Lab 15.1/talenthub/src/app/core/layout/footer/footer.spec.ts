import { TestBed } from '@angular/core/testing';
import { Footer } from './footer';

describe('Footer', () => {
  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  async function crear() {
    await TestBed.configureTestingModule({ imports: [Footer] }).compileComponents();
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('muestra el nombre del producto y de la empresa', async () => {
    const texto = await crear();
    expect(texto).toContain('TalentHub');
    expect(texto).toContain('Nexus Digital Solutions');
  });

  it('muestra el año actual', async () => {
    jasmine.clock().mockDate(new Date(2031, 5, 15));
    expect(await crear()).toContain('© 2031');
  });
});
