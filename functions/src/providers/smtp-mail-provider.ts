import nodemailer, { type Transporter } from 'nodemailer';
import { MailProvider, MailOptions, MailSendResult } from '@opp/shared';

export interface SmtpConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  defaultFrom?: string;
}

/**
 * Provedor de envio de e-mail institucional e cópia cidadã (Seção 10.1 & Critério AC-08).
 * Suporta transporte SMTP real com credenciais configuráveis ou modo Sandbox para desenvolvimento/emulador (Seção 32).
 */
export class SmtpMailProvider implements MailProvider {
  private transporter: Transporter | null = null;
  private isSandbox: boolean = false;
  private defaultFrom: string;

  constructor(config: SmtpConfig = {}) {
    const host = config.host || process.env.SMTP_HOST;
    const port = config.port || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587);
    const secure = config.secure ?? (process.env.SMTP_SECURE === 'true');
    const user = config.user || process.env.SMTP_USER;
    const pass = config.pass || process.env.SMTP_PASS;
    this.defaultFrom = config.defaultFrom || process.env.SMTP_FROM || 'ouvidoria-notificacoes@opp.org.br';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
      });
      this.isSandbox = false;
    } else {
      // Modo Sandbox Cívico: simula o envio com logs auditáveis sem credenciais expostas (Seção 32)
      this.isSandbox = true;
      console.info('[SmtpMailProvider] SMTP_HOST ou credenciais não informadas. Operando em modo SANDBOX cívico seguro.');
    }
  }

  async send(options: MailOptions): Promise<MailSendResult> {
    const from = options.from || this.defaultFrom;

    if (this.isSandbox || !this.transporter) {
      const mockMessageId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      console.info(`[SmtpMailProvider:SANDBOX] Envio de e-mail simulado com sucesso:`, {
        from,
        to: options.to,
        subject: options.subject,
        messageId: mockMessageId,
        headers: options.headers
      });

      return {
        success: true,
        messageId: mockMessageId,
        provider: 'SANDBOX_SMTP'
      };
    }

    try {
      const mailInfo = await this.transporter.sendMail({
        from,
        to: options.to,
        cc: options.cc,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.bodyText,
        html: options.bodyHtml,
        headers: options.headers,
        attachments: options.attachments?.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType
        }))
      });

      return {
        success: true,
        messageId: mailInfo.messageId,
        provider: 'SMTP'
      };
    } catch (err: any) {
      console.error('[SmtpMailProvider] Falha no disparo de e-mail:', err);
      return {
        success: false,
        provider: 'SMTP',
        error: err.message || 'Erro desconhecido no transporte SMTP'
      };
    }
  }
}
