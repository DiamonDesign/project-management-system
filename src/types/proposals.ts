export interface Proposal {
  id: string;
  type: 'task' | 'project';
  title: string;
  description: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  client_id: string;
  designer_id: string;
  project_id?: string; // For task proposals
  
  // Task proposal specific fields
  task_priority?: 'low' | 'medium' | 'high';
  task_due_date?: string;
  
  // Project proposal specific fields
  project_type?: string;
  project_budget?: string;
  project_timeline?: string;
  
  created_at: string;
  updated_at: string;
}