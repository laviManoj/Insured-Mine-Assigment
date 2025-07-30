const uploadService = require('../services/uploadService');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

class UploadController {
  constructor() {
    this.uploadMiddleware = upload.single('file');
  }

  async uploadXlsx(req, res, next) {
    this.uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        const filePath = req.file.path;
        const fileType = path.extname(req.file.originalname).slice(1).toLowerCase();

        // Validate file
        await uploadService.validateFile(filePath, ['.xlsx', '.xls']);

        // Process file using worker thread
        const result = await uploadService.processFile(filePath, fileType);

        if (result.success) {
          res.status(200).json({
            success: true,
            message: 'Excel file processed successfully',
            data: result.data
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'File processing failed',
            error: result.error
          });
        }

      } catch (error) {
        // Clean up file if error occurs
        if (req.file) {
          await uploadService.cleanupFile(req.file.path);
        }
        next(error);
      }
    });
  }

  async uploadCsv(req, res, next) {
    this.uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        const filePath = req.file.path;
        const fileType = 'csv';

        // Validate file
        await uploadService.validateFile(filePath, ['.csv']);

        // Process file using worker thread
        const result = await uploadService.processFile(filePath, fileType);

        if (result.success) {
          res.status(200).json({
            success: true,
            message: 'CSV file processed successfully',
            data: result.data
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'File processing failed',
            error: result.error
          });
        }

      } catch (error) {
        // Clean up file if error occurs
        if (req.file) {
          await uploadService.cleanupFile(req.file.path);
        }
        next(error);
      }
    });
  }

  async getUploadStatus(req, res, next) {
    try {
      const stats = await uploadService.getUploadStats();
      res.status(200).json({
        success: true,
        message: 'Upload service status retrieved',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UploadController();