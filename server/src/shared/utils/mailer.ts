import nodemailer from 'nodemailer';
import { env, isProduction } from '../../config/env';
import { logger } from '../../config/logger';

export interface IMailer {
  send(to: string, subject: string, html: string): Promise<void>;
}

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    })
  : null;

/**
 * Implementación real vía SMTP (nodemailer). Si no hay SMTP configurado (típico en
 * desarrollo), cae a loguear el email en consola en vez de fallar el flujo.
 */
export const mailer: IMailer = {
  async send(to, subject, html) {
    if (!transporter) {
      logger.warn({ to, subject }, 'SMTP no configurado: email no enviado (solo log en dev)');
      if (!isProduction) logger.debug({ html }, 'Contenido del email');
      return;
    }
    await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
  },
};
