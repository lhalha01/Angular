import * as dashboard from '@features/dashboard';

describe('barrel de la feature dashboard', () => {
  it('expone exactamente su API pública (valores)', () => {
    expect(Object.keys(dashboard)).toEqual(['Dashboard']);
  });
});
