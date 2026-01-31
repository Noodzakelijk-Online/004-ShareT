/**
 * Trello Routes
 * Handles Trello OAuth and API interactions
 */

const express = require('express');
const router = express.Router();
const trelloController = require('../controllers/trelloController');
const { protect } = require('../middleware/auth');

// OAuth routes
router.get('/auth-url', protect, trelloController.getAuthUrl);
router.get('/callback', trelloController.handleCallback);
router.post('/disconnect', protect, trelloController.disconnect);

// Status
router.get('/status', protect, trelloController.getStatus);

// Boards
router.get('/boards', protect, trelloController.getBoards);
router.get('/boards/:boardId', protect, trelloController.getBoard);
router.get('/boards/:boardId/cards', protect, trelloController.getBoardCards);
router.get('/boards/:boardId/lists', protect, trelloController.getBoardLists);

// Cards
router.get('/cards/:cardId', protect, trelloController.getCard);
router.get('/cards/:cardId/attachments', protect, trelloController.getCardAttachments);
router.get('/cards/:cardId/comments', protect, trelloController.getCardComments);

// Card actions (for shared access)
router.post('/cards/:cardId/comments', protect, trelloController.addComment);
router.put('/cards/:cardId/due', protect, trelloController.setDueDate);

module.exports = router;
