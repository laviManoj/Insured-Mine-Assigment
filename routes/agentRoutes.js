const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { validateAgent } = require('../middleware/validation');

router.get('/', agentController.getAllAgents);

router.get('/:id', agentController.getAgentById);

router.post('/', validateAgent, agentController.createAgent);

router.put('/:id', validateAgent, agentController.updateAgent);

router.delete('/:id', agentController.deleteAgent);

module.exports = router;