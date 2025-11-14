import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    // User is attached to request by passport after Google OAuth
    // Ensure user is logged in and session is established
    if (req.user) {
      // Login the user to establish session
      return new Promise<void>((resolve) => {
        (req as any).login(req.user, (err: any) => {
          if (err) {
            console.error('Login error:', err);
            return res.redirect('/login?error=session_failed');
          }
          // Save session before redirect
          (req.session as any).save((err: any) => {
            if (err) {
              console.error('Session save error:', err);
            }
            res.redirect('/dashboard');
            resolve();
          });
        });
      });
    } else {
      res.redirect('/login?error=authentication_failed');
    }
  }

  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    req.logout((err) => {
      if (err) {
        return res.redirect('/login?error=logout_failed');
      }
      res.redirect('/login');
    });
  }
}
