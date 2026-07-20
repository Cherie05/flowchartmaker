import { randomUUID } from 'node:crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
import {
  editFlowchartRequestSchema,
  generateTestCasesRequestSchema,
  reviewFlowchartRequestSchema,
} from '../../shared/ai/apiSchemas';
import { ApiError } from '../middleware/errorHandler';
import type { RateLimiter } from '../middleware/rateLimit';
import type { DiagramGenerationService } from '../services/diagramGenerationService';

interface RouteOptions {
  service: DiagramGenerationService;
  rateLimiter: RateLimiter;
}

export function createAiWorkflowRouter(options: RouteOptions): Router {
  const router = Router();

  router.post('/review-flowchart', async (request, response, next) => {
    await runAiRequest(request, response, next, options.rateLimiter, async (signal) => {
      const parsed = reviewFlowchartRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(400, 'INVALID_REQUEST', 'Enter a valid flowchart to review.');
      }
      const review = await options.service.review(parsed.data.diagram, signal);
      response.json({ requestId: randomUUID(), review });
    });
  });

  router.post('/edit-flowchart', async (request, response, next) => {
    await runAiRequest(request, response, next, options.rateLimiter, async (signal) => {
      const parsed = editFlowchartRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(400, 'INVALID_REQUEST', 'Enter a valid selected area and instruction.');
      }
      const diagram = await options.service.edit(parsed.data, signal);
      response.json({ requestId: randomUUID(), diagram });
    });
  });

  router.post('/generate-test-cases', async (request, response, next) => {
    await runAiRequest(request, response, next, options.rateLimiter, async (signal) => {
      const parsed = generateTestCasesRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(400, 'INVALID_REQUEST', 'Enter a valid flowchart to test.');
      }
      const testCases = await options.service.generateTestCases(parsed.data.diagram, signal);
      response.json({ requestId: randomUUID(), testCases });
    });
  });

  return router;
}

async function runAiRequest(
  request: Request,
  response: Response,
  next: NextFunction,
  rateLimiter: RateLimiter,
  handler: (signal: AbortSignal) => Promise<void>,
) {
  if (!request.is('application/json')) {
    next(new ApiError(400, 'INVALID_REQUEST', 'Content-Type must be application/json.'));
    return;
  }

  let complete: (() => void) | undefined;
  const controller = new AbortController();
  const onClose = () => {
    if (!response.writableEnded) controller.abort();
  };
  request.once('aborted', onClose);

  try {
    complete = rateLimiter.begin(request.ip || request.socket.remoteAddress || 'unknown');
    await handler(controller.signal);
  } catch (error) {
    next(error);
  } finally {
    complete?.();
    request.off('aborted', onClose);
  }
}
