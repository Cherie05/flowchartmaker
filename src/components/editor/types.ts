import type { LucideIcon } from 'lucide-react';
import type { FlowChartNode } from '../../types/flowChart';

export interface WorkspaceNodeType {
  type: FlowChartNode['type'];
  icon: LucideIcon;
  label: string;
  description: string;
  iconColor: string;
  surfaceClass: string;
}
