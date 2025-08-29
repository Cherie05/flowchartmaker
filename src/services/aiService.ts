import { AIFlowChartRequest, AIFlowChartResponse } from '../types/flowChart';

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
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'right', toSide: 'left', label: 'Invalid' },
        { fromSide: 'bottom', toSide: 'top', label: 'Valid' },
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'bottom', toSide: 'top', label: '' }
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
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'right', toSide: 'left', label: 'Invalid' },
        { fromSide: 'bottom', toSide: 'top', label: 'Valid' },
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'right', toSide: 'left', label: 'No Stock' },
        { fromSide: 'bottom', toSide: 'top', label: 'Available' },
        { fromSide: 'bottom', toSide: 'top', label: '' }
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
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'right', toSide: 'left', label: 'Fail' },
        { fromSide: 'bottom', toSide: 'top', label: 'Pass' },
        { fromSide: 'bottom', toSide: 'top', label: '' }
      ]
    }
  };

  async generateFlowChart(request: AIFlowChartRequest): Promise<AIFlowChartResponse> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const description = request.description.toLowerCase();
    
    // Find matching template
    for (const [key, template] of Object.entries(this.templates)) {
      if (description.includes(key.replace(' ', '')) || description.includes(key)) {
        return template as AIFlowChartResponse;
      }
    }

    // Check for common keywords and generate appropriate flows
    if (description.includes('login') || description.includes('authentication')) {
      return this.generateLoginFlow();
    }
    
    if (description.includes('payment') || description.includes('checkout')) {
      return this.generatePaymentFlow();
    }

    if (description.includes('approval') || description.includes('review')) {
      return this.generateApprovalFlow();
    }

    // Generate a generic process flow
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
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'right', toSide: 'left', label: 'Invalid' },
        { fromSide: 'bottom', toSide: 'top', label: 'Valid' },
        { fromSide: 'bottom', toSide: 'top', label: '' }
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
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'right', toSide: 'left', label: 'Invalid' },
        { fromSide: 'bottom', toSide: 'top', label: 'Valid' },
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'bottom', toSide: 'top', label: '' }
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
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'bottom', toSide: 'top', label: '' },
        { fromSide: 'right', toSide: 'left', label: 'No' },
        { fromSide: 'bottom', toSide: 'top', label: 'Yes' },
        { fromSide: 'bottom', toSide: 'top', label: '' }
      ]
    };
  }

  private generateGenericFlow(description: string): AIFlowChartResponse {
    const steps = this.extractStepsFromDescription(description);
    const nodes = [];
    const connections = [];

    // Start node
    nodes.push({
      type: 'start' as const,
      position: { x: 200, y: 50 },
      text: 'Start',
      width: 100,
      height: 60
    });

    let yOffset = 150;
    
    // Process nodes for each step
    steps.forEach((step, index) => {
      nodes.push({
        type: 'process' as const,
        position: { x: 200, y: yOffset },
        text: step,
        width: 160,
        height: 80
      });

      connections.push({
        fromSide: 'bottom' as const,
        toSide: 'top' as const,
        label: ''
      });

      yOffset += 140;
    });

    // End node
    nodes.push({
      type: 'end' as const,
      position: { x: 200, y: yOffset },
      text: 'Complete',
      width: 100,
      height: 60
    });

    connections.push({
      fromSide: 'bottom' as const,
      toSide: 'top' as const,
      label: ''
    });

    return {
      nodes,
      connections,
      title: 'AI Generated Flow Chart',
      description: `Flow chart generated from: ${description}`
    };
  }

  private extractStepsFromDescription(description: string): string[] {
    // Enhanced extraction logic
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 1) {
      // If only one sentence, create generic steps
      return [
        'Initialize Process',
        'Execute Main Task',
        'Validate Results',
        'Finalize Process'
      ];
    }
    
    return sentences.map(s => {
      const cleaned = s.trim().replace(/^(then|next|after|finally)/i, '');
      return cleaned.length > 40 ? cleaned.substring(0, 37) + '...' : cleaned;
    }).slice(0, 6); // Limit to 6 steps max
  }
}

export const aiService = new AIFlowChartService();