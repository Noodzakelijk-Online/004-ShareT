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
function initDatabases(dataDir = './data') {
  const dbNames = ['users', 'trello_connections', 'shared_links', 'access_logs', 
                   'email_verifications', 'resource_usage', 'billing', 'resource_pricing', 'shares'];
  
  dbNames.forEach(name => {
    databases[name] = new PouchDB(`${dataDir}/${name}`, { auto_compaction: true });
  });
  
  // Create indexes for efficient queries
  createIndexes();
  
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
    
    // Resource usage index
    await databases.resource_usage.createIndex({
      index: { fields: ['userId', 'billingPeriod'] }
    });
    
    // Billing index
    await databases.billing.createIndex({
      index: { fields: ['userId', 'billingPeriod'] }
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
    
    const user = {
      _id: id,
      type: 'user',
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      name: userData.name || '',
      role: userData.role || 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await databases.users.put(user);
    const { password, ...userWithoutPassword } = user;
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
      const { password, ...userWithoutPassword } = user;
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
      expiresAt: data.expiresAt || null,
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
    const id = generateId();
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    const verification = {
      _id: id,
      type: 'email_verification',
      shareId: data.shareId,
      email: data.email.toLowerCase(),
      code,
      verified: false,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      createdAt: new Date().toISOString()
    };
    
    await databases.email_verifications.put(verification);
    return verification;
  },
  
  async findByShareIdAndEmail(shareId, email) {
    const result = await databases.email_verifications.find({
      selector: { shareId, email: email.toLowerCase() }
    });
    return result.docs[0] || null;
  },
  
  async verify(shareId, email, code) {
    const verification = await this.findByShareIdAndEmail(shareId, email);
    if (!verification) return null;
    
    if (verification.code === code && new Date(verification.expiresAt) > new Date()) {
      verification.verified = true;
      await databases.email_verifications.put(verification);
      return verification;
    }
    return null;
  },
  
  async isVerified(shareId, email) {
    const verification = await this.findByShareIdAndEmail(shareId, email);
    return verification?.verified === true;
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
  ResourceUsage,
  Billing,
  ResourcePricing
};
