const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

router.post('/xlsx', uploadController.uploadXlsx);

router.post('/csv', uploadController.uploadCsv);

router.get('/status', uploadController.getUploadStatus);

module.exports = router;