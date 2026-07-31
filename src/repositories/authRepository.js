import User from '../models/User.js';
import Company from '../models/Company.js';

class AuthRepository {
  async findUserByEmail(email) {
    return await User.findOne({ email }).select('+password');
  }

  async findUserById(id) {
    return await User.findById(id);
  }

  async createUserWithCompany(userData) {
    // Create the user
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: userData.password,
    });
    
    await user.save(); // Password hashed by pre-save hook
    
    // Create default company for the owner
    const company = new Company({
      name: `${user.name}'s Company`,
      owner: user._id,
    });
    
    await company.save();
    
    return user;
  }
}

export default new AuthRepository();
