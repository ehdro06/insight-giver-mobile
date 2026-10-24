import { timeline } from '../diary';

describe('timeline', () => {
  it('interleaves entries and insights, newest first', () => {
    const items = timeline(
      [
        { clientId: 'a', content: 'first', writtenAt: '2026-10-20T08:00:00.000Z', syncedAt: null },
        { clientId: 'b', content: 'third', writtenAt: '2026-10-22T08:00:00.000Z', syncedAt: null },
      ],
      [{ id: 'i', body: 'second', createdAt: '2026-10-21T00:00:00Z' }],
    );

    expect(items.map((item) => item.key)).toEqual(['e:b', 'i:i', 'e:a']);
  });
});
