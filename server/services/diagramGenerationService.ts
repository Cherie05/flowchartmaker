import type { AiDiagram } from '../../shared/ai/aiDiagramSchema';
import type { AiEditorDiagram, AiReview, AiTestCase, AiWorkflowConstraints } from '../../shared/ai/apiSchemas';
import type { FlowchartProvider } from '../providers/geminiFlowchartProvider';
import { ApiError } from '../middleware/errorHandler';

export interface DiagramGenerationService {
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

export function createDiagramGenerationService(
  provider: FlowchartProvider | undefined,
  maxNodes = 25,
  maxEdges = 40,
): DiagramGenerationService {
  const requireProvider = () => {
    if (!provider) {
      throw new ApiError(503, 'AI_NOT_CONFIGURED', 'AI generation is not configured on this server.');
    }
    return provider;
  };

  const enforceDiagramLimits = (diagram: AiDiagram) => {
    if (diagram.nodes.length > maxNodes || diagram.edges.length > maxEdges) {
      throw new ApiError(502, 'INVALID_AI_RESPONSE', "Gemini returned a flowchart that exceeds this server's limits.");
    }
    return diagram;
  };

  return {
    async generate(prompt, constraints, signal) {
      return enforceDiagramLimits(await requireProvider().generate(prompt, constraints, signal));
    },

    async review(diagram, signal) {
      return requireProvider().review(diagram, signal);
    },

    async edit(options, signal) {
      return enforceDiagramLimits(await requireProvider().edit(options, signal));
    },

    async generateTestCases(diagram, signal) {
      return requireProvider().generateTestCases(diagram, signal);
    },
  };
}
