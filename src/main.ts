import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as session from 'express-session';
import * as passport from 'passport';
import { urlencoded, json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // If behind proxies (Chrome sometimes treats redirects differently), trust proxy
  app.set('trust proxy', 1);

  // Configure views - use source views in development, dist/views in production
  const isProduction = process.env.NODE_ENV === 'production';
  const viewsPath = isProduction
    ? join(__dirname, 'views')
    : join(process.cwd(), 'views');
  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('ejs');

  // Configure static assets
  const publicPath = isProduction
    ? join(__dirname, 'public')
    : join(process.cwd(), 'public');
  // Serve static files from root path (for Google verification files, etc.)
  app.useStaticAssets(publicPath, {
    prefix: '/',
  });

  // Body parser with size limits to prevent memory issues
  app.use(json({ limit: '10mb' })); // Limit JSON payload size
  app.use(urlencoded({ extended: true, limit: '10mb' })); // Limit URL-encoded payload size

  // Configure session with memory optimizations
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false, // Don't save session if not modified (reduces memory)
      saveUninitialized: false, // Don't save uninitialized sessions (reduces memory)
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent client-side JavaScript access
        sameSite: 'lax',
      },
      // In production, consider using Redis or database session store
      // For now, rolling: true helps with memory management
      rolling: true, // Reset expiration on activity
    }),
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization - store entire user object in session
  passport.serializeUser((user: any, done) => {
    if (user) {
      done(null, user);
    } else {
      done(new Error('No user to serialize'), null);
    }
  });

  // Passport deserialization - restore user from session
  passport.deserializeUser((user: any, done) => {
    if (user) {
      done(null, user);
    } else {
      done(new Error('No user in session'), null);
    }
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Security headers to prevent phishing detection
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Content Security Policy (basic)
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' data: https://cdnjs.cloudflare.com; connect-src 'self' https://accounts.google.com https://www.googleapis.com https://api.trello.com; frame-src 'self' https://accounts.google.com;",
    );
    next();
  });

  // CORS if needed
  app.enableCors();

  const port = process.env.PORT || 3000;
  const app_url = process.env.APP_URL || `http://localhost:${port}`;
  await app.listen(port);
  console.log(`Application is running on: ${app_url}`);
  // console.log(`Google Client ID: ${process.env.GOOGLE_CLIENT_ID}`);
  // console.log(`Google Client Secret: ${process.env.GOOGLE_CLIENT_SECRET}`);
  // console.log(`Trello API Key: ${process.env.TRELLO_API_KEY}`);
  // console.log(`Trello Token: ${process.env.TRELLO_TOKEN}`);
  // console.log(`Database URL: ${process.env.DATABASE_URL}`);
  // console.log(`Session Secret: ${process.env.SESSION_SECRET}`);
  // console.log(`Encryption Key: ${process.env.ENCRYPTION_KEY}`);
}

bootstrap();
