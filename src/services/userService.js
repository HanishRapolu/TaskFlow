import userRepository from '../repositories/userRepository.js';

class UserService {
  async getUserWorkspaces(userId) {
    return await userRepository.getUserWorkspaces(userId);
  }
}

export default new UserService();
