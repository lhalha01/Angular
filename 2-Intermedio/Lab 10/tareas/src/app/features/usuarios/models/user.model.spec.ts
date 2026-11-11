import { isUser } from './user.model';

describe('isUser', () => {
  const valid = { id: 1, name: 'Ana', username: 'ana', email: 'ana@example.com' };

  it('accepts a user and rejects invalid shapes', () => {
    expect(isUser(valid)).toBeTrue();
    expect(isUser({ ...valid, email: undefined })).toBeFalse();
    expect(isUser(null)).toBeFalse();
    expect(isUser({ id: '1' })).toBeFalse();
  });
});
