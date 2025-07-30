const agentService = require('../services/agentService');

class AgentController {
  async createAgent(req, res, next) {
    try {
      const agent = await agentService.createAgent(req.body);
      res.status(201).json({
        success: true,
        message: 'Agent created successfully',
        data: agent
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllAgents(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await agentService.getAllAgents(page, limit);
      res.status(200).json({
        success: true,
        message: 'Agents retrieved successfully',
        data: result.agents,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getAgentById(req, res, next) {
    try {
      const agent = await agentService.getAgentById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Agent retrieved successfully',
        data: agent
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAgent(req, res, next) {
    try {
      const agent = await agentService.updateAgent(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Agent updated successfully',
        data: agent
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAgent(req, res, next) {
    try {
      await agentService.deleteAgent(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Agent deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AgentController();