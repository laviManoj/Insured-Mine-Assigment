const Policy = require('../models/Policy');
const PolicyCategory = require('../models/PolicyCategory');
const PolicyCarrier = require('../models/PolicyCarrier');
const User = require('../models/User');
const mongoose = require('mongoose');

class PolicyService {
  async createPolicy(policyData) {
    try {
      const policy = new Policy(policyData);
      return await policy.save();
    } catch (error) {
      throw new Error(`Error creating policy: ${error.message}`);
    }
  }

  async getAllPolicies(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const policies = await Policy.find({ isActive: true })
        .populate('userId', 'firstName lastName email')
        .populate('categoryId', 'categoryName')
        .populate('carrierId', 'companyName')
        .populate('agentId', 'agentName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
      
      const total = await Policy.countDocuments({ isActive: true });
      
      return {
        policies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching policies: ${error.message}`);
    }
  }

  async getPolicyById(id) {
    try {
      const policy = await Policy.findById(id)
        .populate('userId', 'firstName lastName email phoneNumber')
        .populate('categoryId', 'categoryName description')
        .populate('carrierId', 'companyName contactInfo')
        .populate('agentId', 'agentName email phone');
      
      if (!policy) {
        throw new Error('Policy not found');
      }
      return policy;
    } catch (error) {
      throw new Error(`Error fetching policy: ${error.message}`);
    }
  }

  async searchPoliciesByUsername(username) {
    try {
      const users = await User.find({
        $or: [
          { firstName: { $regex: username, $options: 'i' } },
          { lastName: { $regex: username, $options: 'i' } },
          { email: { $regex: username, $options: 'i' } }
        ],
        isActive: true
      });

      if (users.length === 0) {
        return [];
      }

      const userIds = users.map(user => user._id);
      
      const policies = await Policy.find({
        userId: { $in: userIds },
        isActive: true
      })
        .populate('userId', 'firstName lastName email phoneNumber')
        .populate('categoryId', 'categoryName')
        .populate('carrierId', 'companyName')
        .populate('agentId', 'agentName')
        .sort({ createdAt: -1 });

      return policies;
    } catch (error) {
      throw new Error(`Error searching policies by username: ${error.message}`);
    }
  }

  async getAggregatedPoliciesByUser(userId) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      
      const aggregation = await Policy.aggregate([
        {
          $match: {
            userId: userObjectId,
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'policycategories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $lookup: {
            from: 'policycarriers',
            localField: 'carrierId',
            foreignField: '_id',
            as: 'carrier'
          }
        },
        {
          $lookup: {
            from: 'agents',
            localField: 'agentId',
            foreignField: '_id',
            as: 'agent'
          }
        },
        {
          $group: {
            _id: '$userId',
            user: { $first: { $arrayElemAt: ['$user', 0] } },
            totalPolicies: { $sum: 1 },
            activePolicies: {
              $sum: {
                $cond: [{ $eq: ['$status', 'Active'] }, 1, 0]
              }
            },
            totalPremium: { $sum: '$premiumAmount' },
            totalCoverage: { $sum: '$coverageAmount' },
            policies: {
              $push: {
                policyNumber: '$policyNumber',
                status: '$status',
                premiumAmount: '$premiumAmount',
                coverageAmount: '$coverageAmount',
                policyStartDate: '$policyStartDate',
                policyEndDate: '$policyEndDate',
                category: { $arrayElemAt: ['$category.categoryName', 0] },
                carrier: { $arrayElemAt: ['$carrier.companyName', 0] },
                agent: { $arrayElemAt: ['$agent.agentName', 0] }
              }
            },
            categoriesCount: {
              $addToSet: '$categoryId'
            },
            carriersCount: {
              $addToSet: '$carrierId'
            }
          }
        },
        {
          $project: {
            user: {
              firstName: '$user.firstName',
              lastName: '$user.lastName',
              email: '$user.email',
              phoneNumber: '$user.phoneNumber'
            },
            totalPolicies: 1,
            activePolicies: 1,
            totalPremium: { $round: ['$totalPremium', 2] },
            totalCoverage: { $round: ['$totalCoverage', 2] },
            uniqueCategories: { $size: '$categoriesCount' },
            uniqueCarriers: { $size: '$carriersCount' },
            policies: 1
          }
        }
      ]);

      return aggregation[0] || null;
    } catch (error) {
      throw new Error(`Error getting aggregated policies: ${error.message}`);
    }
  }

  async findOrCreatePolicyCategory(categoryName) {
    try {
      let category = await PolicyCategory.findOne({ categoryName: categoryName.trim() });
      if (!category) {
        category = new PolicyCategory({ categoryName: categoryName.trim() });
        await category.save();
      }
      return category;
    } catch (error) {
      throw new Error(`Error finding or creating policy category: ${error.message}`);
    }
  }

  async findOrCreatePolicyCarrier(companyName) {
    try {
      let carrier = await PolicyCarrier.findOne({ companyName: companyName.trim() });
      if (!carrier) {
        carrier = new PolicyCarrier({ companyName: companyName.trim() });
        await carrier.save();
      }
      return carrier;
    } catch (error) {
      throw new Error(`Error finding or creating policy carrier: ${error.message}`);
    }
  }

  async updatePolicy(id, updateData) {
    try {
      const policy = await Policy.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });
      if (!policy) {
        throw new Error('Policy not found');
      }
      return policy;
    } catch (error) {
      throw new Error(`Error updating policy: ${error.message}`);
    }
  }

  async deletePolicy(id) {
    try {
      const policy = await Policy.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!policy) {
        throw new Error('Policy not found');
      }
      return policy;
    } catch (error) {
      throw new Error(`Error deleting policy: ${error.message}`);
    }
  }

  async getPolicyStatistics() {
    try {
      const stats = await Policy.aggregate([
        {
          $group: {
            _id: null,
            totalPolicies: { $sum: 1 },
            activePolicies: {
              $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
            },
            totalPremium: { $sum: '$premiumAmount' },
            totalCoverage: { $sum: '$coverageAmount' },
            avgPremium: { $avg: '$premiumAmount' },
            avgCoverage: { $avg: '$coverageAmount' }
          }
        }
      ]);

      return stats[0] || {
        totalPolicies: 0,
        activePolicies: 0,
        totalPremium: 0,
        totalCoverage: 0,
        avgPremium: 0,
        avgCoverage: 0
      };
    } catch (error) {
      throw new Error(`Error getting policy statistics: ${error.message}`);
    }
  }
}

module.exports = new PolicyService();