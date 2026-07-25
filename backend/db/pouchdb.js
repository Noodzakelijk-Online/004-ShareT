/**
 * PouchDB Database Layer
 * Platform-agnostic database that works locally and syncs to cloud
 * 
 * Benefits:
 * - No database installation required
 * - Works on Windows, Mac, Linux
 * - Can sync to CouchDB in the cloud
 * - Data persists locally in LevelDB
 * - Offline-first architecture
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Add find plugin for queries
PouchDB.plugin(PouchDBFind);

// Database instances
const databases = {};

// Initialize databases
async function initDatabases(dataDir = './data') {
  const dbNames = ['users', 'trello_connections', 'shared_links', 'access_logs',
                   'email_verifications', 'share_participants', 'comment_threads',
                   'trello_webhooks', 'trello_reply_events',
                   'resource_usage', 'billing', 'resource_pricing', 'shares'];
  
  dbNames.forEach(name => {
    databases[name] = new PouchDB(`${dataDir}/${name}`, { auto_compaction: true });
  });
  
  // Create indexes for efficient queries
  await createIndexes();
  
  return databases;
}

// Create indexes for common queries
async function createIndexes() {
  try {
    // Users index
    await databases.users.createIndex({
      index: { fields: ['email'] }
    });
    
    // Shared links indexes
    await databases.shared_links.createIndex({
      index: { fields: ['userId'] }
    });
    await databases.shared_links.createIndex({
      index: { fields: ['shareId'] }
    });
    
    // Access logs index
    await databases.access_logs.createIndex({
      index: { fields: ['shareId', 'accessedAt'] }
    });

    await databases.email_verifications.createIndex({
      index: { fields: ['shareId', 'email'] }
    });

    await databases.share_participants.createIndex({
      index: { fields: ['shareId', 'email'] }
    });

    await databases.comment_threads.createIndex({
      index: { fields: ['shareId', 'status'] }
    });
    await databases.comment_threads.createIndex({
      index: { fields: ['status'] }
    });

    await databases.comment_threads.createIndex({
      index: { fields: ['cardId', 'status'] }
    });

    await databases.trello_webhooks.createIndex({
      index: { fields: ['userId', 'cardId'] }
    });

    await databases.trello_reply_events.createIndex({
      index: { fields: ['status', 'nextAttemptAt'] }
    });
    
    // Resource usage index
    await databases.resource_usage.createIndex({
      index: { fields: ['userId', 'billingPeriod'] }
    });
    
    // Billing index
    await databases.billing.createIndex({
      index: { fields: ['userId', 'billingPeriod'] }
    });
    
    // Password reset token index
    await databases.users.createIndex({
      index: { fields: ['passwordResetToken'] }
    });

    // Trello connections index
    await databases.trello_connections.createIndex({
      index: { fields: ['userId'] }
    });

    // Shared links indexes
    await databases.shared_links.createIndex({
      index: { fields: ['shareId'] }
    });
    await databases.shared_links.createIndex({
      index: { fields: ['userId'] }
    });
    
    console.log('PouchDB indexes created successfully');
  } catch (err) {
    console.log('Index creation (may already exist):', err.message);
  }
}

// Generate unique ID
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

// Generate share ID (shorter, URL-friendly)
function generateShareId() {
  return crypto.randomBytes(8).toString('base64url');
}

/**
 * User Model Operations
 */
const User = {
  async create(userData) {
    const id = generateId();
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const isAdmin = (userData.email || '').toLowerCase() === 'noodzakelijkonline@gmail.com';
    const user = {
      _id: id,
      type: 'user',
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      name: userData.name || '',
      role: isAdmin ? 'admin' : (userData.role || 'user'),
      credits: isAdmin ? null : 3,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await databases.users.put(user);
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  async findByEmail(email) {
    const result = await databases.users.find({
      selector: { email: email.toLowerCase() }
    });
    return result.docs[0] || null;
  },
  
  async findById(id) {
    try {
      const user = await databases.users.get(id);
      return user;
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  },
  
  async findByIdLean(id) {
    const user = await this.findById(id);
    if (user) {
      const { password: _password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },
  
  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
  
  async updateById(id, updates) {
    const user = await databases.users.get(id);
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await databases.users.put(updatedUser);
    return updatedUser;
  },
  
  async deleteById(id) {
    const user = await databases.users.get(id);
    await databases.users.remove(user);
    return true;
  },

  async findByResetToken(hashedToken) {
    const result = await databases.users.find({
      selector: { passwordResetToken: hashedToken }
    });
    const user = result.docs[0] || null;
    if (!user) return null;
    if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
      return null;
    }
    return user;
  },

  async findAll() {
    const result = await databases.users.allDocs({ include_docs: true });
    return result.rows.map(r => r.doc).filter(d => d && d.type === 'user').map(u => {
      const { password: _password, ...safe } = u;
      return safe;
    });
  },

  async getCredits(id) {
    const user = await this.findById(id);
    if (!user) return 0;
    if (user.role === 'admin' || user.email === 'noodzakelijkonline@gmail.com') return null;
    return typeof user.credits === 'number' ? user.credits : 0;
  },

  async addCredits(id, amount) {
    const user = await databases.users.get(id);
    const current = typeof user.credits === 'number' ? user.credits : 0;
    const updated = { ...user, credits: current + amount, updatedAt: new Date().toISOString() };
    await databases.users.put(updated);
    return updated.credits;
  },

  async deductCredit(id) {
    const user = await databases.users.get(id);
    if (user.role === 'admin' || user.email === 'noodzakelijkonline@gmail.com') return null;
    const current = typeof user.credits === 'number' ? user.credits : 0;
    if (current <= 0) throw new Error('Insufficient credits');
    const updated = { ...user, credits: current - 1, updatedAt: new Date().toISOString() };
    await databases.users.put(updated);
    return updated.credits;
  }
};

/**
 * TrelloConnection Model Operations
 */
const TrelloConnection = {
  async create(data) {
    const id = generateId();
    const connection = {
      _id: id,
      type: 'trello_connection',
      userId: data.userId,
      trelloToken: data.trelloToken,
      trelloMemberId: data.trelloMemberId || null,
      trelloUsername: data.trelloUsername || null,
      trelloFullName: data.trelloFullName || null,
      connectedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await databases.trello_connections.put(connection);
    return connection;
  },
  
  async findByUserId(userId) {
    const result = await databases.trello_connections.find({
      selector: { userId }
    });
    return result.docs[0] || null;
  },
  
  async updateByUserId(userId, updates) {
    const existing = await this.findByUserId(userId);
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await databases.trello_connections.put(updated);
      return updated;
    }
    return null;
  },
  
  async deleteByUserId(userId) {
    const existing = await this.findByUserId(userId);
    if (existing) {
      await databases.trello_connections.remove(existing);
      return true;
    }
    return false;
  }
};

/**
 * SharedLink Model Operations
 */
const SharedLink = {
  async create(data) {
    const id = generateId();
    const shareId = data.shareId || generateShareId();
    
    const link = {
      _id: id,
      type: 'shared_link',
      shareId,
      userId: data.userId,
      cardId: data.cardId,
      cardName: data.cardName,
      boardId: data.boardId,
      boardName: data.boardName,
      permissions: {
        canView: data.permissions?.canView ?? true,
        canComment: data.permissions?.canComment ?? false,
        canUpload: data.permissions?.canUpload ?? false,
        canDownload: data.permissions?.canDownload ?? true,
        canSetDueDate: data.permissions?.canSetDueDate ?? false
      },
      allowedEmails: data.allowedEmails || [],
      password: data.password ? await bcrypt.hash(data.password, 10) : null,
      expiresAt: data.expiresAt || null,
      guestTrelloToken: data.guestTrelloToken || null,
      isActive: true,
      accessCount: 0,
      lastAccessedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await databases.shared_links.put(link);
    return link;
  },
  
  async findByShareId(shareId) {
    const result = await databases.shared_links.find({
      selector: { shareId }
    });
    return result.docs[0] || null;
  },
  
  async findByUserId(userId) {
    const result = await databases.shared_links.find({
      selector: { userId }
    });
    return result.docs;
  },

  // Find an existing active (enabled and not expired) link for a user's card.
  // Used to prevent creating multiple links to the same card.
  async findActiveByUserAndCard(userId, cardId) {
    if (!cardId) return null;
    const result = await databases.shared_links.find({
      selector: { userId, cardId }
    });
    const now = new Date();
    return result.docs.find(doc =>
      doc.isActive !== false &&
      (!doc.expiresAt || new Date(doc.expiresAt) > now)
    ) || null;
  },

  async findById(id) {
    try {
      return await databases.shared_links.get(id);
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  },
  
  async updateById(id, updates) {
    const link = await databases.shared_links.get(id);
    const updated = {
      ...link,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await databases.shared_links.put(updated);
    return updated;
  },
  
  async incrementAccessCount(shareId) {
    const link = await this.findByShareId(shareId);
    if (link) {
      link.accessCount = (link.accessCount || 0) + 1;
      link.lastAccessedAt = new Date().toISOString();
      await databases.shared_links.put(link);
      return link;
    }
    return null;
  },
  
  async deleteById(id) {
    const link = await databases.shared_links.get(id);
    await databases.shared_links.remove(link);
    return true;
  },
  
  async deleteByShareId(shareId) {
    const link = await this.findByShareId(shareId);
    if (link) {
      await databases.shared_links.remove(link);
      return true;
    }
    return false;
  },

  async findAll() {
    const result = await databases.shared_links.allDocs({ include_docs: true });
    return result.rows.map(r => r.doc).filter(d => d && d.shareId);
  }
};

/**
 * AccessLog Model Operations
 */
const AccessLog = {
  async create(data) {
    const id = generateId();
    const log = {
      _id: id,
      type: 'access_log',
      shareId: data.shareId,
      email: data.email || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      action: data.action || 'view',
      accessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    await databases.access_logs.put(log);
    return log;
  },
  
  async findByShareId(shareId, options = {}) {
    const result = await databases.access_logs.find({
      selector: { shareId },
      sort: [{ accessedAt: 'desc' }],
      limit: options.limit || 100
    });
    return result.docs;
  },
  
  async countByShareId(shareId) {
    const result = await databases.access_logs.find({
      selector: { shareId }
    });
    return result.docs.length;
  }
};

/**
 * EmailVerification Model Operations
 */
const EmailVerification = {
  async create(data) {
    const email = data.email.toLowerCase().trim();
    const id = generateId();
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'sharet-verification-development-secret')
      .update(`${data.shareId}:${email}:${code}`)
      .digest('hex');
    
    const verification = {
      _id: id,
      type: 'email_verification',
      shareId: data.shareId,
      email,
      codeHash,
      verified: false,
      attempts: 0,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      createdAt: new Date().toISOString()
    };
    
    await databases.email_verifications.put(verification);
    // The plain code is returned only to the mail delivery call and is never persisted.
    return { ...verification, code };
  },
  
  async findByShareIdAndEmail(shareId, email) {
    const result = await databases.email_verifications.find({
      selector: { shareId, email: email.toLowerCase().trim() },
      limit: 100
    });
    return result.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
  },
  
  async verify(shareId, email, code) {
    const verification = await this.findByShareIdAndEmail(shareId, email);
    if (!verification) return null;
    
    if ((verification.attempts || 0) >= 5) return null;

    const submittedCode = String(code || '').trim();
    const submittedHash = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'sharet-verification-development-secret')
      .update(`${shareId}:${email.toLowerCase().trim()}:${submittedCode}`)
      .digest('hex');
    const storedHash = verification.codeHash ? Buffer.from(verification.codeHash, 'hex') : null;
    const suppliedHash = Buffer.from(submittedHash, 'hex');
    const codeMatches = storedHash
      ? storedHash.length === suppliedHash.length && crypto.timingSafeEqual(storedHash, suppliedHash)
      : verification.code === submittedCode;

    if (codeMatches && new Date(verification.expiresAt) > new Date()) {
      verification.verified = true;
      verification.verifiedAt = new Date().toISOString();
      await databases.email_verifications.put(verification);
      return verification;
    }

    verification.attempts = (verification.attempts || 0) + 1;
    await databases.email_verifications.put(verification);
    return null;
  },
  
  async isVerified(shareId, email) {
    const verification = await this.findByShareIdAndEmail(shareId, email);
    return verification?.verified === true;
  }
};

function hashParticipantToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function publicParticipant(participant) {
  return {
    id: participant._id,
    shareId: participant.shareId,
    name: participant.name,
    email: participant.email,
    notificationEnabled: participant.notificationEnabled !== false,
    verifiedAt: participant.verifiedAt,
    lastSeenAt: participant.lastSeenAt,
    sessionExpiresAt: participant.sessionExpiresAt || null
  };
}

/**
 * Verified external identities for a ShareT link. Raw browser tokens are never
 * stored; a participant may keep up to five verified browser sessions.
 */
const ShareParticipant = {
  async createVerified({ shareId, email, name }) {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const result = await databases.share_participants.find({
      selector: { shareId, email: normalizedEmail },
      limit: 10
    });
    const existing = result.docs[0] || null;
    const accessToken = crypto.randomBytes(32).toString('base64url');
    const accessTokenHash = hashParticipantToken(accessToken);
    const now = new Date().toISOString();
    const requestedDays = Number(process.env.SHARET_PARTICIPANT_SESSION_DAYS || 90);
    const sessionDays = Number.isFinite(requestedDays) ? Math.min(365, Math.max(1, requestedDays)) : 90;
    const sessionExpiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000).toISOString();

    const participant = existing
      ? {
          ...existing,
          name: normalizedName,
          accessTokenHashes: [accessTokenHash, ...(existing.accessTokenHashes || [])]
            .filter((value, index, all) => all.indexOf(value) === index)
            .slice(0, 5),
          notificationEnabled: true,
          verifiedAt: now,
          sessionExpiresAt,
          lastSeenAt: now,
          updatedAt: now
        }
      : {
          _id: generateId(),
          type: 'share_participant',
          shareId,
          email: normalizedEmail,
          name: normalizedName,
          accessTokenHashes: [accessTokenHash],
          notificationEnabled: true,
          verifiedAt: now,
          sessionExpiresAt,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now
        };

    const writeResult = await databases.share_participants.put(participant);
    participant._rev = writeResult.rev;
    return { participant: publicParticipant(participant), accessToken };
  },

  async findByAccessToken(shareId, accessToken) {
    if (!accessToken) return null;
    const tokenHash = hashParticipantToken(accessToken);
    const result = await databases.share_participants.find({
      selector: { shareId },
      limit: 1000
    });
    return result.docs.find(participant =>
      (!participant.sessionExpiresAt || new Date(participant.sessionExpiresAt) > new Date()) &&
      Array.isArray(participant.accessTokenHashes) && participant.accessTokenHashes.includes(tokenHash)
    ) || null;
  },

  async touch(participant) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const current = await databases.share_participants.get(participant._id);
      const now = new Date().toISOString();
      const updated = { ...current, lastSeenAt: now, updatedAt: now };
      try {
        await databases.share_participants.put(updated);
        return publicParticipant(updated);
      } catch (error) {
        if (error.status !== 409 || attempt === 1) throw error;
      }
    }
    return publicParticipant(participant);
  },

  toPublic: publicParticipant
};

/** Each freelancer comment remains pending until a safely matched owner reply. */
const CommentThread = {
  async create({ shareId, cardId, trelloCommentId, participant, commentText, commentDate }) {
    const id = `reply_thread_${trelloCommentId}`;
    try {
      return await databases.comment_threads.get(id);
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    const thread = {
      _id: id,
      type: 'comment_thread',
      shareId,
      cardId,
      trelloCommentId,
      participantId: participant._id,
      participantEmail: participant.email,
      participantName: participant.name,
      commentText,
      commentDate: commentDate || new Date().toISOString(),
      status: 'awaiting_reply',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const writeResult = await databases.comment_threads.put(thread);
    thread._rev = writeResult.rev;
    return thread;
  },

  async findPendingByShareId(shareId) {
    const result = await databases.comment_threads.find({
      selector: { shareId, status: 'awaiting_reply' },
      limit: 1000
    });
    return result.docs;
  },

  async findAllPending() {
    const result = await databases.comment_threads.find({
      selector: { status: 'awaiting_reply' },
      limit: 10000
    });
    return result.docs;
  },

  async findPendingByCardId(cardId) {
    const result = await databases.comment_threads.find({
      selector: { cardId, status: 'awaiting_reply' },
      limit: 10000
    });
    return result.docs;
  },

  async findByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const result = await databases.comment_threads.allDocs({ keys: ids, include_docs: true });
    return result.rows.map(row => row.doc).filter(Boolean);
  },

  async markNotified(thread, reply) {
    // Hydrated service-only context may include Trello credentials; never copy
    // that transient data into the durable public-conversation record.
    const { share: _share, connection: _connection, ...storedThread } = thread;
    const updated = {
      ...storedThread,
      status: 'reply_notified',
      replyActionId: reply.id,
      replyDate: reply.date,
      notifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await databases.comment_threads.put(updated);
    return updated;
  }
};

const TrelloWebhook = {
  async findByUserAndCard(userId, cardId) {
    const result = await databases.trello_webhooks.find({
      selector: { userId, cardId },
      limit: 10
    });
    return result.docs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null;
  },

  async upsert({ userId, cardId, webhookId, callbackUrl, active = true, lastError = null }) {
    const existing = await this.findByUserAndCard(userId, cardId);
    const now = new Date().toISOString();
    const webhook = existing
      ? {
          ...existing,
          webhookId: webhookId || existing.webhookId,
          callbackUrl,
          active,
          lastError,
          updatedAt: now
        }
      : {
          _id: `trello_webhook_${userId}_${cardId}`,
          type: 'trello_webhook',
          userId,
          cardId,
          webhookId: webhookId || null,
          callbackUrl,
          active,
          lastError,
          createdAt: now,
          updatedAt: now
        };
    const result = await databases.trello_webhooks.put(webhook);
    webhook._rev = result.rev;
    return webhook;
  },

  async findAll() {
    const result = await databases.trello_webhooks.allDocs({ include_docs: true });
    return result.rows.map(row => row.doc).filter(doc => doc?.type === 'trello_webhook');
  }
};

function compactTrelloAction(action, cardId) {
  return {
    id: action.id,
    type: action.type,
    date: action.date,
    cardId: cardId || action.data?.card?.id || null,
    text: action.data?.text || '',
    memberCreator: action.memberCreator
      ? {
          id: action.memberCreator.id || null,
          username: action.memberCreator.username || null,
          fullName: action.memberCreator.fullName || null
        }
      : null
  };
}

/** Durable, idempotent ledger for Trello owner-comment delivery decisions. */
const ReplyEvent = {
  async createOrGet(action, cardId, source = 'webhook') {
    const id = `trello_reply_event_${action.id}`;
    try {
      return await databases.trello_reply_events.get(id);
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    const now = new Date().toISOString();
    const event = {
      _id: id,
      type: 'trello_reply_event',
      trelloActionId: action.id,
      cardId: cardId || action.data?.card?.id || null,
      action: compactTrelloAction(action, cardId),
      source,
      status: 'received',
      attempts: 0,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now
    };

    try {
      const result = await databases.trello_reply_events.put(event);
      event._rev = result.rev;
      return event;
    } catch (error) {
      if (error.status === 409) return databases.trello_reply_events.get(id);
      throw error;
    }
  },

  async findById(id) {
    try {
      return await databases.trello_reply_events.get(id);
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  },

  async claim(id, { allowAmbiguous = false } = {}) {
    const event = await this.findById(id);
    if (!event) return null;
    if (['completed', 'ignored'].includes(event.status)) return null;
    if (event.status === 'ambiguous' && !allowAmbiguous) return null;

    const leaseUntil = event.processingLeaseUntil ? new Date(event.processingLeaseUntil).getTime() : 0;
    if (event.status === 'processing' && leaseUntil > Date.now()) return null;
    if (event.nextAttemptAt && new Date(event.nextAttemptAt).getTime() > Date.now()) return null;

    const now = new Date().toISOString();
    const claimed = {
      ...event,
      status: 'processing',
      attempts: (event.attempts || 0) + 1,
      processingLeaseUntil: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      updatedAt: now
    };
    try {
      const result = await databases.trello_reply_events.put(claimed);
      claimed._rev = result.rev;
      return claimed;
    } catch (error) {
      if (error.status === 409) return null;
      throw error;
    }
  },

  async update(id, updates) {
    const event = await databases.trello_reply_events.get(id);
    const updated = {
      ...event,
      ...updates,
      processingLeaseUntil: null,
      updatedAt: new Date().toISOString()
    };
    const result = await databases.trello_reply_events.put(updated);
    updated._rev = result.rev;
    return updated;
  },

  markAmbiguous(id, candidates, context = {}) {
    return this.update(id, {
      status: 'ambiguous',
      candidates,
      ...context,
      ambiguousAt: new Date().toISOString()
    });
  },

  async markEmailSent(id, details = {}) {
    const event = await databases.trello_reply_events.get(id);
    const updated = {
      ...event,
      ...details,
      status: 'processing',
      deliverySentAt: new Date().toISOString(),
      processingLeaseUntil: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await databases.trello_reply_events.put(updated);
    updated._rev = result.rev;
    return updated;
  },

  markCompleted(id, details = {}) {
    return this.update(id, {
      status: 'completed',
      ...details,
      completedAt: new Date().toISOString(),
      lastError: null,
      nextAttemptAt: null
    });
  },

  markIgnored(id, reason) {
    return this.update(id, {
      status: 'ignored',
      ignoredReason: reason,
      ignoredAt: new Date().toISOString(),
      nextAttemptAt: null
    });
  },

  markFailed(id, error) {
    return this.findById(id).then(event => {
      const attempts = event?.attempts || 1;
      const delayMs = Math.min(60 * 60 * 1000, 30 * 1000 * (2 ** Math.min(attempts - 1, 7)));
      return this.update(id, {
        status: 'failed',
        lastError: String(error?.message || error || 'Reply delivery failed').slice(0, 500),
        nextAttemptAt: new Date(Date.now() + delayMs).toISOString()
      });
    });
  },

  async findActionable() {
    const result = await databases.trello_reply_events.allDocs({ include_docs: true });
    const now = Date.now();
    return result.rows
      .map(row => row.doc)
      .filter(event => event?.type === 'trello_reply_event')
      .filter(event => ['received', 'failed', 'processing'].includes(event.status))
      .filter(event => !event.nextAttemptAt || new Date(event.nextAttemptAt).getTime() <= now)
      .filter(event => event.status !== 'processing' || new Date(event.processingLeaseUntil || 0).getTime() <= now);
  },

  async findAmbiguous(limit = 50) {
    const result = await databases.trello_reply_events.allDocs({ include_docs: true });
    return result.rows
      .map(row => row.doc)
      .filter(event => event?.type === 'trello_reply_event' && event.status === 'ambiguous')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }
};

/**
 * ResourceUsage Model Operations
 */
const ResourceUsage = {
  async create(data) {
    const id = generateId();
    const usage = {
      _id: id,
      type: 'resource_usage',
      userId: data.userId,
      shareId: data.shareId || null,
      resourceType: data.resourceType,
      amount: data.amount,
      unit: data.unit,
      cost: data.cost || 0,
      billingPeriod: data.billingPeriod || new Date().toISOString().slice(0, 7),
      metadata: data.metadata || {},
      createdAt: new Date().toISOString()
    };
    
    await databases.resource_usage.put(usage);
    return usage;
  },
  
  async findByUserId(userId, options = {}) {
    const selector = { userId };
    if (options.billingPeriod) {
      selector.billingPeriod = options.billingPeriod;
    }
    
    const result = await databases.resource_usage.find({
      selector,
      limit: options.limit || 1000
    });
    return result.docs;
  },
  
  async getUsageSummary(userId, billingPeriod) {
    const usages = await this.findByUserId(userId, { billingPeriod });
    
    const summary = {};
    usages.forEach(usage => {
      if (!summary[usage.resourceType]) {
        summary[usage.resourceType] = { amount: 0, cost: 0 };
      }
      summary[usage.resourceType].amount += usage.amount;
      summary[usage.resourceType].cost += usage.cost;
    });
    
    return summary;
  }
};

/**
 * Billing Model Operations
 */
const Billing = {
  async create(data) {
    const id = generateId();
    const billing = {
      _id: id,
      type: 'billing',
      userId: data.userId,
      billingPeriod: data.billingPeriod,
      totalCost: data.totalCost || 0,
      status: data.status || 'pending',
      breakdown: data.breakdown || {},
      invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
      dueDate: data.dueDate || null,
      paidAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await databases.billing.put(billing);
    return billing;
  },
  
  async findByUserId(userId) {
    const result = await databases.billing.find({
      selector: { userId }
    });
    return result.docs;
  },
  
  async findByUserIdAndPeriod(userId, billingPeriod) {
    const result = await databases.billing.find({
      selector: { userId, billingPeriod }
    });
    return result.docs[0] || null;
  },
  
  async findById(id) {
    try {
      return await databases.billing.get(id);
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  },
  
  async updateById(id, updates) {
    const billing = await databases.billing.get(id);
    const updated = {
      ...billing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await databases.billing.put(updated);
    return updated;
  }
};

/**
 * ResourcePricing Model Operations
 */
const ResourcePricing = {
  async getOrCreate() {
    const result = await databases.resource_pricing.allDocs({ include_docs: true });
    
    if (result.rows.length > 0) {
      return result.rows[0].doc;
    }
    
    // Create default pricing
    const pricing = {
      _id: 'default_pricing',
      type: 'resource_pricing',
      cpu: { pricePerUnit: 0.0002, unit: 'cpu-second' },
      ram: { pricePerUnit: 0.00002, unit: 'mb-second' },
      bandwidth: { pricePerUnit: 0.002, unit: 'mb' },
      storage: { pricePerUnit: 0.0002, unit: 'gb-hour' },
      electricity: { pricePerUnit: 0.24, unit: 'kwh' },
      multiplier: 2, // Cost = usage × multiplier
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await databases.resource_pricing.put(pricing);
    return pricing;
  },
  
  async update(updates) {
    const pricing = await this.getOrCreate();
    const updated = {
      ...pricing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await databases.resource_pricing.put(updated);
    return updated;
  }
};

/**
 * Sync to CouchDB (optional cloud sync)
 */
async function setupSync(remoteUrl, options = {}) {
  if (!remoteUrl) {
    console.log('No remote CouchDB URL provided, running in local-only mode');
    return null;
  }
  
  const syncHandlers = {};
  
  Object.keys(databases).forEach(dbName => {
    const remoteDb = new PouchDB(`${remoteUrl}/${dbName}`, {
      auth: options.auth
    });
    
    const sync = databases[dbName].sync(remoteDb, {
      live: true,
      retry: true
    });
    
    sync.on('change', info => {
      console.log(`Sync change for ${dbName}:`, info.direction);
    });
    
    sync.on('error', err => {
      console.error(`Sync error for ${dbName}:`, err);
    });
    
    syncHandlers[dbName] = sync;
  });
  
  console.log('Cloud sync enabled with:', remoteUrl);
  return syncHandlers;
}

/**
 * Close all databases
 */
async function closeAll() {
  for (const db of Object.values(databases)) {
    await db.close();
  }
  console.log('All PouchDB databases closed');
}

/**
 * Get database stats
 */
async function getStats() {
  const stats = {};
  for (const [name, db] of Object.entries(databases)) {
    const info = await db.info();
    stats[name] = {
      docCount: info.doc_count,
      updateSeq: info.update_seq,
      diskSize: info.disk_size
    };
  }
  return stats;
}

module.exports = {
  initDatabases,
  setupSync,
  closeAll,
  getStats,
  databases,
  generateId,
  generateShareId,
  // Models
  User,
  TrelloConnection,
  SharedLink,
  AccessLog,
  EmailVerification,
  ShareParticipant,
  CommentThread,
  TrelloWebhook,
  ReplyEvent,
  ResourceUsage,
  Billing,
  ResourcePricing
};
