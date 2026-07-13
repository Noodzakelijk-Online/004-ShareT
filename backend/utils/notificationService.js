/**
 * Optional notification helpers for ShareT.
 *
 * Trello mentions are useful, but operational updates should not depend only on
 * Trello's notification bell. This service sends a direct email when SMTP and a
 * recipient are configured. If not configured, it silently does nothing.
 */

const nodemailer = require('nodemailer');

function getEmailConfig() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true' || port === 465,
    user,
    pass,
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM || user || 'ShareT <no-reply@localhost>'
  };
}

function buildTransport() {
  const config = getEmailConfig();
  const auth = config.user && config.pass
    ? { user: config.user, pass: config.pass }
    : undefined;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth
  });
}

function hasEmailTransport() {
  return Boolean(getEmailConfig().host);
}

function isOwnerEmailEnabled() {
  return Boolean(process.env.SHARET_NOTIFY_EMAIL_TO && hasEmailTransport());
}

function buildEmailBody({ share, authorName, authorEmail, text, trelloCommentUrl, postedBy, bellExpected }) {
  return [
    'A new ShareT update was submitted.',
    '',
    `Card: ${share.cardName || share.cardId}`,
    `Board: ${share.boardName || 'Unknown board'}`,
    `From: ${authorName || 'External ShareT user'}${authorEmail ? ` <${authorEmail}>` : ''}`,
    `Posted to Trello by: ${postedBy || 'unknown'}`,
    `Trello bell expected: ${bellExpected ? 'yes' : 'no'}`,
    trelloCommentUrl ? `Trello card: ${trelloCommentUrl}` : null,
    '',
    'Message:',
    text
  ].filter(Boolean).join('\n');
}

async function sendShareTUpdateNotification(payload) {
  if (!isOwnerEmailEnabled()) return { skipped: true, reason: 'email-not-configured' };

  try {
    const transporter = buildTransport();
    const config = getEmailConfig();
    const subjectCard = payload.share?.cardName || 'Trello card';

    await transporter.sendMail({
      from: config.from,
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

async function sendVerificationCodeEmail({ to, code, share }) {
  if (!hasEmailTransport()) return { skipped: true, reason: 'email-not-configured' };

  try {
    const transporter = buildTransport();
    const config = getEmailConfig();
    const cardName = share.cardName || 'shared Trello card';

    await transporter.sendMail({
      from: config.from,
      to,
      subject: `Your ShareT verification code for ${cardName}`,
      text: [
        'Confirm your email address to follow this ShareT conversation.',
        '',
        `Verification code: ${code}`,
        '',
        'This code expires in 15 minutes.',
        'If you did not request this code, you can ignore this email.'
      ].join('\n')
    });

    return { sent: true };
  } catch (error) {
    console.error('ShareT verification email failed:', error);
    return { sent: false, error: error.message };
  }
}

function buildReplyEmailBody({ thread, threads, reply, share, ownerName, shareUrl }) {
  const originals = Array.isArray(threads) && threads.length > 0 ? threads : [thread];
  const originalSection = originals.length === 1
    ? ['Your comment:', originals[0].commentText]
    : [
        'Your updates:',
        ...originals.flatMap((item, index) => [`${index + 1}. ${item.commentText}`])
      ];
  return [
    `${ownerName || 'The Trello card owner'} replied after your ShareT comment.`,
    '',
    `Card: ${share.cardName || share.cardId}`,
    `Board: ${share.boardName || 'Unknown board'}`,
    '',
    ...originalSection,
    '',
    'Reply:',
    reply?.text || reply?.data?.text || 'A new reply was posted.',
    '',
    `Open the ShareT conversation: ${shareUrl}`
  ].join('\n');
}

async function sendFreelancerReplyNotification({ thread, threads, reply, share, ownerName }) {
  if (!hasEmailTransport()) return { skipped: true, reason: 'email-not-configured' };

  try {
    const transporter = buildTransport();
    const config = getEmailConfig();
    const publicUrl = (process.env.PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:5005')
      .replace(/\/$/, '');
    const shareUrl = `${publicUrl}/shared/${share.shareId}`;

    await transporter.sendMail({
      from: config.from,
      to: thread.participantEmail,
      subject: `New reply on ${share.cardName || 'your ShareT conversation'}`,
      text: buildReplyEmailBody({ thread, threads, reply, share, ownerName, shareUrl })
    });

    return { sent: true };
  } catch (error) {
    console.error('ShareT freelancer reply email failed:', error);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  hasEmailTransport,
  sendShareTUpdateNotification,
  sendVerificationCodeEmail,
  sendFreelancerReplyNotification,
  __test: {
    buildReplyEmailBody,
    getEmailConfig
  }
};
