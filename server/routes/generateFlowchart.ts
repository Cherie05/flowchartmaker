import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { createGenerateRequestSchema } from '../../shared/ai/apiSchemas';
import { ApiError } from '../middleware/errorHandler';
import type { RateLimiter } from '../middleware/rateLimit';
import type { DiagramGenerationService } from '../services/diagramGenerationService';

interface RouteOptions {
  service: DiagramGenerationService;
  rateLimiter: RateLimiter;
  maxPromptLength: number;
}

export function createGenerateFlowchartRouter(options: RouteOptions): Router {
  const router = Router();
  const requestSchema = createGenerateRequestSchema(options.maxPromptLength);

  router.post('/', async (request, response, next) => {
    if (!request.is('application/json')) {
      next(new ApiError(400, 'INVALID_REQUEST', 'Content-Type must be application/json.'));
      return;
    }

    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) {
      const tooLong = parsed.error.issues.some((issue) => issue.code === 'too_big' && issue.path[0] === 'prompt');
      next(new ApiError(
        400,
        tooLong ? 'PROMPT_TOO_LONG' : 'INVALID_REQUEST',
        tooLong ? `The process description must be ${options.maxPromptLength} characters or fewer.` : 'Enter a valid process description.',
      ));
      return;
    }

    let complete: (() => void) | undefined;
    const controller = new AbortController();
    const onClose = () => {
      if (!response.writableEnded) controller.abort();
    };
    request.once('aborted', onClose);

    try {
      complete = options.rateLimiter.begin(request.ip || request.socket.remoteAddress || 'unknown');
      const diagram = await options.service.generate(parsed.data.prompt, parsed.data.constraints, controller.signal);
      response.json({ requestId: randomUUID(), diagram });
    } catch (error) {
      next(error);
    } finally {
      complete?.();
      request.off('aborted', onClose);
    }
  });

  return router;
}
