import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export const DEFAULT_EMAIL_FROM =
  '"StableHands Support" <noreply@stablehands.app>';

export interface EmailSettings {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

type EnvGetter = (key: string) => string | undefined;

export function getEmailSettings(get: EnvGetter): EmailSettings | null {
  const host = get('EMAIL_HOST')?.trim();
  const user = get('EMAIL_USER')?.trim();
  const password = get('EMAIL_PASSWORD')?.trim();

  if (!host || !user || !password) {
    return null;
  }

  const port = Number(get('EMAIL_PORT') ?? 587);
  const from = get('EMAIL_FROM')?.trim() || DEFAULT_EMAIL_FROM;

  return { host, port, user, password, from };
}

export function isEmailConfigured(get: EnvGetter): boolean {
  return getEmailSettings(get) !== null;
}

export function buildNodemailerTransportOptions(
  settings: EmailSettings,
): SMTPTransport.Options {
  return {
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    requireTLS: settings.port === 587,
    auth: {
      user: settings.user,
      pass: settings.password,
    },
  };
}
