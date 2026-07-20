import { Hono, type Context } from 'hono';
import {
  createGenerateRequestSchema,
  reviewFlowchartRequestSchema,
  editFlowchartRequestSchema,
  generateTestCasesRequestSchema,
} from '../shared/ai/apiSchemas';
import { ApiError } from '../server/middleware/errorHandler';
import { createDiagramGenerationService, type DiagramGenerationService } from '../server/services/diagramGenerationService';
import { createGeminiFlowchartProvider } from '../server/providers/geminiFlowchartProvider';
import { createKvRateLimiter } from './rateLimiter';
import { readWorkerConfig, type WorkerConfig, type WorkerEnv } from './config';

const app = new Hono<{ Bindings: WorkerEnv }>();

function buildService(c: Context<{ Bindings: WorkerEnv }>): { service: DiagramGenerationService; config: WorkerConfig } {
  const config = readWorkerConfig(c.env);
  const provider = config.geminiApiKey
    ? createGeminiFlowchartProvider({ apiKey: config.geminiApiKey, model: config.geminiModel, timeoutMs: config.requestTimeoutMs })
    : undefined;
  return { service: createDiagramGenerationService(provider, config.maxNodes, config.maxEdges), config };
}

function clientIp(c: Context): string {
  return c.req.header('cf-connecting-ip') ?? 'unknown';
}

async function beginRateLimit(c: Context<{ Bindings: WorkerEnv }>, config: WorkerConfig): Promise<void> {
  if (!c.env.RATE_LIMIT_KV) return;
  await createKvRateLimiter(c.env.RATE_LIMIT_KV, config.dailyLimit, config.cooldownSeconds).begin(clientIp(c));
}

async function requireJsonBody(c: Context): Promise<unknown> {
  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new ApiError(400, 'INVALID_REQUEST', 'Content-Type must be application/json.');
  }
  const text = await c.req.text();
  if (text.length > 8_192) {
    throw new ApiError(413, 'INVALID_REQUEST', 'The request body is too large.');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, 'INVALID_REQUEST', 'The request body must contain valid JSON.');
  }
}

app.get('/api/health', (c) => {
  const config = readWorkerConfig(c.env);
  return c.json(
    config.geminiApiKey
      ? { status: 'ok', ai: { configured: true, provider: 'gemini', model: config.geminiModel } }
      : { status: 'ok', ai: { configured: false } },
  );
});

app.post('/api/ai/generate-flowchart', async (c) => {
  const { service, config } = buildService(c);
  const body = await requireJsonBody(c);
  const parsed = createGenerateRequestSchema(config.maxPromptLength).safeParse(body);
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some((issue) => issue.code === 'too_big' && issue.path[0] === 'prompt');
    throw new ApiError(
      400,
      tooLong ? 'PROMPT_TOO_LONG' : 'INVALID_REQUEST',
      tooLong ? `The process description must be ${config.maxPromptLength} characters or fewer.` : 'Enter a valid process description.',
    );
  }
  await beginRateLimit(c, config);
  const diagram = await service.generate(parsed.data.prompt, parsed.data.constraints, c.req.raw.signal);
  return c.json({ requestId: crypto.randomUUID(), diagram });
});

app.post('/api/ai/review-flowchart', async (c) => {
  const { service, config } = buildService(c);
  const body = await requireJsonBody(c);
  const parsed = reviewFlowchartRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'INVALID_REQUEST', 'Enter a valid flowchart to review.');
  }
  await beginRateLimit(c, config);
  const review = await service.review(parsed.data.diagram, c.req.raw.signal);
  return c.json({ requestId: crypto.randomUUID(), review });
});

app.post('/api/ai/edit-flowchart', async (c) => {
  const { service, config } = buildService(c);
  const body = await requireJsonBody(c);
  const parsed = editFlowchartRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'INVALID_REQUEST', 'Enter a valid selected area and instruction.');
  }
  await beginRateLimit(c, config);
  const diagram = await service.edit(parsed.data, c.req.raw.signal);
  return c.json({ requestId: crypto.randomUUID(), diagram });
});

app.post('/api/ai/generate-test-cases', async (c) => {
  const { service, config } = buildService(c);
  const body = await requireJsonBody(c);
  const parsed = generateTestCasesRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'INVALID_REQUEST', 'Enter a valid flowchart to test.');
  }
  await beginRateLimit(c, config);
  const testCases = await service.generateTestCases(parsed.data.diagram, c.req.raw.signal);
  return c.json({ requestId: crypto.randomUUID(), testCases });
});

app.all('/api/*', (c) => c.json({ error: { code: 'INVALID_REQUEST', message: 'Endpoint not found.' } }, 404));

app.onError((error, c) => {
  if (error instanceof ApiError) {
    return c.json({ error: { code: error.code, message: error.message } }, error.status as 400 | 404 | 413 | 429 | 502 | 503 | 504);
  }
  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'The flowchart could not be generated.' } }, 500);
});

app.get('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
