const policyService = require('../services/policyService');

class PolicyController {
  async createPolicy(req, res, next) {
    try {
      const policy = await policyService.createPolicy(req.body);
      res.status(201).json({
        success: true,
        message: 'Policy created successfully',
        data: policy
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllPolicies(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await policyService.getAllPolicies(page, limit);
      res.status(200).json({
        success: true,
        message: 'Policies retrieved successfully',
        data: result.policies,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getPolicyById(req, res, next) {
    try {
      const policy = await policyService.getPolicyById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Policy retrieved successfully',
        data: policy
      });
    } catch (error) {
      next(error);
    }
  }

  async searchPoliciesByUsername(req, res, next) {
    try {
      const { username } = req.params;
      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Username parameter is required'
        });
      }

      const policies = await policyService.searchPoliciesByUsername(username);
      res.status(200).json({
        success: true,
        message: `Found ${policies.length} policies for username: ${username}`,
        data: policies
      });
    } catch (error) {
      next(error);
    }
  }

  async getAggregatedPoliciesByUser(req, res, next) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID parameter is required'
        });
      }

      const aggregatedData = await policyService.getAggregatedPoliciesByUser(userId);
      
      if (!aggregatedData) {
        return res.status(404).json({
          success: false,
          message: 'No policies found for this user'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Aggregated policies retrieved successfully',
        data: aggregatedData
      });
    } catch (error) {
      next(error);
    }
  }

  async getPolicyStatistics(req, res, next) {
    try {
      const stats = await policyService.getPolicyStatistics();
      res.status(200).json({
        success: true,
        message: 'Policy statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePolicy(req, res, next) {
    try {
      const policy = await policyService.updatePolicy(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Policy updated successfully',
        data: policy
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePolicy(req, res, next) {
    try {
      await policyService.deletePolicy(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Policy deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PolicyController();