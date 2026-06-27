import { DEFAULT_APP_TIMEZONE, resolveAppTimezone } from '../constants/timezone';

describe('resolveAppTimezone', () => {
  it('uses default when env is unset', () => {
    expect(resolveAppTimezone(undefined)).toBe(DEFAULT_APP_TIMEZONE);
  });

  it('uses configured IANA timezone from env', () => {
    expect(resolveAppTimezone('Europe/London')).toBe('Europe/London');
  });

  it('falls back to default for invalid env values', () => {
    const warn = jest.fn();

    expect(resolveAppTimezone('Not/AZone', warn)).toBe(DEFAULT_APP_TIMEZONE);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Invalid EXPO_PUBLIC_STABLE_TIMEZONE "Not/AZone"'),
    );
  });
});
