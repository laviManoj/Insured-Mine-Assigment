const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { validateAgent } = require('../middleware/validation');

// GET /api/agents - Get all agents with pagination
router.get('/', agentController.getAllAgents);

// GET /api/agents/:id - Get agent by ID
router.get('/:id', agentController.getAgentById);

// POST /api/agents - Create new agent
router.post('/', validateAgent, agentController.createAgent);

// PUT /api/agents/:id - Update agent
router.put('/:id', validateAgent, agentController.updateAgent);

// DELETE /api/agents/:id - Delete agent (soft delete)
router.delete('/:id', agentController.deleteAgent);

module.exports = router;