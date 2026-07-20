import {
  aiHealthResponseSchema,
  apiErrorResponseSchema,
  editFlowchartResponseSchema,
  generateFlowchartResponseSchema,
  generateTestCasesResponseSchema,
  reviewFlowchartResponseSchema,
  type AiEditorDiagram,
  type AiReview,
  type AiTestCase,
  type AiWorkflowConstraints,
} from '../../../../shared/ai/apiSchemas';
import type { AiDiagram } from '../../../../shared/ai/aiDiagramSchema';

export class AiGenerationError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

export type AiAvailability =
  | { configured: true; provider: 'gemini'; model: string }
  | { configured: false; reason: 'not-configured' | 'server-unavailable' };

let availabilityRequest: Promise<AiAvailability> | null = null;

export function getAiAvailability(): Promise<AiAvailability> {
  if (!availabilityRequest) {
    availabilityRequest = fetch('/api/health')
      .then(async (response) => {
        if (!response.ok) return { configured: false, reason: 'server-unavailable' } as const;
        const parsed = aiHealthResponseSchema.safeParse(await response.json());
        if (!parsed.success) return { configured: false, reason: 'server-unavailable' } as const;
        return parsed.data.ai.configured
          ? { configured: true, provider: parsed.data.ai.provider, model: parsed.data.ai.model } as const
          : { configured: false, reason: 'not-configured' } as const;
      })
      .catch(() => ({ configured: false, reason: 'server-unavailable' }) as const);
  }
  return availabilityRequest;
}

export function resetAiAvailabilityCacheForTests(): void {
  availabilityRequest = null;
}

export async function generateAiFlowchart(
  prompt: string,
  constraints?: AiWorkflowConstraints,
  signal?: AbortSignal,
): Promise<AiDiagram> {
  return postAiDiagram('/api/ai/generate-flowchart', { prompt, ...(constraints ? { constraints } : {}) }, signal);
}

export async function editAiFlowchart(options: {
  instruction: string;
  mode: 'selected-area' | 'branch';
  diagram: AiEditorDiagram;
  selectedNodeIds: string[];
  selectedConnectionIds: string[];
  constraints?: AiWorkflowConstraints;
}, signal?: AbortSignal): Promise<AiDiagram> {
  return postAiDiagram('/api/ai/edit-flowchart', options, signal);
}

export async function reviewAiFlowchart(diagram: AiEditorDiagram, signal?: AbortSignal): Promise<AiReview> {
  const body = await postAiJson('/api/ai/review-flowchart', { diagram }, signal);
  const parsed = reviewFlowchartResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new AiGenerationError('INVALID_AI_RESPONSE', 'Gemini did not return a valid review.');
  }
  return parsed.data.review;
}

export async function generateAiTestCases(diagram: AiEditorDiagram, signal?: AbortSignal): Promise<AiTestCase[]> {
  const body = await postAiJson('/api/ai/generate-test-cases', { diagram }, signal);
  const parsed = generateTestCasesResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new AiGenerationError('INVALID_AI_RESPONSE', 'Gemini did not return valid test cases.');
  }
  return parsed.data.testCases;
}

async function postAiDiagram(endpoint: string, payload: unknown, signal?: AbortSignal): Promise<AiDiagram> {
  const body = await postAiJson(endpoint, payload, signal);
  const parsed = endpoint.endsWith('/edit-flowchart')
    ? editFlowchartResponseSchema.safeParse(body)
    : generateFlowchartResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new AiGenerationError(
      'INVALID_AI_RESPONSE',
      'Gemini did not return a valid flowchart. Please simplify the description and try again.',
    );
  }
  return parsed.data.diagram;
}

async function postAiJson(endpoint: string, payload: unknown, signal?: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new AiGenerationError('SERVER_UNAVAILABLE', 'The AI service is unavailable. Manual editing is still available.');
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsedError = apiErrorResponseSchema.safeParse(body);
    if (parsedError.success) {
      throw new AiGenerationError(parsedError.data.error.code, parsedError.data.error.message);
    }
    throw new AiGenerationError('INTERNAL_ERROR', 'The flowchart could not be generated.');
  }

  return body;
}
