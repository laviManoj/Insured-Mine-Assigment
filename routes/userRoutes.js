const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser } = require('../middleware/validation');

router.get('/', userController.getAllUsers);

router.get('/search', userController.searchUsers);

router.get('/:id', userController.getUserById);

router.post('/', validateUser, userController.createUser);

router.put('/:id', validateUser, userController.updateUser);

router.delete('/:id', userController.deleteUser);

module.exports = router;