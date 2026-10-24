import InsightNative, { type StoredInsight } from '../../../modules/insight-native';
import { revealWidgetInsight, showOnWidget } from '../widget';

jest.mock('../../../modules/insight-native', () => ({
  __esModule: true,
  default: { getInsight: jest.fn(), setInsight: jest.fn(), getPushTokenAsync: jest.fn() },
}));

const native = jest.mocked(InsightNative);

const teaser: StoredInsight = {
  id: 'i-1',
  body: 'You wrote about the river twice now, and both times the run ended with a clear head.',
  preview: 'You wrote about the river twice now,…',
  createdAt: '2026-10-23T00:00:00Z',
  revealed: false,
};

beforeEach(() => jest.clearAllMocks());

describe('revealWidgetInsight', () => {
  it('lets the widget show the whole insight once the app is open', () => {
    native.getInsight.mockReturnValue(teaser);

    expect(revealWidgetInsight()).toEqual(teaser);
    expect(native.setInsight).toHaveBeenCalledWith({ ...teaser, revealed: true });
  });

  it('leaves an already revealed insight alone', () => {
    native.getInsight.mockReturnValue({ ...teaser, revealed: true });

    revealWidgetInsight();

    expect(native.setInsight).not.toHaveBeenCalled();
  });
});

describe('showOnWidget', () => {
  it('replaces an older insight', () => {
    native.getInsight.mockReturnValue(teaser);

    showOnWidget({ id: 'i-2', body: 'Newer', createdAt: '2026-10-24T00:00:00Z' });

    expect(native.setInsight).toHaveBeenCalledWith({
      id: 'i-2',
      body: 'Newer',
      preview: null,
      createdAt: '2026-10-24T00:00:00Z',
      revealed: true,
    });
  });

  it('never overwrites a newer insight that arrived by push', () => {
    native.getInsight.mockReturnValue(teaser);

    showOnWidget({ id: 'i-0', body: 'Older', createdAt: '2026-10-22T00:00:00Z' });
    showOnWidget({ id: teaser.id, body: teaser.body, createdAt: teaser.createdAt });

    expect(native.setInsight).not.toHaveBeenCalled();
  });
});
