const { parentPort, workerData } = require('worker_threads');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

// Create models
const Agent = require("../models/Agent")
const User = require("../models/User")
const UserAccount = require("../models/UserAccount")
const PolicyCategory = require("../models/PolicyCategory")
const PolicyCarrier = require("../models/PolicyCarrier")
const Policy = require("../models/Policy")

class FileProcessor {
  constructor() {
    this.connectDB();
  }

  async connectDB() {
    try {
      const mongoUri = "mongodb+srv://traveller:Manoj123@traveller.ots9ysb.mongodb.net/insurance_db";
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Worker: MongoDB Connected');
    } catch (error) {
      console.error('Worker: MongoDB connection error:', error);
      throw error;
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
      },
      processedIds: {
        agentIds: new Set(),
        userIds: new Set(),
        accountIds: new Set(),
        categoryIds: new Set(),
        carrierIds: new Set()
      }
    };

    console.log(`Processing ${data.length} records...`);

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        await this.processRow(row, results, i + 1);
        results.successfulInserts++;
        
        if ((i + 1) % 10 === 0) {
          console.log(`Processed ${i + 1}/${data.length} records`);
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error.message);
        results.errors.push({
          row: i + 1,
          error: error.message,
          data: data[i]
        });
      }
    }

    // Convert Sets to numbers for final summary
    results.summary.agents = results.processedIds.agentIds.size;
    results.summary.users = results.processedIds.userIds.size;
    results.summary.userAccounts = results.processedIds.accountIds.size;
    results.summary.policyCategories = results.processedIds.categoryIds.size;
    results.summary.policyCarriers = results.processedIds.carrierIds.size;

    console.log('Processing completed:', results.summary);
    return results;
  }

  async processRow(row, results, rowNumber) {
    try {
      // Process Agent
      let agent = null;
      const agentName = row.agent || row.Agent || '';
      if (agentName && agentName.trim()) {
        agent = await this.findOrCreateAgent(agentName.trim());
        if (agent) {
          results.processedIds.agentIds.add(agent._id.toString());
        }
      }

      // Process User - Map your CSV columns to user fields
      const userData = {
        firstName: row.firstname || row.firstName || row.first_name || '',
        lastName: '', // Not in your CSV, can be empty
        dateOfBirth: this.parseDate(row.dob || row.DOB || row.date_of_birth) || new Date('1990-01-01'),
        address: {
          street: row.address || '',
          city: row.city || '',
          state: row.state || '',
          zipCode: row.zip || row.zipCode || '',
        },
        phoneNumber: row.phone || row.phoneNumber || '0000000000',
        state: row.state || 'CA',
        zipCode: row.zip || row.zipCode || '00000',
        email: row.email || `user${rowNumber}@example.com`, // Generate email if missing
        gender: this.normalizeGender(row.gender || 'Other'),
        userType: this.normalizeUserType(row.userType || row.account_type || 'Individual')
      };

      // Validate required fields
      if (!userData.firstName.trim()) {
        userData.firstName = `User${rowNumber}`;
      }
      if (!userData.email.includes('@')) {
        userData.email = `user${rowNumber}@example.com`;
      }

      const user = await this.findOrCreateUser(userData);
      if (user) {
        results.processedIds.userIds.add(user._id.toString());
      }

      // Process User Account
      let userAccount = null;
      const accountName = row.account_name || row.accountName || `${userData.firstName}'s Account`;
      if (accountName && accountName.trim()) {
        userAccount = await this.findOrCreateUserAccount(accountName.trim(), user._id);
        if (userAccount) {
          results.processedIds.accountIds.add(userAccount._id.toString());
        }
      }

      // Process Policy Category
      const categoryName = row.category_name || row.categoryName || row.policy_type || 'General Insurance';
      const policyCategory = await this.findOrCreatePolicyCategory(categoryName);
      if (policyCategory) {
        results.processedIds.categoryIds.add(policyCategory._id.toString());
      }

      // Process Policy Carrier
      const companyName = row.company_name || row.companyName || row.carrier || 'Unknown Carrier';
      const policyCarrier = await this.findOrCreatePolicyCarrier(companyName);
      if (policyCarrier) {
        results.processedIds.carrierIds.add(policyCarrier._id.toString());
      }

      // Process Policy
      const policyData = {
        policyNumber: row.policy_number || row.policyNumber || this.generatePolicyNumber(),
        policyStartDate: this.parseDate(row.policy_start_date || row.policyStartDate) || new Date(),
        policyEndDate: this.parseDate(row.policy_end_date || row.policyEndDate) || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        userId: user._id,
        categoryId: policyCategory._id,
        carrierId: policyCarrier._id,
        agentId: agent ? agent._id : null,
        premiumAmount: this.parseNumber(row.premium_amount || row.premium_amount_written || row.premiumAmount) || 0,
        coverageAmount: this.parseNumber(row.coverage_amount || row.coverageAmount) || 0,
        status: 'Active',
        paymentFrequency: 'Monthly',
        policyType: row.policy_type || '',
        policyMode: row.policy_mode || '',
        producer: row.producer || '',
        csr: row.csr || '',
        primaryApplicantId: row['primary Applicant ID'] || row.primaryApplicantId || '',
        agencyId: row.agency_id || row.agencyId || '',
        hasActiveClientPolicy: this.parseBoolean(row.hasActive || row.ClientPolicy)
      };

      // Check if policy already exists
      const existingPolicy = await Policy.findOne({ policyNumber: policyData.policyNumber });
      if (!existingPolicy) {
        const newPolicy = new Policy(policyData);
        await newPolicy.save();
        results.summary.policies++;
        console.log(`Created policy: ${policyData.policyNumber}`);
      } else {
        console.log(`Policy already exists: ${policyData.policyNumber}`);
      }

    } catch (error) {
      throw new Error(`Error processing row ${rowNumber}: ${error.message}`);
    }
  }

  async findOrCreateAgent(agentName) {
    try {
      let agent = await Agent.findOne({ agentName: agentName });
      if (!agent) {
        agent = new Agent({ agentName: agentName });
        await agent.save();
        console.log(`Created agent: ${agentName}`);
      }
      return agent;
    } catch (error) {
      console.error(`Error with agent ${agentName}:`, error.message);
      return null;
    }
  }

  async findOrCreateUser(userData) {
    try {
      let user = await User.findOne({ email: userData.email.toLowerCase() });
      if (!user) {
        user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.email}`);
      }
      return user;
    } catch (error) {
      console.error(`Error with user ${userData.email}:`, error.message);
      // If validation fails, try with minimal data
      try {
        const minimalUserData = {
          firstName: userData.firstName || 'Unknown',
          dateOfBirth: userData.dateOfBirth || new Date('1990-01-01'),
          phoneNumber: userData.phoneNumber || '0000000000',
          state: userData.state || 'CA',
          zipCode: userData.zipCode || '00000',
          email: userData.email,
          gender: userData.gender || 'Other',
          userType: userData.userType || 'Individual'
        };
        user = new User(minimalUserData);
        await user.save();
        console.log(`Created minimal user: ${userData.email}`);
        return user;
      } catch (retryError) {
        console.error(`Failed to create user ${userData.email}:`, retryError.message);
        return null;
      }
    }
  }

  async findOrCreateUserAccount(accountName, userId) {
    try {
      let account = await UserAccount.findOne({ accountName, userId });
      if (!account) {
        account = new UserAccount({ accountName, userId });
        await account.save();
        console.log(`Created account: ${accountName}`);
      }
      return account;
    } catch (error) {
      console.error(`Error with account ${accountName}:`, error.message);
      return null;
    }
  }

  async findOrCreatePolicyCategory(categoryName) {
    try {
      let category = await PolicyCategory.findOne({ categoryName: categoryName });
      if (!category) {
        category = new PolicyCategory({ categoryName: categoryName });
        await category.save();
        console.log(`Created category: ${categoryName}`);
      }
      return category;
    } catch (error) {
      console.error(`Error with category ${categoryName}:`, error.message);
      return null;
    }
  }

  async findOrCreatePolicyCarrier(companyName) {
    try {
      let carrier = await PolicyCarrier.findOne({ companyName: companyName });
      if (!carrier) {
        carrier = new PolicyCarrier({ companyName: companyName });
        await carrier.save();
        console.log(`Created carrier: ${companyName}`);
      }
      return carrier;
    } catch (error) {
      console.error(`Error with carrier ${companyName}:`, error.message);
      return null;
    }
  }

  parseDate(dateString) {
    if (!dateString) return null;
    
    // Handle various date formats
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try parsing MM/DD/YYYY format
    const parts = dateString.toString().split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1; // Month is 0-indexed
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }

    // Try parsing YYYY-MM-DD format
    const dashParts = dateString.toString().split('-');
    if (dashParts.length === 3) {
      return new Date(dashParts[0], dashParts[1] - 1, dashParts[2]);
    }

    return new Date(); // Fallback to current date
  }

  parseNumber(numberString) {
    if (!numberString) return 0;
    
    // Remove currency symbols and commas
    const cleaned = numberString.toString().replace(/[$,\s]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? 0 : number;
  }

  parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
    }
    return Boolean(value);
  }

  normalizeGender(gender) {
    if (!gender) return 'Other';
    const normalized = gender.toString().toLowerCase();
    if (normalized.includes('male') && !normalized.includes('female')) return 'Male';
    if (normalized.includes('female')) return 'Female';
    return 'Other';
  }

  normalizeUserType(userType) {
    if (!userType) return 'Individual';
    const normalized = userType.toString().toLowerCase();
    if (normalized.includes('business') || normalized.includes('corporate')) return 'Business';
    if (normalized.includes('family')) return 'Family';
    if (normalized.includes('corporate')) return 'Corporate';
    return 'Individual';
  }

  generatePolicyNumber() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `POL${timestamp}${random}`;
  }
}

// Main worker execution
async function processFile() {
  try {
    const { filePath, fileType } = workerData;
    console.log(`Worker started processing: ${filePath} (${fileType})`);
    
    const processor = new FileProcessor();
    
    // Wait for DB connection
    await new Promise(resolve => setTimeout(resolve, 1000));

    let result;
    if (fileType === 'xlsx' || fileType === 'xls') {
      result = await processor.processExcelFile(filePath);
    } else if (fileType === 'csv') {
      result = await processor.processCsvFile(filePath);
    } else {
      throw new Error('Unsupported file type');
    }

    // Clean up the processed file
    try {
      fs.unlinkSync(filePath);
      console.log('File cleaned up successfully');
    } catch (cleanupError) {
      console.warn('Could not clean up file:', cleanupError.message);
    }

    parentPort.postMessage({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Worker error:', error);
    parentPort.postMessage({
      success: false,
      error: error.message,
      stack: error.stack
    });
  } finally {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch (closeError) {
      console.error('Error closing MongoDB connection:', closeError);
    }
    process.exit(0);
  }
}

processFile();