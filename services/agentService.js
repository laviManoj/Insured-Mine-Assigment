const Agent = require('../models/Agent');

class AgentService {
  async createAgent(agentData) {
    try {
      const agent = new Agent(agentData);
      return await agent.save();
    } catch (error) {
      throw new Error(`Error creating agent: ${error.message}`);
    }
  }

  async getAllAgents(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const agents = await Agent.find({ isActive: true })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
      
      const total = await Agent.countDocuments({ isActive: true });
      
      return {
        agents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching agents: ${error.message}`);
    }
  }

  async getAgentById(id) {
    try {
      const agent = await Agent.findById(id);
      if (!agent) {
        throw new Error('Agent not found');
      }
      return agent;
    } catch (error) {
      throw new Error(`Error fetching agent: ${error.message}`);
    }
  }

  async updateAgent(id, updateData) {
    try {
      const agent = await Agent.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });
      if (!agent) {
        throw new Error('Agent not found');
      }
      return agent;
    } catch (error) {
      throw new Error(`Error updating agent: ${error.message}`);
    }
  }

  async deleteAgent(id) {
    try {
      const agent = await Agent.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!agent) {
        throw new Error('Agent not found');
      }
      return agent;
    } catch (error) {
      throw new Error(`Error deleting agent: ${error.message}`);
    }
  }

  async findOrCreateAgent(agentName) {
    try {
      let agent = await Agent.findOne({ agentName: agentName.trim() });
      if (!agent) {
        agent = await this.createAgent({ agentName: agentName.trim() });
      }
      return agent;
    } catch (error) {
      throw new Error(`Error finding or creating agent: ${error.message}`);
    }
  }
}

module.exports = new AgentService();