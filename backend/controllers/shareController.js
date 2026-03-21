/**
 * Share Controller
 * Handles creation and management of shareable card links
 * Uses PouchDB for platform-agnostic data storage
 */

const { SharedLink, AccessLog, generateShareId } = require('../db/pouchdb');

// Get all shares for user
exports.getShares = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const shares = await SharedLink.findByUserId(userId);

    // Sort by createdAt descending
    shares.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const paginatedShares = shares.slice(skip, skip + limit);

    res.json({
      success: true,
      data: paginatedShares,
      pagination: {
        total: shares.length,
        page,
        limit,
        pages: Math.ceil(shares.length / limit)
      }
    });
  } catch (error) {
    console.error('Get shares error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shares'
    });
  }
};

// Create new share
exports.createShare = async (req, res) => {
  try {
    const { cardId, cardName, boardId, boardName, permissions, allowedEmails, expiresAt } = req.body;
    const userId = req.user._id || req.user.id;

    const share = await SharedLink.create({
      userId,
      cardId,
      cardName,
      boardId,
      boardName,
      permissions: permissions || {
        canView: true,
        canComment: false,
        canUpload: false,
        canDownload: true,
        canSetDueDate: false
      },
      allowedEmails: allowedEmails || [],
      expiresAt: expiresAt || null
    });

    res.status(201).json({
      success: true,
      data: share
    });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating share'
    });
  }
};

// Get single share
exports.getShare = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const share = await SharedLink.findById(req.params.shareId);

    if (!share || share.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    res.json({
      success: true,
      data: share
    });
  } catch (error) {
    console.error('Get share error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching share'
    });
  }
};

// Update share
exports.updateShare = async (req, res) => {
  try {
    const { permissions, allowedEmails, expiresAt, isActive } = req.body;
    const userId = req.user._id || req.user.id;

    const share = await SharedLink.findById(req.params.shareId);

    if (!share || share.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    const updates = {};
    if (permissions !== undefined) updates.permissions = permissions;
    if (allowedEmails !== undefined) updates.allowedEmails = allowedEmails;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt;
    if (isActive !== undefined) updates.isActive = isActive;

    const updatedShare = await SharedLink.updateById(req.params.shareId, updates);

    res.json({
      success: true,
      data: updatedShare
    });
  } catch (error) {
    console.error('Update share error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating share'
    });
  }
};

// Delete share
exports.deleteShare = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const share = await SharedLink.findById(req.params.shareId);

    if (!share || share.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    await SharedLink.deleteById(req.params.shareId);

    res.json({
      success: true,
      message: 'Share deleted'
    });
  } catch (error) {
    console.error('Delete share error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting share'
    });
  }
};

// Toggle active status
exports.toggleActive = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const share = await SharedLink.findById(req.params.shareId);

    if (!share || share.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    const updatedShare = await SharedLink.updateById(req.params.shareId, {
      isActive: !share.isActive
    });

    res.json({
      success: true,
      data: updatedShare
    });
  } catch (error) {
    console.error('Toggle active error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling share status'
    });
  }
};

// Get share statistics
exports.getShareStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const share = await SharedLink.findById(req.params.shareId);

    if (!share || share.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    res.json({
      success: true,
      data: {
        accessCount: share.accessCount || 0,
        lastAccessedAt: share.lastAccessedAt,
        createdAt: share.createdAt
      }
    });
  } catch (error) {
    console.error('Get share stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
};
