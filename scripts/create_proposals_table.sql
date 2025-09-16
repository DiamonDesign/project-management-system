-- Create proposals table for client task and project proposals
-- This table will store both task proposals (for existing projects) and project proposals (new projects)

CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Common fields for both types of proposals
  type VARCHAR(20) NOT NULL CHECK (type IN ('task', 'project')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_review')),
  
  -- Foreign keys
  client_id UUID REFERENCES auth.users(id) NOT NULL,
  project_id UUID REFERENCES projects(id), -- NULL for project proposals, set for task proposals
  designer_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Task-specific fields (only for task proposals)
  task_priority VARCHAR(10) CHECK (task_priority IN ('low', 'medium', 'high')),
  task_due_date DATE,
  
  -- Project-specific fields (only for project proposals)
  project_type VARCHAR(50),
  project_budget VARCHAR(100),
  project_timeline VARCHAR(100),
  
  -- Review fields
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_designer_id ON proposals(designer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_type ON proposals(type);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Clients can only see their own proposals
CREATE POLICY "Clients can view their own proposals" ON proposals
    FOR SELECT USING (auth.uid() = client_id);

-- Clients can insert their own proposals
CREATE POLICY "Clients can create proposals" ON proposals
    FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Designers can view proposals assigned to them
CREATE POLICY "Designers can view assigned proposals" ON proposals
    FOR SELECT USING (auth.uid() = designer_id);

-- Designers can update proposals assigned to them (for approval/rejection)
CREATE POLICY "Designers can update assigned proposals" ON proposals
    FOR UPDATE USING (auth.uid() = designer_id);

-- Admin users can view all proposals (if needed for admin dashboard)
CREATE POLICY "Admin users can view all proposals" ON proposals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Comments for documentation
COMMENT ON TABLE proposals IS 'Client proposals for tasks (within existing projects) and new projects';
COMMENT ON COLUMN proposals.type IS 'Type of proposal: task (for existing project) or project (new project)';
COMMENT ON COLUMN proposals.project_id IS 'NULL for project proposals, references existing project for task proposals';
COMMENT ON COLUMN proposals.task_priority IS 'Priority for task proposals only';
COMMENT ON COLUMN proposals.project_type IS 'Type of project for project proposals only';