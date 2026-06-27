import {
  buildNodemailerTransportOptions,
  DEFAULT_EMAIL_FROM,
  getEmailSettings,
  isEmailConfigured,
} from './email.config';

describe('email.config', () => {
  const fullEnv = {
    EMAIL_HOST: 'smtp.example.com',
    EMAIL_PORT: '587',
    EMAIL_USER: 'user',
    EMAIL_PASSWORD: 'secret',
    EMAIL_FROM: '"Test" <test@example.com>',
  };

  it('returns null when required vars are missing', () => {
    expect(getEmailSettings(() => undefined)).toBeNull();
    expect(isEmailConfigured(() => undefined)).toBe(false);
  });

  it('parses email settings from env', () => {
    const settings = getEmailSettings((key) => fullEnv[key as keyof typeof fullEnv]);

    expect(settings).toEqual({
      host: 'smtp.example.com',
      port: 587,
      user: 'user',
      password: 'secret',
      from: '"Test" <test@example.com>',
    });
  });

  it('defaults port and from address', () => {
    const settings = getEmailSettings((key) => {
      if (key === 'EMAIL_HOST') return 'smtp.example.com';
      if (key === 'EMAIL_USER') return 'user';
      if (key === 'EMAIL_PASSWORD') return 'secret';
      return undefined;
    });

    expect(settings?.port).toBe(587);
    expect(settings?.from).toBe(DEFAULT_EMAIL_FROM);
  });

  it('builds transport options for STARTTLS on port 587', () => {
    const settings = getEmailSettings((key) => fullEnv[key as keyof typeof fullEnv])!;
    const options = buildNodemailerTransportOptions(settings);

    expect(options.secure).toBe(false);
    expect(options.requireTLS).toBe(true);
    expect(options.port).toBe(587);
  });

  it('builds transport options for SSL on port 465', () => {
    const settings = getEmailSettings((key) => {
      if (key === 'EMAIL_PORT') return '465';
      return fullEnv[key as keyof typeof fullEnv];
    })!;
    const options = buildNodemailerTransportOptions(settings);

    expect(options.secure).toBe(true);
    expect(options.requireTLS).toBe(false);
    expect(options.port).toBe(465);
  });
});
