const { parentPort, workerData } = require('worker_threads');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');

// Import models
const Agent = require('../models/Agent');
const User = require('../models/User');
const UserAccount = require('../models/UserAccount');
const PolicyCategory = require('../models/PolicyCategory');
const PolicyCarrier = require('../models/PolicyCarrier');
const Policy = require('../models/Policy');

// Import services
const agentService = require('../services/agentService');
const userService = require('../services/userService');
const policyService = require('../services/policyService');

class FileProcessor {
  constructor() {
    this.connectDB();
  }

  async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/insurance_db', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Worker: MongoDB Connected');
    } catch (error) {
      console.error('Worker: MongoDB connection error:', error);
      process.exit(1);
    }
  }

  async processExcelFile(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      return await this.processData(data);
    } catch (error) {
      throw new Error(`Error processing Excel file: ${error.message}`);
    }
  }

  async processCsvFile(filePath) {
    return new Promise((resolve, reject) => {
      const data = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', async () => {
          try {
            const result = await this.processData(data);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(new Error(`Error processing CSV file: ${error.message}`));
        });
    });
  }

  async processData(data) {
    const results = {
      totalRecords: data.length,
      successfulInserts: 0,
      errors: [],
      summary: {
        agents: 0,
        users: 0,
        userAccounts: 0,
        policyCategories: 0,
        policyCarriers: 0,
        policies: 0
      }
    };

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        await this.processRow(row, results);
        results.successfulInserts++;
      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error.message,
          data: data[i]
        });
      }
    }

    return results;
  }

  async processRow(row, results) {
    try {
      // Process Agent
      let agent = null;
      if (row['Agent Name'] || row['agentName'] || row['agent_name']) {
        const agentName = row['Agent Name'] || row['agentName'] || row['agent_name'];
        agent = await agentService.findOrCreateAgent(agentName);
        if (agent && !results.summary.agentIds?.includes(agent._id.toString())) {
          results.summary.agents++;
          results.summary.agentIds = results.summary.agentIds || [];
          results.summary.agentIds.push(agent._id.toString());
        }
      }

      // Process User
      const userData = {
        firstName: row['User First Name'] || row['firstName'] || row['first_name'] || '',
        lastName: row['User Last Name'] || row['lastName'] || row['last_name'] || '',
        dateOfBirth: this.parseDate(row['DOB'] || row['dateOfBirth'] || row['date_of_birth']),
        address: {
          street: row['Address'] || row['address'] || '',
          state: row['State'] || row['state'] || '',
          zipCode: row['Zip Code'] || row['zipCode'] || row['zip_code'] || ''
        },
        phoneNumber: row['Phone Number'] || row['phoneNumber'] || row['phone_number'] || '',
        state: row['State'] || row['state'] || '',
        zipCode: row['Zip Code'] || row['zipCode'] || row['zip_code'] || '',
        email: row['Email'] || row['email'] || '',
        gender: row['Gender'] || row['gender'] || 'Other',
        userType: row['User Type'] || row['userType'] || row['user_type'] || 'Individual'
      };

      const user = await userService.findOrCreateUser(userData);
      if (user && !results.summary.userIds?.includes(user._id.toString())) {
        results.summary.users++;
        results.summary.userIds = results.summary.userIds || [];
        results.summary.userIds.push(user._id.toString());
      }

      // Process User Account
      let userAccount = null;
      if (row['Account Name'] || row['accountName'] || row['account_name']) {
        const accountName = row['Account Name'] || row['accountName'] || row['account_name'];
        userAccount = await userService.findOrCreateUserAccount(accountName, user._id);
        if (userAccount && !results.summary.accountIds?.includes(userAccount._id.toString())) {
          results.summary.userAccounts++;
          results.summary.accountIds = results.summary.accountIds || [];
          results.summary.accountIds.push(userAccount._id.toString());
        }
      }

      // Process Policy Category
      const categoryName = row['Policy Category Name'] || row['categoryName'] || row['category_name'] || row['Policy Category'];
      const policyCategory = await policyService.findOrCreatePolicyCategory(categoryName);
      if (policyCategory && !results.summary.categoryIds?.includes(policyCategory._id.toString())) {
        results.summary.policyCategories++;
        results.summary.categoryIds = results.summary.categoryIds || [];
        results.summary.categoryIds.push(policyCategory._id.toString());
      }

      // Process Policy Carrier
      const companyName = row['Carrier Company Name'] || row['companyName'] || row['company_name'] || row['Carrier'];
      const policyCarrier = await policyService.findOrCreatePolicyCarrier(companyName);
      if (policyCarrier && !results.summary.carrierIds?.includes(policyCarrier._id.toString())) {
        results.summary.policyCarriers++;
        results.summary.carrierIds = results.summary.carrierIds || [];
        results.summary.carrierIds.push(policyCarrier._id.toString());
      }

      // Process Policy
      const policyData = {
        policyNumber: row['Policy Number'] || row['policyNumber'] || row['policy_number'],
        policyStartDate: this.parseDate(row['Policy Start Date'] || row['policyStartDate'] || row['policy_start_date']),
        policyEndDate: this.parseDate(row['Policy End Date'] || row['policyEndDate'] || row['policy_end_date']),
        userId: user._id,
        categoryId: policyCategory._id,
        carrierId: policyCarrier._id,
        agentId: agent ? agent._id : null,
        collectionId: row['Collection ID'] || row['collectionId'] || row['collection_id'] || '',
        companyCollectionId: row['Company Collection ID'] || row['companyCollectionId'] || row['company_collection_id'] || '',
        premiumAmount: this.parseNumber(row['Premium Amount'] || row['premiumAmount'] || row['premium_amount']),
        coverageAmount: this.parseNumber(row['Coverage Amount'] || row['coverageAmount'] || row['coverage_amount']),
        status: row['Status'] || row['status'] || 'Active',
        paymentFrequency: row['Payment Frequency'] || row['paymentFrequency'] || row['payment_frequency'] || 'Monthly'
      };

      // Check if policy already exists
      const existingPolicy = await Policy.findOne({ policyNumber: policyData.policyNumber });
      if (!existingPolicy) {
        await policyService.createPolicy(policyData);
        results.summary.policies++;
      }

    } catch (error) {
      throw new Error(`Error processing row: ${error.message}`);
    }
  }

  parseDate(dateString) {
    if (!dateString) return new Date();
    
    // Handle various date formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Try parsing MM/DD/YYYY format
      const parts = dateString.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[0] - 1, parts[1]);
      }
      return new Date();
    }
    return date;
  }

  parseNumber(numberString) {
    if (!numberString) return 0;
    
    // Remove currency symbols and commas
    const cleaned = numberString.toString().replace(/[$,]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? 0 : number;
  }
}

// Main worker execution
async function processFile() {
  try {
    const { filePath, fileType } = workerData;
    const processor = new FileProcessor();

    let result;
    if (fileType === 'xlsx' || fileType === 'xls') {
      result = await processor.processExcelFile(filePath);
    } else if (fileType === 'csv') {
      result = await processor.processCsvFile(filePath);
    } else {
      throw new Error('Unsupported file type');
    }

    // Clean up the processed file
    fs.unlinkSync(filePath);

    parentPort.postMessage({
      success: true,
      data: result
    });

  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message
    });
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

processFile();