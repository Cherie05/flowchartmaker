import type { AIFlowChartConnection, AIFlowChartRequest, AIFlowChartResponse } from '../types/flowChart';

class AIFlowChartService {
  private templates = {
    'user registration': {
      title: 'User Registration Process',
      description: 'Complete user registration workflow with validation',
      nodes: [
        { type: 'start', position: { x: 200, y: 50 }, text: 'Start Registration', width: 120, height: 60 },
        { type: 'process', position: { x: 200, y: 150 }, text: 'Enter Email & Password', width: 160, height: 80 },
        { type: 'decision', position: { x: 200, y: 280 }, text: 'Valid Input?', width: 140, height: 80 },
        { type: 'process', position: { x: 400, y: 280 }, text: 'Show Error Message', width: 140, height: 80 },
        { type: 'process', position: { x: 200, y: 420 }, text: 'Create Account', width: 140, height: 80 },
        { type: 'process', position: { x: 200, y: 560 }, text: 'Send Welcome Email', width: 140, height: 80 },
        { type: 'end', position: { x: 200, y: 680 }, text: 'Registration Complete', width: 160, height: 60 }
      ],
      connections: [
        createConnection(0, 1, 'bottom', 'top'),
        createConnection(1, 2, 'bottom', 'top'),
        createConnection(2, 3, 'right', 'left', 'Invalid'),
        createConnection(2, 4, 'bottom', 'top', 'Valid'),
        createConnection(4, 5, 'bottom', 'top'),
        createConnection(5, 6, 'bottom', 'top')
      ]
    },
    'order processing': {
      title: 'E-commerce Order Processing',
      description: 'Complete order fulfillment workflow',
      nodes: [
        { type: 'start', position: { x: 200, y: 50 }, text: 'Order Received', width: 120, height: 60 },
        { type: 'process', position: { x: 200, y: 150 }, text: 'Validate Payment', width: 140, height: 80 },
        { type: 'decision', position: { x: 200, y: 280 }, text: 'Payment Valid?', width: 140, height: 80 },
        { type: 'process', position: { x: 420, y: 280 }, text: 'Reject Order', width: 120, height: 80 },
        { type: 'process', position: { x: 200, y: 420 }, text: 'Check Inventory', width: 140, height: 80 },
        { type: 'decision', position: { x: 200, y: 560 }, text: 'Items Available?', width: 140, height: 80 },
        { type: 'process', position: { x: 420, y: 560 }, text: 'Backorder Items', width: 140, height: 80 },
        { type: 'process', position: { x: 200, y: 700 }, text: 'Ship Order', width: 120, height: 80 },
        { type: 'end', position: { x: 200, y: 820 }, text: 'Order Complete', width: 120, height: 60 }
      ],
      connections: [
        createConnection(0, 1, 'bottom', 'top'),
        createConnection(1, 2, 'bottom', 'top'),
        createConnection(2, 3, 'right', 'left', 'Invalid'),
        createConnection(2, 4, 'bottom', 'top', 'Valid'),
        createConnection(4, 5, 'bottom', 'top'),
        createConnection(5, 6, 'right', 'left', 'No Stock'),
        createConnection(5, 7, 'bottom', 'top', 'Available'),
        createConnection(7, 8, 'bottom', 'top')
      ]
    },
    'software development': {
      title: 'Software Development Lifecycle',
      description: 'Complete software development process',
      nodes: [
        { type: 'start', position: { x: 200, y: 50 }, text: 'Project Start', width: 120, height: 60 },
        { type: 'process', position: { x: 200, y: 150 }, text: 'Requirements Analysis', width: 160, height: 80 },
        { type: 'process', position: { x: 200, y: 280 }, text: 'Design & Planning', width: 140, height: 80 },
        { type: 'process', position: { x: 200, y: 420 }, text: 'Development', width: 120, height: 80 },
        { type: 'process', position: { x: 200, y: 560 }, text: 'Testing', width: 120, height: 80 },
        { type: 'decision', position: { x: 200, y: 700 }, text: 'Tests Pass?', width: 120, height: 80 },
        { type: 'process', position: { x: 420, y: 700 }, text: 'Fix Bugs', width: 120, height: 80 },
        { type: 'process', position: { x: 200, y: 840 }, text: 'Deploy', width: 120, height: 80 },
        { type: 'end', position: { x: 200, y: 960 }, text: 'Project Complete', width: 140, height: 60 }
      ],
      connections: [
        createConnection(0, 1, 'bottom', 'top'),
        createConnection(1, 2, 'bottom', 'top'),
        createConnection(2, 3, 'bottom', 'top'),
        createConnection(3, 4, 'bottom', 'top'),
        createConnection(4, 5, 'bottom', 'top'),
        createConnection(5, 6, 'right', 'left', 'Fail'),
        createConnection(5, 7, 'bottom', 'top', 'Pass'),
        createConnection(7, 8, 'bottom', 'top')
      ]
    }
  };

  async generateFlowChart(request: AIFlowChartRequest): Promise<AIFlowChartResponse> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const description = request.description.toLowerCase();
    const compactDescription = description.replace(/\s+/g, '');

    for (const [key, template] of Object.entries(this.templates)) {
      if (compactDescription.includes(key.replace(/\s+/g, '')) || description.includes(key)) {
        return template as AIFlowChartResponse;
      }
    }

    if (description.includes('login') || description.includes('authentication')) {
      return this.generateLoginFlow();
    }

    if (description.includes('payment') || description.includes('checkout')) {
      return this.generatePaymentFlow();
    }

    if (description.includes('approval') || description.includes('review')) {
      return this.generateApprovalFlow();
    }

    return this.generateGenericFlow(request.description);
  }

  private generateLoginFlow(): AIFlowChartResponse {
    return {
      title: 'User Login Process',
      description: 'User authentication workflow',
      nodes: [
        { type: 'start', position: { x: 200, y: 50 }, text: 'Start Login', width: 120, height: 60 },
        { type: 'process', position: { x: 200, y: 150 }, text: 'Enter Credentials', width: 140, height: 80 },
        { type: 'decision', position: { x: 200, y: 280 }, text: 'Valid Credentials?', width: 140, height: 80 },
        { type: 'process', position: { x: 420, y: 280 }, text: 'Show Error', width: 120, height: 80 },
        { type: 'process', position: { x: 200, y: 420 }, text: 'Grant Access', width: 120, height: 80 },
        { type: 'end', position: { x: 200, y: 540 }, text: 'Login Success', width: 120, height: 60 }
      ],
      connections: [
        createConnection(0, 1, 'bottom', 'top'),
        createConnection(1, 2, 'bottom', 'top'),
        createConnection(2, 3, 'right', 'left', 'Invalid'),
        createConnection(2, 4, 'bottom', 'top', 'Valid'),
        createConnection(4, 5, 'bottom', 'top')
      ]
    };
  }

  private generatePaymentFlow(): AIFlowChartResponse {
    return {
      title: 'Payment Processing',
      description: 'Payment workflow with validation',
      nodes: [
        { type: 'start', position: { x: 200, y: 50 }, text: 'Start Payment', width: 120, height: 60 },
        { type: 'process', position: { x: 200, y: 150 }, text: 'Enter Payment Info', width: 140, height: 80 },
        { type: 'decision', position: { x: 200, y: 280 }, text: 'Valid Payment?', width: 140, height: 80 },
        { type: 'process', position: { x: 420, y: 280 }, text: 'Payment Failed', width: 120, height: 80 },
        { type: 'process', position: { x: 200, y: 420 }, text: 'Process Payment', width: 140, height: 80 },
        { type: 'process', position: { x: 200, y: 560 }, text: 'Send Confirmation', width: 140, height: 80 },
        { type: 'end', position: { x: 200, y: 680 }, text: 'Payment Complete', width: 140, height: 60 }
      ],
      connections: [
        createConnection(0, 1, 'bottom', 'top'),
        createConnection(1, 2, 'bottom', 'top'),
        createConnection(2, 3, 'right', 'left', 'Invalid'),
        createConnection(2, 4, 'bottom', 'top', 'Valid'),
        createConnection(4, 5, 'bottom', 'top'),
        createConnection(5, 6, 'bottom', 'top')
      ]
    };
  }

  private generateApprovalFlow(): AIFlowChartResponse {
    return {
      title: 'Approval Process',
      description: 'Document or request approval workflow',
      nodes: [
        { type: 'start', position: { x: 200, y: 50 }, text: 'Submit Request', width: 120, height: 60 },
        { type: 'process', position: { x: 200, y: 150 }, text: 'Manager Review', width: 140, height: 80 },
        { type: 'decision', position: { x: 200, y: 280 }, text: 'Approved?', width: 120, height: 80 },
        { type: 'process', position: { x: 420, y: 280 }, text: 'Request Changes', width: 140, height: 80 },
        { type: 'process', position: { x: 200, y: 420 }, text: 'Final Approval', width: 140, height: 80 },
        { type: 'end', position: { x: 200, y: 540 }, text: 'Process Complete', width: 140, height: 60 }
      ],
      connections: [
        createConnection(0, 1, 'bottom', 'top'),
        createConnection(1, 2, 'bottom', 'top'),
        createConnection(2, 3, 'right', 'left', 'No'),
        createConnection(2, 4, 'bottom', 'top', 'Yes'),
        createConnection(4, 5, 'bottom', 'top')
      ]
    };
  }

  private generateGenericFlow(description: string): AIFlowChartResponse {
    const steps = this.extractStepsFromDescription(description);
    const nodes = [];
    const connections = [];

    nodes.push({
      type: 'start' as const,
      position: { x: 200, y: 50 },
      text: 'Start',
      width: 100,
      height: 60
    });

    let yOffset = 150;

    steps.forEach(step => {
      nodes.push({
        type: 'process' as const,
        position: { x: 200, y: yOffset },
        text: step,
        width: 160,
        height: 80
      });

      connections.push(
        createConnection(nodes.length - 2, nodes.length - 1, 'bottom', 'top')
      );

      yOffset += 140;
    });

    nodes.push({
      type: 'end' as const,
      position: { x: 200, y: yOffset },
      text: 'Complete',
      width: 100,
      height: 60
    });

    connections.push(createConnection(nodes.length - 2, nodes.length - 1, 'bottom', 'top'));

    return {
      nodes,
      connections,
      title: 'AI Generated Flow Chart',
      description: `Flow chart generated from: ${description}`
    };
  }

  private extractStepsFromDescription(description: string): string[] {
    const sentences = description.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);

    if (sentences.length <= 1) {
      return [
        'Initialize Process',
        'Execute Main Task',
        'Validate Results',
        'Finalize Process'
      ];
    }

    return sentences
      .map(sentence => {
        const cleaned = sentence.trim().replace(/^(then|next|after|finally)/i, '');
        return cleaned.length > 40 ? `${cleaned.substring(0, 37)}...` : cleaned;
      })
      .slice(0, 6);
  }
}

export const aiService = new AIFlowChartService();

function createConnection(
  fromIndex: number,
  toIndex: number,
  fromSide: AIFlowChartConnection['fromSide'],
  toSide: AIFlowChartConnection['toSide'],
  label = ''
): AIFlowChartConnection {
  return {
    fromIndex,
    toIndex,
    fromSide,
    toSide,
    label
  };
}
