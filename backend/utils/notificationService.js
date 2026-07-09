/**
 * Optional notification helpers for ShareT.
 *
 * Trello mentions are useful, but operational updates should not depend only on
 * Trello's notification bell. This service sends a direct email when SMTP and a
 * recipient are configured. If not configured, it silently does nothing.
 */

const nodemailer = require('nodemailer');

function isEmailEnabled() {
  return Boolean(process.env.SHARET_NOTIFY_EMAIL_TO && process.env.SMTP_HOST);
}

function buildTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const auth = process.env.SMTP_USER && process.env.SMTP_PASS
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    : undefined;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth
  });
}

function buildEmailBody({ share, authorName, authorEmail, text, trelloCommentUrl, postedBy }) {
  return [
    'A new ShareT update was submitted.',
    '',
    `Card: ${share.cardName || share.cardId}`,
    `Board: ${share.boardName || 'Unknown board'}`,
    `From: ${authorName || 'External ShareT user'}${authorEmail ? ` <${authorEmail}>` : ''}`,
    `Posted to Trello by: ${postedBy || 'unknown'}`,
    trelloCommentUrl ? `Trello card: ${trelloCommentUrl}` : null,
    '',
    'Message:',
    text
  ].filter(Boolean).join('\n');
}

async function sendShareTUpdateNotification(payload) {
  if (!isEmailEnabled()) return { skipped: true, reason: 'email-not-configured' };

  try {
    const transporter = buildTransport();
    const subjectCard = payload.share?.cardName || 'Trello card';

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'ShareT <no-reply@localhost>',
      to: process.env.SHARET_NOTIFY_EMAIL_TO,
      subject: `ShareT update: ${subjectCard}`,
      text: buildEmailBody(payload)
    });

    return { sent: true };
  } catch (error) {
    console.error('ShareT email notification failed:', error);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  sendShareTUpdateNotification
};
