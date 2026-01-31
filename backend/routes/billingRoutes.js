/**
 * Billing Routes
 * Handles billing, invoices, and payment processing
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const billingController = require('../controllers/billingController');

// All routes require authentication
router.use(protect);

router.get('/', billingController.getUserBilling);
router.get('/period/:period', billingController.getBillingByPeriod);
router.get('/current', billingController.getCurrentBilling);
router.get('/summary', billingController.getBillingSummary);
router.post('/create', billingController.createBilling);
router.put('/:billingId/status', billingController.updateBillingStatus);
router.post('/:billingId/invoice', billingController.generateInvoice);
router.get('/:billingId/invoice/download', billingController.downloadInvoice);
router.post('/:billingId/pay', billingController.processPayment);
router.post('/:billingId/refund', billingController.requestRefund);
router.get('/admin/all', billingController.getAllBillings);

module.exports = router;
