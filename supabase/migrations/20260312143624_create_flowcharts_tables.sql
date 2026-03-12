-- FlowChart Maker Database Schema
-- This migration creates the database schema for storing and managing flowcharts

-- Create flowcharts table
CREATE TABLE IF NOT EXISTS flowcharts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT 'Untitled Flowchart',
  description text,
  nodes jsonb DEFAULT '[]'::jsonb NOT NULL,
  connections jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_public boolean DEFAULT false NOT NULL
);

-- Create flowchart_shares table for sharing functionality
CREATE TABLE IF NOT EXISTS flowchart_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flowchart_id uuid REFERENCES flowcharts(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission text CHECK (permission IN ('view', 'edit')) DEFAULT 'view' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(flowchart_id, shared_with_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_flowcharts_user_id ON flowcharts(user_id);
CREATE INDEX IF NOT EXISTS idx_flowcharts_updated_at ON flowcharts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_flowchart_shares_flowchart_id ON flowchart_shares(flowchart_id);
CREATE INDEX IF NOT EXISTS idx_flowchart_shares_user_id ON flowchart_shares(shared_with_user_id);

-- Enable Row Level Security
ALTER TABLE flowcharts ENABLE ROW LEVEL SECURITY;
ALTER TABLE flowchart_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flowcharts table

-- Users can view their own flowcharts
CREATE POLICY "Users can view own flowcharts"
  ON flowcharts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can view public flowcharts
CREATE POLICY "Anyone can view public flowcharts"
  ON flowcharts FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Users can view flowcharts shared with them
CREATE POLICY "Users can view shared flowcharts"
  ON flowcharts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flowchart_shares
      WHERE flowchart_shares.flowchart_id = flowcharts.id
      AND flowchart_shares.shared_with_user_id = auth.uid()
    )
  );

-- Users can insert their own flowcharts
CREATE POLICY "Users can create own flowcharts"
  ON flowcharts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own flowcharts
CREATE POLICY "Users can update own flowcharts"
  ON flowcharts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can update flowcharts with edit permission
CREATE POLICY "Users can update shared flowcharts with edit permission"
  ON flowcharts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flowchart_shares
      WHERE flowchart_shares.flowchart_id = flowcharts.id
      AND flowchart_shares.shared_with_user_id = auth.uid()
      AND flowchart_shares.permission = 'edit'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flowchart_shares
      WHERE flowchart_shares.flowchart_id = flowcharts.id
      AND flowchart_shares.shared_with_user_id = auth.uid()
      AND flowchart_shares.permission = 'edit'
    )
  );

-- Users can delete their own flowcharts
CREATE POLICY "Users can delete own flowcharts"
  ON flowcharts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for flowchart_shares table

-- Users can view shares for their own flowcharts
CREATE POLICY "Users can view shares for own flowcharts"
  ON flowchart_shares FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flowcharts
      WHERE flowcharts.id = flowchart_shares.flowchart_id
      AND flowcharts.user_id = auth.uid()
    )
  );

-- Users can view their own share records
CREATE POLICY "Users can view own share records"
  ON flowchart_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_with_user_id);

-- Users can create shares for their own flowcharts
CREATE POLICY "Users can create shares for own flowcharts"
  ON flowchart_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flowcharts
      WHERE flowcharts.id = flowchart_shares.flowchart_id
      AND flowcharts.user_id = auth.uid()
    )
  );

-- Users can update shares for their own flowcharts
CREATE POLICY "Users can update shares for own flowcharts"
  ON flowchart_shares FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flowcharts
      WHERE flowcharts.id = flowchart_shares.flowchart_id
      AND flowcharts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flowcharts
      WHERE flowcharts.id = flowchart_shares.flowchart_id
      AND flowcharts.user_id = auth.uid()
    )
  );

-- Users can delete shares for their own flowcharts
CREATE POLICY "Users can delete shares for own flowcharts"
  ON flowchart_shares FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flowcharts
      WHERE flowcharts.id = flowchart_shares.flowchart_id
      AND flowcharts.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_flowcharts_updated_at
  BEFORE UPDATE ON flowcharts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();