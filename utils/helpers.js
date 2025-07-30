const moment = require('moment');

class Helpers {
  // Format date to a specific format
  static formatDate(date, format = 'YYYY-MM-DD') {
    return moment(date).format(format);
  }

  // Parse date from various formats
  static parseDate(dateString) {
    if (!dateString) return null;
    
    // Try different date formats
    const formats = [
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'YYYY-MM-DD',
      'MM-DD-YYYY',
      'DD-MM-YYYY',
      'YYYY/MM/DD'
    ];

    for (const format of formats) {
      const parsed = moment(dateString, format, true);
      if (parsed.isValid()) {
        return parsed.toDate();
      }
    }

    // Fallback to default parsing
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  // Format currency
  static formatCurrency(amount, currency = 'USD') {
    if (typeof amount !== 'number') return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Parse currency string to number
  static parseCurrency(currencyString) {
    if (!currencyString) return 0;
    
    // Remove currency symbols and commas
    const cleaned = currencyString.toString().replace(/[$,\s]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? 0 : number;
  }

  // Generate unique identifier
  static generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 9);
    return `${prefix}${timestamp}${randomStr}`.toUpperCase();
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number (US format)
  static isValidPhoneNumber(phone) {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  }

  // Format phone number
  static formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phone;
  }

  // Capitalize first letter of each word
  static titleCase(str) {
    if (!str) return '';
    
    return str.toLowerCase().replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  // Deep clone object
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Check if object is empty
  static isEmpty(obj) {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    return Object.keys(obj).length === 0;
  }

  // Remove null and undefined values from object
  static removeNullValues(obj) {
    const result = {};
    for (const key in obj) {
      if (obj[key] !== null && obj[key] !== undefined) {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          const nested = this.removeNullValues(obj[key]);
          if (!this.isEmpty(nested)) {
            result[key] = nested;
          }
        } else {
          result[key] = obj[key];
        }
      }
    }
    return result;
  }

  // Calculate age from date of birth
  static calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Check if policy is currently active
  static isPolicyActive(startDate, endDate, status = 'Active') {
    if (status !== 'Active') return false;
    
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return start <= now && now <= end;
  }

  // Calculate policy duration in days
  static calculatePolicyDuration(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  // Generate policy number
  static generatePolicyNumber(prefix = 'POL', carrierId = '') {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    return `${prefix}${carrierId.slice(0, 3).toUpperCase()}${year}${month}${timestamp}${random}`;
  }

  // Paginate array
  static paginate(array, page = 1, limit = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      data: array.slice(startIndex, endIndex),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: array.length,
        pages: Math.ceil(array.length / limit),
        hasNext: endIndex < array.length,
        hasPrev: startIndex > 0
      }
    };
  }

  // Sort array of objects by property
  static sortByProperty(array, property, direction = 'asc') {
    return array.sort((a, b) => {
      const aVal = a[property];
      const bVal = b[property];
      
      if (direction === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });
  }

  // Group array by property
  static groupBy(array, property) {
    return array.reduce((groups, item) => {
      const key = item[property];
      groups[key] = groups[key] || [];
      groups[key].push(item);
      return groups;
    }, {});
  }

  // Generate random string
  static generateRandomString(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  // Validate MongoDB ObjectId
  static isValidObjectId(id) {
    const mongoose = require('mongoose');
    return mongoose.Types.ObjectId.isValid(id);
  }

  // Create response object
  static createResponse(success, message, data = null, pagination = null) {
    const response = {
      success,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    if (pagination !== null) {
      response.pagination = pagination;
    }

    return response;
  }

  // Log request details
  static logRequest(req) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.method !== 'GET' ? req.body : undefined
    });
  }

  // Sanitize string for database
  static sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  // Convert file size to human readable format
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = Helpers;