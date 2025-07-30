const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const { validatePolicy } = require('../middleware/validation');

router.get('/', policyController.getAllPolicies);

router.get('/statistics', policyController.getPolicyStatistics);

router.get('/search/:username', policyController.searchPoliciesByUsername);

router.get('/user/:userId/aggregated', policyController.getAggregatedPoliciesByUser);

router.get('/:id', policyController.getPolicyById);

router.post('/', validatePolicy, policyController.createPolicy);

router.put('/:id', validatePolicy, policyController.updatePolicy);

router.delete('/:id', policyController.deletePolicy);

module.exports = router;
