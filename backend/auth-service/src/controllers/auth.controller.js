import * as authService from '../services/auth.service.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, role, name } = req.body;
    const result = await authService.registerUser({ email, password, role, name });
    res.status(201).json({
      message: 'User created successfully',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    res.status(200).json({
      message: 'Login successful',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await authService.getUserById(userId);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
