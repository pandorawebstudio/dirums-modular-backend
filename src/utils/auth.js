import { config } from '../config/index.js';

export function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export async function validateToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
}