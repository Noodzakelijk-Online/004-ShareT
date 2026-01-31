/**
 * Shared Access Controller
 * Handles public access to shared cards (no auth required)
 * Uses PouchDB for platform-agnostic data storage
 */

const { SharedLink, TrelloConnection, AccessLog, EmailVerification } = require('../db/pouchdb');

const TRELLO_API_BASE = 'https://api.trello.com/1';

// Helper function to fetch JSON
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Helper function to post JSON
async function postJSON(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
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

    const url = `${TRELLO_API_BASE}/cards/${share.cardId}?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&attachments=true`;
    const card = await fetchJSON(url);

    res.json({
      success: true,
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

// Get attachments
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

// Download attachment
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

    const url = `${TRELLO_API_BASE}/cards/${share.cardId}/attachments/${req.params.attachmentId}?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}`;
    const attachment = await fetchJSON(url);

    // Log download
    await AccessLog.create({
      shareId: req.params.shareId,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      action: 'download'
    });

    // Redirect to attachment URL
    res.redirect(attachment.url);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading attachment'
    });
  }
};

// Upload attachment
exports.uploadAttachment = async (req, res) => {
  try {
    const share = await SharedLink.findByShareId(req.params.shareId);

    if (!share || !share.permissions.canUpload) {
      return res.status(403).json({
        success: false,
        message: 'Upload not allowed'
      });
    }

    // Handle file upload logic here
    res.json({
      success: true,
      message: 'Upload endpoint - implement with multer'
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading attachment'
    });
  }
};

// Add comment
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

    const commentText = `[Via ShareT - ${authorName || 'Anonymous'}]: ${text}`;
    
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
