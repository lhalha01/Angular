import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

const KEY = 'storage-service-test';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = TestBed.inject(StorageService);
    localStorage.removeItem(KEY);
  });
  afterEach(() => localStorage.removeItem(KEY));

  it('writes and reads a value', () => {
    service.set(KEY, 'hola');
    expect(service.get(KEY)).toBe('hola');
    expect(localStorage.getItem(KEY)).toBe('hola');
  });

  it('returns null for a missing key', () => {
    expect(service.get(KEY)).toBeNull();
  });

  describe('getOneOf', () => {
    it('returns the stored value when it is allowed', () => {
      service.set(KEY, 'list');
      expect(service.getOneOf(KEY, ['cards', 'list'])).toBe('list');
    });

    it('returns null when the value is not allowed or missing', () => {
      expect(service.getOneOf(KEY, ['cards', 'list'])).toBeNull();
      service.set(KEY, 'otra-cosa');
      expect(service.getOneOf(KEY, ['cards', 'list'])).toBeNull();
    });
  });

  describe('when storage is not available', () => {
    it('does not throw when reading', () => {
      spyOn(Storage.prototype, 'getItem').and.throwError('SecurityError');
      expect(service.get(KEY)).toBeNull();
      expect(service.getOneOf(KEY, ['a'])).toBeNull();
    });

    it('does not throw when writing', () => {
      spyOn(Storage.prototype, 'setItem').and.throwError('QuotaExceededError');
      expect(() => service.set(KEY, 'x')).not.toThrow();
    });
  });
});
