import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { authService } from './auth.service';
import { authRepository } from './auth.repository';

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req.ip, req.headers['user-agent']);
    res.json(result);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json(result);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(204).send();
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.json({ message: 'Si el email existe, se envió un enlace de recuperación' });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ message: 'Contraseña actualizada correctamente' });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw AppError.unauthorized();
    const user = await authService.me(req.auth.sub);
    res.json(user);
  }),

  loginHistory: asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw AppError.unauthorized();
    const history = await authRepository.findLoginHistory(req.auth.sub);
    res.json(history);
  }),
};
