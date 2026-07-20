import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { aiDiagramJsonSchema, aiDiagramSchema, type AiDiagram } from '../../shared/ai/aiDiagramSchema';
import {
  aiReviewSchema,
  aiTestCaseSchema,
  type AiEditorDiagram,
  type AiReview,
  type AiTestCase,
  type AiWorkflowConstraints,
} from '../../shared/ai/apiSchemas';
import { ApiError } from '../middleware/errorHandler';

const SYSTEM_INSTRUCTION = `You are a business-process and flowchart architect.

Convert the user's process description into a clear, logically complete flowchart.

Use short action-oriented labels.
Use start for entry points, process for actions, decision for branching questions,
inputOutput for information entry or output, and end for final outcomes.
Every edge must reference an existing node key. Every decision must have at least
two clearly and distinctly labelled outgoing paths such as Yes/No or
Approved/Rejected. Avoid unnecessary nodes. Ensure every path reaches a meaningful
outcome. If a path is rejected, ineligible, invalid, or declined, route it to a
notification or final outcome instead of a successful processing action. Model
approval as a decision after the approval request step. Return only data matching
the provided structured schema. Do not include coordinates, dimensions, styling,
markup, URLs, code, or application IDs.`;

const REVIEW_SYSTEM_INSTRUCTION = `You are a senior flowchart reviewer.

Review the provided diagram for business logic, diagram quality, and routing
risks. Flag missing decision branches, unclear labels, unreachable nodes,
confusing merge paths, and logic risks such as rejected or ineligible work
reaching a success action. Reference only nodeIds and connectionIds that exist in
the provided diagram. Return only data matching the structured schema.`;

const EDIT_SYSTEM_INSTRUCTION = `You are a business-process and flowchart architect.

Revise only the selected area described by the user. Return a self-contained
replacement fragment as a validated canonical flowchart. Preserve the user's
manual work outside the selected area by not describing unrelated nodes. Use
short labels, explicit decision branches, and meaningful outcomes. Return no
coordinates, styling, markup, URLs, code, or application IDs.`;

const TEST_CASE_SYSTEM_INSTRUCTION = `You are a workflow quality analyst.

Generate practical test scenarios for the provided flowchart. Each test case
should name the scenario, list the important inputs or branch choices, describe
the expected path in human-readable labels, and state the expected outcome. Cover
normal paths, rejected paths, and boundary decisions when they exist. Return only
data matching the structured schema.`;

export interface FlowchartProvider {
  generate(prompt: string, constraints?: AiWorkflowConstraints, signal?: AbortSignal): Promise<AiDiagram>;
  review(diagram: AiEditorDiagram, signal?: AbortSignal): Promise<AiReview>;
  edit(options: {
    instruction: string;
    mode: 'selected-area' | 'branch';
    diagram: AiEditorDiagram;
    selectedNodeIds: string[];
    selectedConnectionIds: string[];
    constraints?: AiWorkflowConstraints;
  }, signal?: AbortSignal): Promise<AiDiagram>;
  generateTestCases(diagram: AiEditorDiagram, signal?: AbortSignal): Promise<AiTestCase[]>;
}

interface GeminiProviderOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export function createGeminiFlowchartProvider(options: GeminiProviderOptions): FlowchartProvider {
  const client = new GoogleGenAI({ apiKey: options.apiKey });

  async function requestStructured<T>(
    input: string,
    systemInstruction: string,
    schema: Record<string, unknown>,
    parser: z.ZodType<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    const interaction = await client.interactions.create({
      model: options.model,
      input,
      system_instruction: systemInstruction,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema,
      },
      generation_config: {
        temperature: 0.2,
        thinking_level: 'low',
        max_output_tokens: 8_192,
      },
      store: false,
    }, {
      signal,
      timeout_ms: options.timeoutMs,
      retries: { strategy: 'attempt-count-backoff', maxRetries: 1 },
    });

    if (!interaction.output_text) {
      throw new ApiError(502, 'INVALID_AI_RESPONSE', 'Gemini did not return valid structured data.');
    }

    let candidate: unknown;
    try {
      candidate = JSON.parse(interaction.output_text);
    } catch {
      throw new ApiError(502, 'INVALID_AI_RESPONSE', 'Gemini did not return valid structured data.');
    }

    const result = parser.safeParse(candidate);
    if (!result.success) {
      throw new ApiError(502, 'INVALID_AI_RESPONSE', 'Gemini did not return valid structured data.');
    }
    return result.data;
  }

  return {
    async generate(prompt, constraints, signal) {
      try {
        return await requestStructured(
          buildGenerationInput(prompt, constraints),
          SYSTEM_INSTRUCTION,
          aiDiagramJsonSchema,
          aiDiagramSchema,
          signal,
        );
      } catch (error) {
        throw normalizeGeminiError(error, signal);
      }
    },

    async review(diagram, signal) {
      try {
        return await requestStructured(
          `Review this diagram:\n${JSON.stringify(diagram, null, 2)}`,
          REVIEW_SYSTEM_INSTRUCTION,
          aiReviewJsonSchema,
          aiReviewSchema,
          signal,
        );
      } catch (error) {
        throw normalizeGeminiError(error, signal);
      }
    },

    async edit(request, signal) {
      try {
        return await requestStructured(
          buildEditInput(request),
          EDIT_SYSTEM_INSTRUCTION,
          aiDiagramJsonSchema,
          aiDiagramSchema,
          signal,
        );
      } catch (error) {
        throw normalizeGeminiError(error, signal);
      }
    },

    async generateTestCases(diagram, signal) {
      try {
        return await requestStructured(
          `Generate test cases for this diagram:\n${JSON.stringify(diagram, null, 2)}`,
          TEST_CASE_SYSTEM_INSTRUCTION,
          aiTestCasesJsonSchema,
          z.array(aiTestCaseSchema).max(12),
          signal,
        );
      } catch (error) {
        throw normalizeGeminiError(error, signal);
      }
    },
  };
}

function normalizeGeminiError(error: unknown, signal?: AbortSignal): ApiError {
  if (error instanceof ApiError) return error;
  if (signal?.aborted || isTimeoutError(error)) {
    return new ApiError(504, 'AI_TIMEOUT', 'The AI request took too long. Please try again.');
  }
  if (isRateLimitError(error)) {
    return new ApiError(
      429,
      'RATE_LIMITED',
      "Today's free AI limit has been reached. You can continue creating diagrams manually.",
    );
  }
  if (error instanceof z.ZodError) {
    return new ApiError(502, 'INVALID_AI_RESPONSE', 'Gemini did not return valid structured data.');
  }
  return new ApiError(502, 'AI_PROVIDER_ERROR', 'Gemini could not complete the AI workflow right now.');
}

function buildGenerationInput(prompt: string, constraints?: AiWorkflowConstraints): string {
  return [
    `Process description:\n${prompt}`,
    formatConstraints(constraints),
  ].filter(Boolean).join('\n\n');
}

function buildEditInput(request: {
  instruction: string;
  mode: 'selected-area' | 'branch';
  diagram: AiEditorDiagram;
  selectedNodeIds: string[];
  selectedConnectionIds: string[];
  constraints?: AiWorkflowConstraints;
}) {
  const selectedNodes = request.diagram.nodes.filter((node) => request.selectedNodeIds.includes(node.id));
  const selectedConnections = request.diagram.connections.filter((connection) =>
    request.selectedConnectionIds.includes(connection.id) ||
    (request.selectedNodeIds.includes(connection.from) && request.selectedNodeIds.includes(connection.to))
  );

  return [
    `Mode: ${request.mode === 'branch' ? 'Regenerate the selected branch' : 'Edit the selected area'}`,
    `User instruction:\n${request.instruction}`,
    formatConstraints(request.constraints),
    `Full diagram context:\n${JSON.stringify(request.diagram, null, 2)}`,
    `Selected nodes:\n${JSON.stringify(selectedNodes, null, 2)}`,
    `Selected connections:\n${JSON.stringify(selectedConnections, null, 2)}`,
  ].filter(Boolean).join('\n\n');
}

function formatConstraints(constraints?: AiWorkflowConstraints): string {
  if (!constraints) return '';
  return [
    'Constraints:',
    `- Workflow type: ${constraints.workflowType}`,
    `- Detail level: ${constraints.detailLevel}`,
    `- Maximum nodes: ${constraints.maxNodes}`,
    `- Preferred direction: ${constraints.direction}`,
    constraints.requiredOutcomes ? `- Required outcomes: ${constraints.requiredOutcomes}` : '',
    constraints.rules ? `- Required rules: ${constraints.rules}` : '',
  ].filter(Boolean).join('\n');
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || error.name === 'TimeoutError' || /timeout/i.test(error.message);
}

function isRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { status?: unknown; code?: unknown };
  return candidate.status === 429 || candidate.code === 429 || candidate.code === 'RESOURCE_EXHAUSTED';
}

const aiReviewJsonSchema: Record<string, unknown> = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'A concise review summary.',
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: {
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low'],
          },
          category: {
            type: 'string',
            enum: ['missing-branch', 'unclear-label', 'unreachable', 'logic-risk', 'layout-risk', 'validation'],
          },
          message: {
            type: 'string',
            description: 'The specific issue found.',
          },
          recommendation: {
            type: 'string',
            description: 'The recommended correction.',
          },
          nodeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Existing node IDs involved in the finding.',
          },
          connectionIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Existing connection IDs involved in the finding.',
          },
        },
        required: ['severity', 'category', 'message', 'recommendation', 'nodeIds', 'connectionIds'],
        additionalProperties: false,
      },
    },
  },
  required: ['summary', 'findings'],
  additionalProperties: false,
};

const aiTestCasesJsonSchema: Record<string, unknown> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Short scenario title.',
      },
      inputs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Inputs, branch choices, or conditions used by the scenario.',
      },
      expectedPath: {
        type: 'array',
        items: { type: 'string' },
        description: 'Expected node labels or branch labels in order.',
      },
      expectedOutcome: {
        type: 'string',
        description: 'Expected final outcome.',
      },
      riskCovered: {
        type: 'string',
        description: 'Risk or edge case covered by the scenario.',
      },
    },
    required: ['title', 'inputs', 'expectedPath', 'expectedOutcome', 'riskCovered'],
    additionalProperties: false,
  },
};
