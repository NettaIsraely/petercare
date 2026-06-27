import { IANAZone } from 'luxon';

export const DEFAULT_APP_TIMEZONE = 'Asia/Jerusalem';

export function resolveAppTimezone(
  envValue?: string,
  warn: (message: string) => void = console.warn,
): string {
  const configured = envValue?.trim();

  if (configured && !IANAZone.isValidZone(configured)) {
    warn(
      `Invalid EXPO_PUBLIC_STABLE_TIMEZONE "${configured}"; falling back to ${DEFAULT_APP_TIMEZONE}.`,
    );
  }

  return configured && IANAZone.isValidZone(configured)
    ? configured
    : DEFAULT_APP_TIMEZONE;
}

/** Barn wall-clock timezone for all schedule dates and alert times. */
export const APP_TIMEZONE = resolveAppTimezone(process.env.EXPO_PUBLIC_STABLE_TIMEZONE);
