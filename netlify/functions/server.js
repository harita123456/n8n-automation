const serverless = require('@vendia/serverless-express');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../src/app.module');
const express = require('express');
const { join } = require('path');

let server;

async function bootstrapServer() {
  const expressApp = express();
  const nestApp = await NestFactory.create(AppModule, expressApp, {
    logger: ['error', 'warn', 'log'],
  });

  // Configure your app as in main.ts
  const isProduction = process.env.NODE_ENV === 'production';
  const viewsPath = isProduction
    ? join(__dirname, '..', 'dist', 'views')
    : join(process.cwd(), 'views');
  
  expressApp.set('view engine', 'ejs');
  expressApp.set('views', viewsPath);

  // Add other middleware and configurations from your main.ts
  expressApp.use(express.json());
  expressApp.use(express.urlencoded({ extended: true }));

  await nestApp.init();
  return serverless.createServer(expressApp);
}

module.exports.handler = async (event, context) => {
  if (!server) {
    server = await bootstrapServer();
  }
  return server(event, context);
};