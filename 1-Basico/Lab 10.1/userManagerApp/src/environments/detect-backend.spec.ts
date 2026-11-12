import { Environment } from './environment.model';
import { detectBackend, LOCAL_API, PUBLIC_API } from './detect-backend';

describe('detectBackend', () => {
  const nuevo = (): Environment => ({ apiUrl: 'x', persistentApi: false });
  const respuesta = (ok: boolean, body: unknown) =>
    ({ ok, json: () => Promise.resolve(body) }) as Response;

  beforeEach(() => spyOn(console, 'info'));

  it('usa el backend local si /health responde ok (una sola petición)', async () => {
    const env = nuevo();
    const fetchFn = jasmine.createSpy('fetch').and.resolveTo(respuesta(true, { status: 'ok' }));

    expect(await detectBackend(env, fetchFn)).toBeTrue();
    expect(env).toEqual(LOCAL_API);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.calls.mostRecent().args[0]).toBe('http://localhost:8000/health');
  });

  it('usa JSONPlaceholder si la conexión falla', async () => {
    const env = nuevo();
    const fetchFn = jasmine.createSpy('fetch').and.rejectWith(new TypeError('Failed to fetch'));

    expect(await detectBackend(env, fetchFn)).toBeFalse();
    expect(env).toEqual(PUBLIC_API);
  });

  it('usa JSONPlaceholder si responde un error o algo que no es el backend', async () => {
    const env = nuevo();
    expect(
      await detectBackend(env, jasmine.createSpy('f').and.resolveTo(respuesta(false, {}))),
    ).toBeFalse();
    expect(
      await detectBackend(env, jasmine.createSpy('f').and.resolveTo(respuesta(true, { a: 1 }))),
    ).toBeFalse();
    expect(env).toEqual(PUBLIC_API);
  });

  it('usa JSONPlaceholder si el backend no responde a tiempo', async () => {
    const env = nuevo();
    const colgado = (_: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_res, rej) =>
        init?.signal?.addEventListener('abort', () => rej(init.signal?.reason)),
      );

    expect(await detectBackend(env, colgado, 20)).toBeFalse();
    expect(env).toEqual(PUBLIC_API);
  });
});
