const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs').promises;

class UploadService {
  async processFile(filePath, fileType) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, '../workers/fileProcessor.js'), {
        workerData: {
          filePath,
          fileType
        }
      });

      worker.on('message', (result) => {
        resolve(result);
      });

      worker.on('error', (error) => {
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  async validateFile(filePath, allowedTypes) {
    try {
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (fileSize > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      const ext = path.extname(filePath).toLowerCase();
      if (!allowedTypes.includes(ext)) {
        throw new Error(`File type ${ext} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      }

      return true;
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error cleaning up file ${filePath}:`, error.message);
    }
  }

  async getUploadStats() {
    try {
      return {
        message: 'Upload service is operational',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error getting upload stats: ${error.message}`);
    }
  }
}

module.exports = new UploadService();