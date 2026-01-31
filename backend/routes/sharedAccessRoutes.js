/**
 * Shared Access Routes
 * Handles public access to shared cards (no auth required)
 */

const express = require('express');
const router = express.Router();
const sharedAccessController = require('../controllers/sharedAccessController');

// Public routes - no authentication required
router.get('/:shareId', sharedAccessController.getSharedCard);
router.post('/:shareId/verify-email', sharedAccessController.verifyEmail);
router.get('/:shareId/attachments', sharedAccessController.getAttachments);
router.get('/:shareId/attachments/:attachmentId/download', sharedAccessController.downloadAttachment);
router.post('/:shareId/attachments', sharedAccessController.uploadAttachment);
router.post('/:shareId/comments', sharedAccessController.addComment);
router.put('/:shareId/due-date', sharedAccessController.setDueDate);

module.exports = router;
