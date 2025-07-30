const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// POST /api/upload/xlsx - Upload Excel file
router.post('/xlsx', uploadController.uploadXlsx);

// POST /api/upload/csv - Upload CSV file
router.post('/csv', uploadController.uploadCsv);

// GET /api/upload/status - Get upload service status
router.get('/status', uploadController.getUploadStatus);

module.exports = router;