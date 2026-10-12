import type { EmailOptions, EmailProvider } from './EmailProvider.ts';
import { getEmailFrom, getEnv } from './config/app.ts';

interface SmtpResponse {
  code: number;
  message: string;
}

const encodeBase64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/.{1,76}/g, '$&\r\n').trimEnd();
};

const encodeHeader = (value: string): string =>
  `=?UTF-8?B?${encodeBase64(value).replace(/\r\n/g, '')}?=`;

const getMailbox = (value: string, field: string): string => {
  if (/[\r\n]/.test(value)) throw new Error(`SMTP ${field} must not contain line breaks`);
  const mailbox = value.match(/<([^<>]+)>/)?.[1] ?? value.trim();
  if (!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?$/i.test(mailbox)) {
    throw new Error(`SMTP ${field} must contain a valid email address`);
  }
  return mailbox;
};

class SmtpConnection {
  private bufferedText = '';
  private readonly decoder = new TextDecoder();

  constructor(private readonly connection: Deno.Conn) {}

  async write(value: string): Promise<void> {
    const bytes = new TextEncoder().encode(value);
    let offset = 0;
    while (offset < bytes.length) {
      const written = await this.connection.write(bytes.subarray(offset));
      if (written === 0) throw new Error('SMTP connection closed while writing');
      offset += written;
    }
  }

  async readResponse(): Promise<SmtpResponse> {
    const lines: string[] = [];
    let expectedCode: number | undefined;

    while (true) {
      const line = await this.readLine();
      const match = line.match(/^(\d{3})([ -])(.*)$/);
      if (!match) throw new Error(`Invalid SMTP response: ${line}`);

      const code = Number(match[1]);
      if (expectedCode !== undefined && code !== expectedCode) {
        throw new Error(`Inconsistent SMTP response: ${line}`);
      }
      expectedCode = code;
      lines.push(match[3]);

      if (match[2] === ' ') return { code, message: lines.join(' ') };
    }
  }

  private async readLine(): Promise<string> {
    while (true) {
      const newline = this.bufferedText.indexOf('\n');
      if (newline >= 0) {
        const line = this.bufferedText.slice(0, newline).replace(/\r$/, '');
        this.bufferedText = this.bufferedText.slice(newline + 1);
        return line;
      }

      const buffer = new Uint8Array(1024);
      const bytesRead = await this.connection.read(buffer);
      if (bytesRead === null) throw new Error('SMTP server closed the connection unexpectedly');
      this.bufferedText += this.decoder.decode(buffer.subarray(0, bytesRead), { stream: true });
    }
  }
}

export class SmtpAdapter implements EmailProvider {
  private readonly config: {
    host: string;
    port: number;
    username: string;
    password: string;
    from: string;
    authMethod: 'LOGIN' | 'PLAIN';
  };

  constructor() {
    const port = Number.parseInt(
      getEnv('SMTP_PORT') || getEnv('Deno_mail_smtp_port') || '465',
      10,
    );
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('SMTP_PORT must be a valid TCP port');
    }
    const authMethod = (
      getEnv('SMTP_AUTH_METHOD') ||
      getEnv('Deno_mail_smtp_auth_method') ||
      'LOGIN'
    ).toUpperCase();
    if (authMethod !== 'LOGIN' && authMethod !== 'PLAIN') {
      throw new Error('SMTP_AUTH_METHOD must be LOGIN or PLAIN');
    }
    this.config = {
      host: getEnv('SMTP_HOST') || getEnv('Deno_mail_smtp_server') || '',
      port,
      username: getEnv('SMTP_USERNAME') || getEnv('Deno_mail_smtp_username') || '',
      password: getEnv('SMTP_PASSWORD') || getEnv('Deno_mail_smtp_password') || '',
      from:
        getEnv('SMTP_FROM') ||
        getEnv('Deno_mail_from_notif') ||
        getEmailFrom(),
      authMethod,
    };
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    const { host, port, username, password, from, authMethod } = this.config;
    if (!host || !from) throw new Error('SMTP host and sender address must be configured');
    if (!username || !password) throw new Error('SMTP credentials not configured');
    if (!options.subject.trim() || /[\r\n]/.test(options.subject)) {
      throw new Error('SMTP subject must be non-empty and must not contain line breaks');
    }
    if (!options.text && !options.html) throw new Error('SMTP email content is required');
    if (options.attachments?.length) {
      throw new Error('SMTP email attachments are not supported by the configured SMTP adapter');
    }

    const sender = getMailbox(options.from || from, 'sender');
    const recipients = (Array.isArray(options.to) ? options.to : [options.to])
      .map((recipient) => getMailbox(recipient, 'recipient'));
    if (!recipients.length) throw new Error('At least one SMTP recipient is required');
    const replyTo = options.replyTo ? getMailbox(options.replyTo, 'reply-to') : undefined;

    const messageId = `<${crypto.randomUUID()}@${sender.split('@')[1]}>`;
    const message = this.buildMessage(options, sender, recipients, messageId, replyTo);
    const connection = await Deno.connectTls({ hostname: host, port });
    const smtp = new SmtpConnection(connection);

    try {
      await this.expect(smtp, [220]);
      await this.command(smtp, `EHLO ${host}`, [250]);
      await this.authenticate(smtp, authMethod, username, password);
      await this.command(smtp, `MAIL FROM:<${sender}>`, [250]);
      for (const recipient of recipients) {
        await this.command(smtp, `RCPT TO:<${recipient}>`, [250, 251]);
      }
      await this.command(smtp, 'DATA', [354]);
      await smtp.write(`${message.replace(/(^|\r\n)\./g, '$1..')}\r\n.\r\n`);
      await this.expect(smtp, [250]);
      await this.command(smtp, 'QUIT', [221]);
    } finally {
      connection.close();
    }

    return { success: true, messageId };
  }

  private async command(
    smtp: SmtpConnection,
    value: string,
    acceptedCodes: number[],
  ): Promise<SmtpResponse> {
    await smtp.write(`${value}\r\n`);
    return this.expect(smtp, acceptedCodes);
  }

  private async authenticate(
    smtp: SmtpConnection,
    method: 'LOGIN' | 'PLAIN',
    username: string,
    password: string,
  ): Promise<void> {
    const encodedUsername = encodeBase64(username).replace(/\r\n/g, '');
    const encodedPassword = encodeBase64(password).replace(/\r\n/g, '');

    if (method === 'LOGIN') {
      await this.command(smtp, 'AUTH LOGIN', [334]);
      await this.command(smtp, encodedUsername, [334]);
      await this.command(smtp, encodedPassword, [235]);
      return;
    }

    const credentials = encodeBase64(`\0${username}\0${password}`).replace(/\r\n/g, '');
    const response = await this.command(smtp, `AUTH PLAIN ${credentials}`, [235, 334]);
    if (response.code === 334) await this.command(smtp, credentials, [235]);
  }

  private async expect(smtp: SmtpConnection, acceptedCodes: number[]): Promise<SmtpResponse> {
    const response = await smtp.readResponse();
    if (!acceptedCodes.includes(response.code)) {
      throw new Error(`SMTP server returned ${response.code}: ${response.message}`);
    }
    return response;
  }

  private buildMessage(
    options: EmailOptions,
    sender: string,
    recipients: string[],
    messageId: string,
    replyTo?: string,
  ): string {
    const headers = [
      `From: <${sender}>`,
      `To: ${recipients.map((recipient) => `<${recipient}>`).join(', ')}`,
      `Subject: ${encodeHeader(options.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${messageId}`,
      'MIME-Version: 1.0',
    ];
    if (replyTo) headers.push(`Reply-To: <${replyTo}>`);

    if (options.text && options.html) {
      const boundary = `alternative-${crypto.randomUUID()}`;
      return [
        ...headers,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        encodeBase64(options.text),
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        encodeBase64(options.html),
        `--${boundary}--`,
      ].join('\r\n');
    }

    const contentType = options.html ? 'text/html' : 'text/plain';
    const content = options.html ?? options.text ?? '';
    return [
      ...headers,
      `Content-Type: ${contentType}; charset=UTF-8`,
      'Content-Transfer-Encoding: base64',
      '',
      encodeBase64(content),
    ].join('\r\n');
  }
}
