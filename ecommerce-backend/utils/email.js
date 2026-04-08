import nodemailer from 'nodemailer';

const getBooleanEnv = (value, fallback = false) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const normalizeSmtpPassword = (host, value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  if (/smtp\.gmail\.com/i.test(host || '')) {
    return trimmedValue.replace(/\s+/g, '');
  }

  return trimmedValue;
};

const getMailConfig = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = normalizeSmtpPassword(host, process.env.SMTP_PASS);
  const from = process.env.SMTP_FROM?.trim();
  const secure = getBooleanEnv(process.env.SMTP_SECURE, port === 465);
  const rejectUnauthorized = getBooleanEnv(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true);

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
  const configuredFrom = process.env.SMTP_FROM?.trim();

  if (configuredFrom) {
    return configuredFrom;
  }

  return 'JCMarket <no-reply@jcmarket.local>';
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
