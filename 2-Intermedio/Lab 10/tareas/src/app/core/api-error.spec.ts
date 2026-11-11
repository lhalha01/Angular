import { HttpErrorResponse } from '@angular/common/http';
import { describeApiError } from './api-error';

const fail = (status: number, error?: unknown) => new HttpErrorResponse({ status, error });

describe('describeApiError', () => {
  const CTX = 'No se pudo crear la tarea';

  it('explains that the backend is not reachable when there is no connection (status 0)', () => {
    const text = describeApiError(fail(0), CTX);
    expect(text).toContain(CTX);
    expect(text).toContain('no se pudo conectar con el servidor');
    expect(text).toContain('backend');
  });

  it('uses the "detail" text the server sends', () => {
    expect(describeApiError(fail(409, { detail: 'El id 5 ya está en uso' }), CTX)).toBe(
      `${CTX}: El id 5 ya está en uso.`,
    );
  });

  it('uses the first message of a validation error', () => {
    const body = { detail: [{ loc: ['body', 'title'], msg: 'String should have at least 3 characters' }] };
    expect(describeApiError(fail(422, body), CTX)).toBe(`${CTX}: String should have at least 3 characters.`);
  });

  it('falls back to the status code when the error has no usable detail', () => {
    expect(describeApiError(fail(500), CTX)).toBe(`${CTX} (error 500).`);
    expect(describeApiError(fail(500, { detail: 42 }), CTX)).toBe(`${CTX} (error 500).`);
    expect(describeApiError(fail(404, { detail: [] }), CTX)).toBe(`${CTX} (error 404).`);
  });

  it('copes with errors that are not HTTP errors', () => {
    expect(describeApiError(new Error('boom'), CTX)).toBe(`${CTX}.`);
    expect(describeApiError('texto', CTX)).toBe(`${CTX}.`);
    expect(describeApiError(undefined, CTX)).toBe(`${CTX}.`);
  });
});
