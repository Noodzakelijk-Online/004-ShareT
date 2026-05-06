/**
 * Shared Access Controller
 * Handles public access to shared cards (no auth required)
 * Uses PouchDB for platform-agnostic data storage
 * 
 * Fixes applied:
 * - #7: Multiple checklists support
 * - #10: Member visibility
 * - #11: Real attachment upload via multer
 * - #12: Exact ISO timestamps for comments
 * - #13: Full action history loading
 * - #14: Card-level links
 * - #15: Chronological attachment order
 * - #16: Full comment formatting (markdown passthrough)
 * - #17: Identity handling — no more [Via ShareT] prefix
 */

const { SharedLink, TrelloConnection, AccessLog, EmailVerification } = require('../db/pouchdb');
const multer = require('multer');
const FormData = require('form-data');

const TRELLO_API_BASE = 'https://api.trello.com/1';

// Configure multer for memory storage (files stay in RAM, sent directly to Trello)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Helper function to fetch JSON
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Helper: validate share and get Trello connection
async function getShareAndConnection(shareId) {
  const share = await SharedLink.findByShareId(shareId);
  if (!share) return { error: 'Share not found', status: 404 };
  if (!share.isActive) return { error: 'This share link is no longer active', status: 403 };
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    return { error: 'This share link has expired', status: 403 };
  }

  const connection = await TrelloConnection.findByUserId(share.userId);
  if (!connection) return { error: 'Owner not connected to Trello', status: 500 };

  return { share, connection };
}

// Get shared card (public access)
exports.getSharedCard = async (req, res) => {
  try {
    const share = await SharedLink.findByShareId(req.params.shareId);

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    if (!share.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This share link is no longer active'
      });
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'This share link has expired'
      });
    }

    // Update access count
    await SharedLink.incrementAccessCount(req.params.shareId);

    // Log access
    await AccessLog.create({
      shareId: req.params.shareId,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      action: 'view'
    });

    // Get Trello connection for the share owner
    const connection = await TrelloConnection.findByUserId(share.userId);
    if (!connection) {
      return res.status(500).json({
        success: false,
        message: 'Unable to fetch card data - owner not connected to Trello'
      });
    }

    // Fix #10: Include members with avatars; Fix #7: Include checklists; Fix #5: Include pluginData
    const url = `${TRELLO_API_BASE}/cards/${share.cardId}?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&attachments=true&members=true&member_fields=fullName,username,avatarUrl&checklists=all&pluginData=true`;
    const card = await fetchJSON(url);

    res.json({
      success: true,
      linkInfo: {
        trelloCardName: share.cardName,
        trelloBoardName: share.boardName,
        requiresEmail: share.allowedEmails && share.allowedEmails.length > 0,
        permissions: share.permissions
      },
      data: {
        card,
        permissions: share.permissions,
        cardName: share.cardName,
        boardName: share.boardName
      }
    });
  } catch (error) {
    console.error('Get shared card error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shared card'
    });
  }
};

// Verify email for access
exports.verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const share = await SharedLink.findByShareId(req.params.shareId);

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    // If no email restrictions, allow access
    if (!share.allowedEmails || share.allowedEmails.length === 0) {
      return res.json({
        success: true,
        verified: true
      });
    }

    // Check if email is allowed
    const isAllowed = share.allowedEmails.map(e => e.toLowerCase()).includes(email.toLowerCase());

    res.json({
      success: true,
      verified: isAllowed
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email'
    });
  }
};

// Request email verification code
exports.requestVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const { shareId } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const share = await SharedLink.findByShareId(shareId);
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    // Check if email is in allowed list
    if (share.allowedEmails && share.allowedEmails.length > 0) {
      if (!share.allowedEmails.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
        return res.status(403).json({
          success: false,
          message: 'Email not authorized'
        });
      }
    }

    // Create verification
    const verification = await EmailVerification.create({ shareId, email });

    // In production, send email
    console.log(`Verification code for ${email}: ${verification.code}`);

    res.json({
      success: true,
      message: 'Verification code sent',
      ...(process.env.NODE_ENV === 'development' && { code: verification.code })
    });
  } catch (error) {
    console.error('Request verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification'
    });
  }
};

// Confirm email verification
exports.confirmVerification = async (req, res) => {
  try {
    const { email, code } = req.body;
    const { shareId } = req.params;

    const verification = await EmailVerification.verify(shareId, email, code);

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code'
      });
    }

    res.json({
      success: true,
      message: 'Email verified'
    });
  } catch (error) {
    console.error('Confirm verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying'
    });
  }
};

// Get attachments — Fix #15: Chronological order
exports.getAttachments = async (req, res) => {
  try {
    const share = await SharedLink.findByShareId(req.params.shareId);

    if (!share || !share.permissions.canDownload) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const connection = await TrelloConnection.findByUserId(share.userId);
    if (!connection) {
      return res.status(500).json({
        success: false,
        message: 'Owner not connected to Trello'
      });
    }

    const url = `${TRELLO_API_BASE}/cards/${share.cardId}/attachments?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}`;
    const attachments = await fetchJSON(url);

    // Fix #15: Sort chronologically (oldest first) to match Trello
    attachments.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: attachments,
      attachments
    });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attachments'
    });
  }
};

// Download attachment — proxy file through backend so non-Trello users can download
exports.downloadAttachment = async (req, res) => {
  try {
    const share = await SharedLink.findByShareId(req.params.shareId);

    if (!share || !share.permissions.canDownload) {
      return res.status(403).json({
        success: false,
        message: 'Download not allowed'
      });
    }

    const connection = await TrelloConnection.findByUserId(share.userId);
    if (!connection) {
      return res.status(500).json({
        success: false,
        message: 'Owner not connected to Trello'
      });
    }

    // Get attachment metadata (includes direct file URL)
    const metaUrl = `${TRELLO_API_BASE}/cards/${share.cardId}/attachments/${req.params.attachmentId}?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}`;
    const attachment = await fetchJSON(metaUrl);

    // Log download
    await AccessLog.create({
      shareId: req.params.shareId,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      action: 'download'
    });

    // Fetch the actual file from Trello using the owner's token as auth header
    const fileResponse = await fetch(attachment.url, {
      headers: {
        'Authorization': `OAuth oauth_consumer_key="${process.env.TRELLO_API_KEY}", oauth_token="${connection.trelloToken}"`
      }
    });

    if (!fileResponse.ok) {
      return res.status(502).json({
        success: false,
        message: 'Failed to fetch file from Trello'
      });
    }

    // Pass content-type and force browser download with filename
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
    const fileName = attachment.name || 'attachment';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    const contentLength = fileResponse.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // Stream file bytes directly to client — no temp storage
    const { Readable } = require('stream');
    Readable.fromWeb(fileResponse.body).pipe(res);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading attachment'
    });
  }
};

// Fix #11: Upload attachment — Real file upload via multer → Trello API
exports.uploadAttachment = [
  upload.single('file'),
  async (req, res) => {
    try {
      const share = await SharedLink.findByShareId(req.params.shareId);

      if (!share || !share.permissions.canUpload) {
        return res.status(403).json({
          success: false,
          message: 'Upload not allowed'
        });
      }

      const connection = await TrelloConnection.findByUserId(share.userId);
      if (!connection) {
        return res.status(500).json({
          success: false,
          message: 'Owner not connected to Trello'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      // Build multipart form data for Trello API
      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
      formData.append('name', req.file.originalname);

      const trelloUrl = `${TRELLO_API_BASE}/cards/${share.cardId}/attachments?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}`;

      const response = await fetch(trelloUrl, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Trello upload failed: ${response.status}`);
      }

      const attachment = await response.json();

      // Log upload
      await AccessLog.create({
        shareId: req.params.shareId,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        action: 'upload'
      });

      res.json({
        success: true,
        data: attachment,
        attachment
      });
    } catch (error) {
      console.error('Upload attachment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading attachment'
      });
    }
  }
];

// Fix #17: Add comment — Clean identity handling, no [Via ShareT] prefix
// Fix #16: Full markdown passthrough for comment formatting
exports.addComment = async (req, res) => {
  try {
    const { text, authorName } = req.body;
    const share = await SharedLink.findByShareId(req.params.shareId);

    if (!share || !share.permissions.canComment) {
      return res.status(403).json({
        success: false,
        message: 'Comments not allowed'
      });
    }

    const connection = await TrelloConnection.findByUserId(share.userId);
    if (!connection) {
      return res.status(500).json({
        success: false,
        message: 'Owner not connected to Trello'
      });
    }

    // Fix #17: Format comment with author name in bold, no system tags
    // Fix #16: Pass markdown text through without stripping
    const commentText = authorName
      ? `**${authorName}**: ${text}`
      : text;
    
    const url = `${TRELLO_API_BASE}/cards/${share.cardId}/actions/comments?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&text=${encodeURIComponent(commentText)}`;
    const response = await fetch(url, { method: 'POST' });
    const comment = await response.json();

    // Log comment
    await AccessLog.create({
      shareId: req.params.shareId,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      action: 'comment'
    });

    res.json({
      success: true,
      data: comment,
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
};

// Set due date
exports.setDueDate = async (req, res) => {
  try {
    const { due } = req.body;
    const share = await SharedLink.findByShareId(req.params.shareId);

    if (!share || !share.permissions.canSetDueDate) {
      return res.status(403).json({
        success: false,
        message: 'Setting due date not allowed'
      });
    }

    const connection = await TrelloConnection.findByUserId(share.userId);
    if (!connection) {
      return res.status(500).json({
        success: false,
        message: 'Owner not connected to Trello'
      });
    }

    const url = `${TRELLO_API_BASE}/cards/${share.cardId}?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&due=${due || 'null'}`;
    const response = await fetch(url, { method: 'PUT' });
    const card = await response.json();

    // Log action
    await AccessLog.create({
      shareId: req.params.shareId,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      action: 'set_due_date'
    });

    res.json({
      success: true,
      data: card,
      card
    });
  } catch (error) {
    console.error('Set due date error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting due date'
    });
  }
};

// Fix #12 & #13: Get comments for shared card with ISO timestamps and full history
exports.getSharedComments = async (req, res) => {
  try {
    const result = await getShareAndConnection(req.params.shareId);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }

    const { share, connection } = result;
    const url = `${TRELLO_API_BASE}/cards/${share.cardId}/actions?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&filter=commentCard&limit=1000`;
    const comments = await fetchJSON(url);

    res.json({ success: true, data: comments, comments });
  } catch (error) {
    console.error('Get shared comments error:', error);
    res.status(500).json({ success: false, message: 'Error fetching comments' });
  }
};

// Fix #13: Get full action history for shared card
exports.getSharedActions = async (req, res) => {
  try {
    const result = await getShareAndConnection(req.params.shareId);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }

    const { share, connection } = result;
    const url = `${TRELLO_API_BASE}/cards/${share.cardId}/actions?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&limit=1000`;
    const actions = await fetchJSON(url);

    res.json({ success: true, data: actions, actions });
  } catch (error) {
    console.error('Get shared actions error:', error);
    res.status(500).json({ success: false, message: 'Error fetching actions' });
  }
};

// Fix #7: Get checklists for shared card
exports.getSharedChecklists = async (req, res) => {
  try {
    const result = await getShareAndConnection(req.params.shareId);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }

    const { share, connection } = result;
    const url = `${TRELLO_API_BASE}/cards/${share.cardId}/checklists?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&checkItem_fields=name,state,pos`;
    const checklists = await fetchJSON(url);

    res.json({ success: true, data: checklists, checklists });
  } catch (error) {
    console.error('Get shared checklists error:', error);
    res.status(500).json({ success: false, message: 'Error fetching checklists' });
  }
};

// Fix #10: Get members for shared card
exports.getSharedMembers = async (req, res) => {
  try {
    const result = await getShareAndConnection(req.params.shareId);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }

    const { share, connection } = result;
    const url = `${TRELLO_API_BASE}/cards/${share.cardId}/members?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&fields=fullName,username,avatarUrl`;
    const members = await fetchJSON(url);

    res.json({ success: true, data: members, members });
  } catch (error) {
    console.error('Get shared members error:', error);
    res.status(500).json({ success: false, message: 'Error fetching members' });
  }
};

// Fix #14: Get card-level links for shared card
exports.getSharedLinks = async (req, res) => {
  try {
    const result = await getShareAndConnection(req.params.shareId);
    if (result.error) {
      return res.status(result.status).json({ success: false, message: result.error });
    }

    const { share, connection } = result;
    const url = `${TRELLO_API_BASE}/cards/${share.cardId}/attachments?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}`;
    const attachments = await fetchJSON(url);

    const links = attachments.filter(a => !a.isUpload).map(a => ({
      id: a.id,
      name: a.name,
      url: a.url,
      date: a.date
    }));

    res.json({ success: true, data: links, links });
  } catch (error) {
    console.error('Get shared links error:', error);
    res.status(500).json({ success: false, message: 'Error fetching links' });
  }
};
