import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ConfirmService } from '../services/confirm.service';
import { HasUnsavedChanges, unsavedChangesGuard } from './unsaved-changes.guard';

describe('unsavedChangesGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  const run = (component: HasUnsavedChanges) =>
    TestBed.runInInjectionContext(() => unsavedChangesGuard(component, route, state, state));

  it('lets the user leave without asking when there are no changes', () => {
    const ask = spyOn(TestBed.inject(ConfirmService), 'ask');
    expect(run({ hasUnsavedChanges: () => false })).toBeTrue();
    expect(ask).not.toHaveBeenCalled();
  });

  it('asks for confirmation when there are changes, with "Seguir editando" as the safe option', async () => {
    const ask = spyOn(TestBed.inject(ConfirmService), 'ask').and.resolveTo(true);
    await run({ hasUnsavedChanges: () => true });
    expect(ask).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Cambios sin guardar', cancelLabel: 'Seguir editando', danger: true }),
    );
  });

  it('allows leaving when the user accepts', async () => {
    spyOn(TestBed.inject(ConfirmService), 'ask').and.resolveTo(true);
    expect(await run({ hasUnsavedChanges: () => true })).toBeTrue();
  });

  it('blocks leaving when the user chooses to keep editing', async () => {
    spyOn(TestBed.inject(ConfirmService), 'ask').and.resolveTo(false);
    expect(await run({ hasUnsavedChanges: () => true })).toBeFalse();
  });
});
