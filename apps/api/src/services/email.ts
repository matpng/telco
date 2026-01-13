import nodemailer from "nodemailer";
import { env } from "../lib/env.js";

export const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: false,
  auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined
});

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  await transporter.sendMail({
    from: env.smtpFrom,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    attachments: opts.attachments?.map(a => ({ filename: a.filename, content: a.content }))
  });
}
