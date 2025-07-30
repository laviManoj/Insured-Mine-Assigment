const User = require('../models/User');
const UserAccount = require('../models/UserAccount');

class UserService {
  async createUser(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  async getAllUsers(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const users = await User.find({ isActive: true })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
      
      const total = await User.countDocuments({ isActive: true });
      
      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  async getUserById(id) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  async getUserByEmail(email) {
    try {
      return await User.findOne({ email: email.toLowerCase() });
    } catch (error) {
      throw new Error(`Error fetching user by email: ${error.message}`);
    }
  }

  async searchUsersByName(firstName) {
    try {
      return await User.find({
        firstName: { $regex: firstName, $options: 'i' },
        isActive: true
      });
    } catch (error) {
      throw new Error(`Error searching users: ${error.message}`);
    }
  }

  async updateUser(id, updateData) {
    try {
      const user = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  async deleteUser(id) {
    try {
      const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  async findOrCreateUser(userData) {
    try {
      let user = await User.findOne({ email: userData.email.toLowerCase() });
      if (!user) {
        user = await this.createUser(userData);
      }
      return user;
    } catch (error) {
      throw new Error(`Error finding or creating user: ${error.message}`);
    }
  }

  async createUserAccount(accountData) {
    try {
      const account = new UserAccount(accountData);
      return await account.save();
    } catch (error) {
      throw new Error(`Error creating user account: ${error.message}`);
    }
  }

  async findOrCreateUserAccount(accountName, userId) {
    try {
      let account = await UserAccount.findOne({ accountName, userId });
      if (!account) {
        account = await this.createUserAccount({ accountName, userId });
      }
      return account;
    } catch (error) {
      throw new Error(`Error finding or creating user account: ${error.message}`);
    }
  }
}

module.exports = new UserService();
