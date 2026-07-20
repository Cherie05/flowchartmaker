import path from 'node:path';
import express, { type Express } from 'express';
import type { ServerConfig } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { createInMemoryRateLimiter } from './middleware/rateLimit';
import { createGeminiFlowchartProvider, type FlowchartProvider } from './providers/geminiFlowchartProvider';
import { createAiWorkflowRouter } from './routes/aiWorkflow';
import { createGenerateFlowchartRouter } from './routes/generateFlowchart';
import { createDiagramGenerationService } from './services/diagramGenerationService';

interface CreateAppOptions {
  config: ServerConfig;
  provider?: FlowchartProvider;
  staticDirectory?: string;
}

export function createApp({ config, provider, staticDirectory }: CreateAppOptions): Express {
  const app = express();
  const resolvedProvider = provider ?? (config.geminiApiKey
    ? createGeminiFlowchartProvider({
        apiKey: config.geminiApiKey,
        model: config.geminiModel,
        timeoutMs: config.requestTimeoutMs,
      })
    : undefined);
  const service = createDiagramGenerationService(resolvedProvider, config.maxNodes, config.maxEdges);
  const rateLimiter = createInMemoryRateLimiter(config.dailyLimit, config.cooldownSeconds);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((_request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'same-origin');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  app.use(express.json({ limit: '8kb', strict: true }));

  app.get('/api/health', (_request, response) => {
    response.json(config.geminiApiKey
      ? {
          status: 'ok',
          ai: { configured: true, provider: 'gemini', model: config.geminiModel },
        }
      : { status: 'ok', ai: { configured: false } });
  });
  app.use('/api/ai/generate-flowchart', createGenerateFlowchartRouter({
    service,
    rateLimiter,
    maxPromptLength: config.maxPromptLength,
  }));
  app.use('/api/ai', createAiWorkflowRouter({
    service,
    rateLimiter,
  }));
  app.use('/api', (_request, response) => {
    response.status(404).json({ error: { code: 'INVALID_REQUEST', message: 'Endpoint not found.' } });
  });
  if (staticDirectory) {
    app.use(express.static(staticDirectory));
    app.get('/{*path}', (_request, response) => {
      response.sendFile(path.join(staticDirectory, 'index.html'));
    });
  }
  app.use((_request, response) => {
    response.status(404).json({ error: { code: 'INVALID_REQUEST', message: 'Endpoint not found.' } });
  });
  app.use(errorHandler);

  return app;
}
