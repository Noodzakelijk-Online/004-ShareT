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

// Attachments
router.get('/:shareId/attachments', sharedAccessController.getAttachments);
router.get('/:shareId/attachments/:attachmentId/download', sharedAccessController.downloadAttachment);
router.post('/:shareId/attachments', sharedAccessController.uploadAttachment);

// Comments & Actions — Fix #12, #13
router.get('/:shareId/comments', sharedAccessController.getSharedComments);
router.get('/:shareId/actions', sharedAccessController.getSharedActions);
router.post('/:shareId/comments', sharedAccessController.addComment);

// Checklists — Fix #7
router.get('/:shareId/checklists', sharedAccessController.getSharedChecklists);

// Members — Fix #10
router.get('/:shareId/members', sharedAccessController.getSharedMembers);

// Links — Fix #14
router.get('/:shareId/links', sharedAccessController.getSharedLinks);

// Due date
router.put('/:shareId/due-date', sharedAccessController.setDueDate);

module.exports = router;
