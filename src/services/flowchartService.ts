import { supabase } from '../lib/supabase';
import { FlowChart } from '../types/flowChart';

export const flowchartService = {
  async getAllFlowcharts() {
    const { data, error } = await supabase
      .from('flowcharts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getFlowchartById(id: string) {
    const { data, error } = await supabase
      .from('flowcharts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createFlowchart(flowchart: Partial<FlowChart>) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('flowcharts')
      .insert({
        user_id: user.id,
        name: flowchart.name || 'Untitled Flowchart',
        description: null,
        nodes: flowchart.nodes || [],
        connections: flowchart.connections || [],
        is_public: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateFlowchart(id: string, updates: Partial<FlowChart>) {
    const { data, error } = await supabase
      .from('flowcharts')
      .update({
        name: updates.name,
        nodes: updates.nodes,
        connections: updates.connections,
        is_public: updates.is_public
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFlowchart(id: string) {
    const { error } = await supabase
      .from('flowcharts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async duplicateFlowchart(id: string) {
    const original = await this.getFlowchartById(id);
    if (!original) throw new Error('Flowchart not found');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('flowcharts')
      .insert({
        user_id: user.id,
        name: `${original.name} (Copy)`,
        description: original.description,
        nodes: original.nodes,
        connections: original.connections,
        is_public: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
