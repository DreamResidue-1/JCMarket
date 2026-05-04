import nodemailer from 'nodemailer';

const DEFAULT_FROM = 'JCMarket <no-reply@jcmarket.local>';

const getBooleanEnv = (value, fallback = false) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const getFirstEnvValue = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

const normalizeEnvText = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const hasDoubleQuotes = trimmedValue.startsWith('"') && trimmedValue.endsWith('"');
  const hasSingleQuotes = trimmedValue.startsWith('\'') && trimmedValue.endsWith('\'');

  if (hasDoubleQuotes || hasSingleQuotes) {
    return trimmedValue.slice(1, -1).trim() || undefined;
  }

  return trimmedValue;
};

const normalizeSmtpPassword = (host, value) => {
  const normalizedValue = normalizeEnvText(value);

  if (typeof normalizedValue !== 'string') {
    return value;
  }

  const trimmedValue = normalizedValue.trim();

  if (/smtp\.gmail\.com/i.test(host || '')) {
    return trimmedValue.replace(/\s+/g, '');
  }

  return trimmedValue;
};

const parseSmtpPort = (value, fallback = 587) => {
  const parsedPort = Number.parseInt(value || '', 10);

  if (!Number.isFinite(parsedPort) || parsedPort <= 0) {
    return fallback;
  }

  return parsedPort;
};

const extractEmailAddress = (value = '') => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmedValue = value.trim().toLowerCase();
  if (!trimmedValue) {
    return '';
  }

  const bracketMatch = trimmedValue.match(/<([^>]+)>/);
  const candidate = bracketMatch ? bracketMatch[1].trim() : trimmedValue;

  return candidate.includes('@') ? candidate : '';
};

const isPlaceholderFromAddress = (value = '') => {
  const email = extractEmailAddress(value);

  if (!email) {
    return false;
  }

  const domain = email.split('@')[1] || '';
  return ['example.com', 'example.org', 'example.net', 'jcmarket.local', 'localhost', 'local'].includes(domain);
};

const resolveFromAddress = ({ host, user, from }) => {
  const normalizedFrom = normalizeEnvText(from);
  const normalizedUser = normalizeEnvText(user)?.toLowerCase();
  const fromEmail = extractEmailAddress(normalizedFrom || '');
  const isGmailSmtp = /smtp\.gmail\.com/i.test(host || '');

  if (!normalizedFrom || isPlaceholderFromAddress(normalizedFrom)) {
    return normalizedUser ? `JCMarket <${normalizedUser}>` : DEFAULT_FROM;
  }

  if (isGmailSmtp && normalizedUser && fromEmail && fromEmail !== normalizedUser) {
    const displayNameMatch = normalizedFrom.match(/^(.*)<[^>]+>$/);
    const displayName = displayNameMatch
      ? displayNameMatch[1].trim().replace(/^"|"$/g, '')
      : 'JCMarket';

    return `${displayName || 'JCMarket'} <${normalizedUser}>`;
  }

  return normalizedFrom;
};

const getMailConfig = () => {
  const host = normalizeEnvText(getFirstEnvValue(
    'SMTP_HOST',
    'MAIL_HOST',
    'EMAIL_HOST'
  ));
  const port = parseSmtpPort(getFirstEnvValue(
    'SMTP_PORT',
    'MAIL_PORT',
    'EMAIL_PORT'
  ));
  const user = normalizeEnvText(getFirstEnvValue(
    'SMTP_USER',
    'SMTP_USERNAME',
    'MAIL_USER',
    'MAIL_USERNAME',
    'EMAIL_USER',
    'EMAIL_USERNAME'
  ));
  const pass = normalizeSmtpPassword(
    host,
    getFirstEnvValue(
      'SMTP_PASS',
      'SMTP_PASSWORD',
      'MAIL_PASS',
      'MAIL_PASSWORD',
      'EMAIL_PASS',
      'EMAIL_PASSWORD'
    )
  );
  const from = resolveFromAddress({
    host,
    user,
    from: getFirstEnvValue(
      'SMTP_FROM',
      'MAIL_FROM',
      'EMAIL_FROM',
      'FROM_EMAIL'
    )
  });
  const secure = getBooleanEnv(getFirstEnvValue('SMTP_SECURE', 'MAIL_SECURE', 'EMAIL_SECURE'), port === 465);
  const rejectUnauthorized = getBooleanEnv(
    getFirstEnvValue('SMTP_TLS_REJECT_UNAUTHORIZED', 'MAIL_TLS_REJECT_UNAUTHORIZED', 'EMAIL_TLS_REJECT_UNAUTHORIZED'),
    true
  );

  return {
    host,
    port,
    user,
    pass,
    from,
    secure,
    rejectUnauthorized
  };
};

const isRealTransportConfigured = () => {
  const config = getMailConfig();

  return Boolean(config.host && config.port && config.user && config.pass && config.from);
};

let cachedTransporter;

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  if (isRealTransportConfigured()) {
    const config = getMailConfig();

    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      tls: {
        rejectUnauthorized: config.rejectUnauthorized
      },
      auth: {
        user: config.user,
        pass: config.pass
      }
    });

    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });

  return cachedTransporter;
};

const getMailFrom = () => {
  const config = getMailConfig();

  if (config.from) {
    return config.from;
  }

  return DEFAULT_FROM;
};

const sendEmail = async ({ subject, to, text, html }) => {
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: getMailFrom(),
    to,
    subject,
    text,
    html
  });

  if (!isRealTransportConfigured()) {
    const preview = typeof info.message === 'string'
      ? info.message
      : info.message?.toString?.() || '';

    console.warn(`[email] SMTP is not configured. Email for ${to} was not sent to a real inbox.`);
    console.warn(preview);
  }

  return info;
};

export const sendWelcomeEmail = async ({ email, name }) => {
  const displayName = name?.trim() || email;

  await sendEmail({
    to: email,
    subject: 'Welcome to JCMarket',
    text: `Hello ${displayName}, your JCMarket account has been created successfully.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">Welcome to JCMarket</h2>
        <p>Hello ${displayName},</p>
        <p>Your JCMarket account has been created successfully.</p>
        <p>You can now sign in and start shopping.</p>
      </div>
    `
  });
};

export const sendLoginNotificationEmail = async ({ email, name, method }) => {
  const displayName = name?.trim() || email;
  const methodLabel = method === 'google' ? 'Google' : 'email and password';

  await sendEmail({
    to: email,
    subject: 'JCMarket sign-in alert',
    text: `Hello ${displayName}, this is a confirmation that you signed in to JCMarket using ${methodLabel}.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">JCMarket sign-in confirmation</h2>
        <p>Hello ${displayName},</p>
        <p>This message confirms that you signed in to JCMarket using <strong>${methodLabel}</strong>.</p>
        <p>If this was not you, please reset your password and review your account immediately.</p>
      </div>
    `
  });
};

export const sendPasswordResetEmail = async ({ email, name, code }) => {
  const displayName = name?.trim() || email;

  await sendEmail({
    to: email,
    subject: 'JCMarket password reset code',
    text: `Hello ${displayName}, your JCMarket password reset code is ${code}. This code expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">JCMarket password reset</h2>
        <p>Hello ${displayName},</p>
        <p>Use the code below to reset your JCMarket password:</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 0.18em; margin: 18px 0;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });
};

export const isEmailDeliveryConfigured = () => isRealTransportConfigured();
