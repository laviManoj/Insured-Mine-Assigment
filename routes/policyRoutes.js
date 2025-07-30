const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const { validatePolicy } = require('../middleware/validation');

// GET /api/policies - Get all policies with pagination
router.get('/', policyController.getAllPolicies);

// GET /api/policies/statistics - Get policy statistics
router.get('/statistics', policyController.getPolicyStatistics);

// GET /api/policies/search/:username - Search policies by username
router.get('/search/:username', policyController.searchPoliciesByUsername);

// GET /api/policies/user/:userId/aggregated - Get aggregated policies by user
router.get('/user/:userId/aggregated', policyController.getAggregatedPoliciesByUser);

// GET /api/policies/:id - Get policy by ID
router.get('/:id', policyController.getPolicyById);

// POST /api/policies - Create new policy
router.post('/', validatePolicy, policyController.createPolicy);

// PUT /api/policies/:id - Update policy
router.put('/:id', validatePolicy, policyController.updatePolicy);

// DELETE /api/policies/:id - Delete policy (soft delete)
router.delete('/:id', policyController.deletePolicy);

module.exports = router;
