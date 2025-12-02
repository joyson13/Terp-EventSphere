const userService = require('../services/userService');

class UserController {
  // Registration (FR-1)
  async register(req, res) {
    try {
      const { email, password, role, name } = req.body;
      const user = await userService.register({ email, password, role, name });
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          userID: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Login (FR-2)
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await userService.login({ email, password });
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  // Get Profile (FR-3)
  async getProfile(req, res) {
    try {
      const user = await userService.getProfile(req.user.userID);
      res.json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Update Profile (FR-3)
  async updateProfile(req, res) {
    try {
      const userData = req.body;
      const user = await userService.updateProfile(req.user.userID, userData);
      res.json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Request Password Reset (FR-4)
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      const result = await userService.requestPasswordReset(email);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Reset Password (FR-4)
  async resetPassword(req, res) {
    try {
      const { resetToken, newPassword } = req.body;
      const result = await userService.resetPassword(resetToken, newPassword);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Admin: Get All Users (FR-5)
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Admin: Delete User (FR-5)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Legacy endpoints (kept for backward compatibility)
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createUser(req, res) {
    try {
      const userData = req.body;
      const user = await userService.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      const user = await userService.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new UserController();

