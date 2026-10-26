import { accountToken } from '../account';
import { api, type Delivery } from '../api';
import { DeliverySettings, describe as describeDelivery, parseTime, toTime } from '../delivery';

jest.mock('../account', () => ({ accountToken: jest.fn() }));
jest.mock('../api', () => ({
  ...jest.requireActual('../api'),
  api: { delivery: jest.fn(), setDelivery: jest.fn() },
}));

const mockedApi = jest.mocked(api);

/** A promise the test resolves or rejects by hand, to hold a request in flight. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const morning: Delivery = { mode: 'MORNING', time: null };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(accountToken).mockResolvedValue('token-1');
  mockedApi.delivery.mockResolvedValue(morning);
  mockedApi.setDelivery.mockImplementation(async (_token, delivery) => delivery);
});

describe('times', () => {
  it('round-trips HH:mm', () => {
    expect(parseTime('07:45')).toEqual({ hour: 7, minute: 45 });
    expect(toTime(7, 5)).toBe('07:05');
  });

  it('describes each mode', () => {
    expect(describeDelivery({ mode: 'MORNING', time: null })).toMatch(/^Every morning at 9:00/);
    expect(describeDelivery({ mode: 'FIXED', time: '21:30' })).toMatch(/^Every day at (9:30|21:30)/);
    expect(describeDelivery({ mode: 'SURPRISE', time: null })).toMatch(/^A different time each day, between/);
  });
});

describe('DeliverySettings', () => {
  const settings = () => new DeliverySettings(() => 'Asia/Seoul');

  it('loads what the backend has', async () => {
    const delivery = settings();
    expect(delivery.getSnapshot()).toEqual({ status: 'loading' });

    await delivery.load();

    expect(delivery.getSnapshot()).toEqual({ status: 'ready', delivery: morning, saving: false, failed: false });
    expect(accountToken).toHaveBeenCalledWith('Asia/Seoul');
  });

  it('reports when the backend cannot be reached', async () => {
    mockedApi.delivery.mockRejectedValue(new TypeError('Network request failed'));
    const delivery = settings();

    await delivery.load();

    expect(delivery.getSnapshot()).toEqual({ status: 'unavailable' });
  });

  it('shows a choice at once and saves it', async () => {
    const delivery = settings();
    await delivery.load();
    const save = deferred<Delivery>();
    mockedApi.setDelivery.mockReturnValueOnce(save.promise);

    const saved = delivery.choose({ mode: 'FIXED', time: '21:00' });
    expect(delivery.getSnapshot()).toEqual({
      status: 'ready',
      delivery: { mode: 'FIXED', time: '21:00' },
      saving: true,
      failed: false,
    });

    save.resolve({ mode: 'FIXED', time: '21:00' });
    await saved;
    expect(delivery.getSnapshot()).toMatchObject({ delivery: { mode: 'FIXED', time: '21:00' }, saving: false });
  });

  it('collapses taps made during a save into one more save of the latest', async () => {
    const delivery = settings();
    await delivery.load();
    const first = deferred<Delivery>();
    mockedApi.setDelivery.mockReturnValueOnce(first.promise);

    const saved = delivery.choose({ mode: 'FIXED', time: '21:00' });
    void delivery.choose({ mode: 'FIXED', time: '22:00' });
    void delivery.choose({ mode: 'FIXED', time: '22:30' });
    first.resolve({ mode: 'FIXED', time: '21:00' });
    await saved;

    expect(mockedApi.setDelivery.mock.calls.map(([, sent]) => sent.time)).toEqual(['21:00', '22:30']);
    expect(delivery.getSnapshot()).toMatchObject({ delivery: { time: '22:30' }, saving: false, failed: false });
  });

  it('puts back the saved choice when a save fails', async () => {
    const delivery = settings();
    await delivery.load();
    mockedApi.setDelivery.mockRejectedValueOnce(new TypeError('Network request failed'));

    await delivery.choose({ mode: 'SURPRISE', time: null });

    expect(delivery.getSnapshot()).toEqual({ status: 'ready', delivery: morning, saving: false, failed: true });
  });

  it('does not let a reload overwrite a choice that is still saving', async () => {
    const delivery = settings();
    await delivery.load();
    const save = deferred<Delivery>();
    mockedApi.setDelivery.mockReturnValueOnce(save.promise);

    const saved = delivery.choose({ mode: 'SURPRISE', time: null });
    await delivery.load();
    expect(delivery.getSnapshot()).toMatchObject({ delivery: { mode: 'SURPRISE' }, saving: true });

    save.resolve({ mode: 'SURPRISE', time: null });
    await saved;
    expect(delivery.getSnapshot()).toMatchObject({ delivery: { mode: 'SURPRISE' }, saving: false });
  });
});
