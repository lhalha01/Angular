import { EMPTY, firstValueFrom, of, throwError } from 'rxjs';
import { ignoreServerOutcome } from './ignore-server-outcome';

describe('ignoreServerOutcome', () => {
  it('turns any successful response into a plain completion', async () => {
    expect(await firstValueFrom(of({ id: 201 }).pipe(ignoreServerOutcome()))).toBeUndefined();
  });

  it('turns an error into a normal completion too', async () => {
    const result = await firstValueFrom(throwError(() => new Error('red caída')).pipe(ignoreServerOutcome()));
    expect(result).toBeUndefined();
  });

  it('emits one empty value per response, without dropping any', async () => {
    const emissions: unknown[] = [];
    await new Promise<void>((resolve) =>
      of(1, 2, 3)
        .pipe(ignoreServerOutcome())
        .subscribe({ next: (v) => emissions.push(v), complete: resolve }),
    );
    expect(emissions.length).toBe(3);
    expect(emissions.every((v) => v === undefined)).toBeTrue();
  });

  it('completes without emitting when the request does', async () => {
    let emitted = false;
    await new Promise<void>((resolve) =>
      EMPTY.pipe(ignoreServerOutcome()).subscribe({ next: () => (emitted = true), complete: resolve }),
    );
    expect(emitted).toBeFalse();
  });
});
