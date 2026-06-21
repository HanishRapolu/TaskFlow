import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

class AuthRepository {
  async findUserByEmail(email) {
    return await User.findOne({ email }).select('+password');
  }

  async findUserById(id) {
    return await User.findById(id);
  }

  async createUserWithWorkspace(userData) {
    // Create the user
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: userData.password,
    });
    
    await user.save(); // Password hashed by pre-save hook
    
    // Create default workspace for user
    const workspace = new Workspace({
      name: `${user.name}'s Workspace`,
      owner: user._id,
      members: [{
        userId: user._id,
        role: 'owner',
      }]
    });
    
    await workspace.save();
    
    return user;
  }
}

export default new AuthRepository();
