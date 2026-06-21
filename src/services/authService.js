import authRepository from '../repositories/authRepository.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET || 'fallback_access_secret', {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', {
    expiresIn: '7d',
  });
};

class AuthService {
  async registerUser(userData) {
    const { name, email, password } = userData;

    if (!name || !email || !password) {
      throw new AppError('Please provide all required fields', 400);
    }

    const userExists = await authRepository.findUserByEmail(email);
    if (userExists) {
      throw new AppError('User already exists', 400);
    }

    const user = await authRepository.createUserWithWorkspace({ name, email, password });
    
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return { user, accessToken, refreshToken };
  }

  async loginUser(email, password) {
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    const user = await authRepository.findUserByEmail(email);
    
    if (!user || !(await user.matchPassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return { user, accessToken, refreshToken };
  }
  
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Not authorized, no refresh token', 401);
    }
    
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
      const user = await authRepository.findUserById(decoded.id);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      const newAccessToken = generateAccessToken(user._id);
      return newAccessToken;
    } catch (error) {
      throw new AppError('Not authorized, invalid refresh token', 401);
    }
  }
}

export default new AuthService();
