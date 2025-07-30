const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser } = require('../middleware/validation');

// GET /api/users - Get all users with pagination
router.get('/', userController.getAllUsers);

// GET /api/users/search - Search users by name
router.get('/search', userController.searchUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// POST /api/users - Create new user
router.post('/', validateUser, userController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', validateUser, userController.updateUser);

// DELETE /api/users/:id - Delete user (soft delete)
router.delete('/:id', userController.deleteUser);

module.exports = router;