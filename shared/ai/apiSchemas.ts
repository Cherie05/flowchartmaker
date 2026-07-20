import { z } from 'zod';
import { aiDiagramSchema } from './aiDiagramSchema';

export const DEFAULT_MAX_PROMPT_LENGTH = 2_000;
const HTML_PATTERN = /<\/?[A-Za-z][^>]*>|&(?:#\d+|#x[\da-f]+|[A-Za-z]+);/i;

function boundedText(maxLength: number, allowEmpty = false) {
  const schema = z.string().trim().max(maxLength).refine((value) => !HTML_PATTERN.test(value), {
    message: 'HTML is not allowed',
  });
  return allowEmpty ? schema : schema.min(1);
}

export const aiWorkflowConstraintsSchema = z.object({
  workflowType: z.enum(['business', 'technical']).default('business'),
  detailLevel: z.enum(['simple', 'detailed']).default('simple'),
  maxNodes: z.number().int().min(2).max(25).default(12),
  direction: z.enum(['top-to-bottom', 'left-to-right']).default('top-to-bottom'),
  requiredOutcomes: boundedText(600, true).default(''),
  rules: boundedText(1_000, true).default(''),
}).strict();

export const aiEditorNodeSchema = z.object({
  id: boundedText(120),
  type: boundedText(40),
  text: boundedText(160),
}).strict();

export const aiEditorConnectionSchema = z.object({
  id: boundedText(120),
  from: boundedText(120),
  to: boundedText(120),
  label: boundedText(80, true).default(''),
}).strict();

export const aiEditorDiagramSchema = z.object({
  title: boundedText(120),
  nodes: z.array(aiEditorNodeSchema).min(1).max(80),
  connections: z.array(aiEditorConnectionSchema).max(120),
}).strict().superRefine((diagram, context) => {
  const nodeIds = new Set(diagram.nodes.map((node) => node.id));
  for (const connection of diagram.connections) {
    if (!nodeIds.has(connection.from) || !nodeIds.has(connection.to)) {
      context.addIssue({ code: 'custom', path: ['connections'], message: `Connection ${connection.id} references an unknown node` });
    }
  }
});

export function createGenerateRequestSchema(maxPromptLength = DEFAULT_MAX_PROMPT_LENGTH) {
  return z.object({
    prompt: z.string().trim().min(1, 'Describe the process you want to diagram').max(maxPromptLength),
    constraints: aiWorkflowConstraintsSchema.optional(),
  }).strict();
}

export const generateFlowchartResponseSchema = z.object({
  requestId: z.string().uuid(),
  diagram: aiDiagramSchema,
}).strict();

export const aiReviewFindingSchema = z.object({
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.enum(['missing-branch', 'unclear-label', 'unreachable', 'logic-risk', 'layout-risk', 'validation']),
  message: boundedText(220),
  recommendation: boundedText(260),
  nodeIds: z.array(boundedText(120)).max(8).default([]),
  connectionIds: z.array(boundedText(120)).max(8).default([]),
}).strict();

export const aiReviewSchema = z.object({
  summary: boundedText(400),
  findings: z.array(aiReviewFindingSchema).max(12),
}).strict();

export const aiTestCaseSchema = z.object({
  title: boundedText(120),
  inputs: z.array(boundedText(120)).min(1).max(8),
  expectedPath: z.array(boundedText(120)).min(1).max(12),
  expectedOutcome: boundedText(160),
  riskCovered: boundedText(180),
}).strict();

export const reviewFlowchartRequestSchema = z.object({
  diagram: aiEditorDiagramSchema,
}).strict();

export const reviewFlowchartResponseSchema = z.object({
  requestId: z.string().uuid(),
  review: aiReviewSchema,
}).strict();

export const editFlowchartRequestSchema = z.object({
  instruction: boundedText(DEFAULT_MAX_PROMPT_LENGTH),
  mode: z.enum(['selected-area', 'branch']),
  diagram: aiEditorDiagramSchema,
  selectedNodeIds: z.array(boundedText(120)).min(1).max(25),
  selectedConnectionIds: z.array(boundedText(120)).max(40).default([]),
  constraints: aiWorkflowConstraintsSchema.optional(),
}).strict().superRefine((request, context) => {
  const nodeIds = new Set(request.diagram.nodes.map((node) => node.id));
  const connectionIds = new Set(request.diagram.connections.map((connection) => connection.id));
  for (const nodeId of request.selectedNodeIds) {
    if (!nodeIds.has(nodeId)) {
      context.addIssue({ code: 'custom', path: ['selectedNodeIds'], message: `Selected node ${nodeId} does not exist` });
    }
  }
  for (const connectionId of request.selectedConnectionIds) {
    if (!connectionIds.has(connectionId)) {
      context.addIssue({ code: 'custom', path: ['selectedConnectionIds'], message: `Selected connection ${connectionId} does not exist` });
    }
  }
});

export const editFlowchartResponseSchema = z.object({
  requestId: z.string().uuid(),
  diagram: aiDiagramSchema,
}).strict();

export const generateTestCasesRequestSchema = z.object({
  diagram: aiEditorDiagramSchema,
}).strict();

export const generateTestCasesResponseSchema = z.object({
  requestId: z.string().uuid(),
  testCases: z.array(aiTestCaseSchema).max(12),
}).strict();

export const apiErrorCodeSchema = z.enum([
  'INVALID_REQUEST',
  'PROMPT_TOO_LONG',
  'RATE_LIMITED',
  'AI_NOT_CONFIGURED',
  'AI_TIMEOUT',
  'AI_PROVIDER_ERROR',
  'INVALID_AI_RESPONSE',
  'INTERNAL_ERROR',
]);

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
  }).strict(),
}).strict();

export const aiHealthResponseSchema = z.union([
  z.object({
    status: z.literal('ok'),
    ai: z.object({ configured: z.literal(false) }).strict(),
  }).strict(),
  z.object({
    status: z.literal('ok'),
    ai: z.object({
      configured: z.literal(true),
      provider: z.literal('gemini'),
      model: z.string().trim().min(1),
    }).strict(),
  }).strict(),
]);

export type GenerateFlowchartResponse = z.infer<typeof generateFlowchartResponseSchema>;
export type AiWorkflowConstraints = z.infer<typeof aiWorkflowConstraintsSchema>;
export type AiEditorDiagram = z.infer<typeof aiEditorDiagramSchema>;
export type AiReview = z.infer<typeof aiReviewSchema>;
export type AiReviewFinding = z.infer<typeof aiReviewFindingSchema>;
export type AiTestCase = z.infer<typeof aiTestCaseSchema>;
export type EditFlowchartRequest = z.infer<typeof editFlowchartRequestSchema>;
export type ReviewFlowchartResponse = z.infer<typeof reviewFlowchartResponseSchema>;
export type GenerateTestCasesResponse = z.infer<typeof generateTestCasesResponseSchema>;
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type AiHealthResponse = z.infer<typeof aiHealthResponseSchema>;
