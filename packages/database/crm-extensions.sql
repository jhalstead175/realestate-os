-- Lead Scoring Rules
CREATE TABLE lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  condition JSONB NOT NULL, -- {field: "source", operator: "equals", value: "website"}
  points INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Tags for Categorization
CREATE TABLE lead_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead-Tag Junction
CREATE TABLE lead_tag_junction (
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES lead_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (lead_id, tag_id)
);

-- Tasks & Follow-ups
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  lead_id UUID REFERENCES leads(id),
  assigned_to UUID REFERENCES profiles(id),
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  task_type TEXT CHECK (task_type IN ('call', 'email', 'meeting', 'follow_up', 'other')),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Activity Log
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created', 'status_changed', 'note_added', 'email_sent', 
    'email_received', 'call_made', 'call_received', 'meeting_scheduled',
    'meeting_completed', 'task_created', 'task_completed', 'lead_score_changed',
    'property_viewed', 'document_sent', 'document_signed'
  )),
  activity_data JSONB NOT NULL,
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'follow_up', 'property_alert', 'meeting', 'closing')),
  variables JSONB DEFAULT '[]', -- Available merge variables
  is_system_template BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Triggers
CREATE TABLE automation_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN (
    'lead_created', 'lead_status_changed', 'lead_score_threshold',
    'email_opened', 'email_clicked', 'email_replied',
    'call_made', 'call_received', 'meeting_scheduled',
    'property_viewed', 'document_signed', 'no_activity_for_days'
  )),
  trigger_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Actions
CREATE TABLE automation_actions (
  id UUID PRIMARY DEFAULT uuid_generate_v4(),
  trigger_id UUID REFERENCES automation_triggers(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'send_email', 'send_sms', 'create_task', 'update_lead_status',
    'assign_to_agent', 'update_lead_score', 'add_tag', 'remove_tag',
    'add_to_sequence', 'create_activity'
  )),
  action_config JSONB NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Sequences (Drip Campaigns)
CREATE TABLE lead_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sequence Steps
CREATE TABLE sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES lead_sequences(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL CHECK (step_type IN ('email', 'sms', 'task', 'delay', 'condition')),
  step_config JSONB NOT NULL,
  delay_days INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead-Enrollment in Sequences
CREATE TABLE lead_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES lead_sequences(id),
  current_step_id UUID REFERENCES sequence_steps(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_action_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for Performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_lead_score ON leads(lead_score);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_activities_created_at ON lead_activities(created_at);
CREATE INDEX idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_communications_lead_id ON communications(lead_id);
CREATE INDEX idx_communications_created_at ON communications(created_at);

-- View for Lead Funnel Analytics
CREATE VIEW lead_funnel_metrics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  status,
  COUNT(*) as lead_count,
  COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned_count,
  AVG(lead_score) as avg_score
FROM leads
GROUP BY DATE_TRUNC('day', created_at), status;

-- RLS Policies for CRM
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tag_junction ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their leads' tags" ON lead_tags
  FOR ALL USING (created_by = auth.uid()::uuid);

CREATE POLICY "Agents can manage tasks for their leads" ON tasks
  FOR ALL USING (
    assigned_to = auth.uid()::uuid 
    OR created_by = auth.uid()::uuid
    OR lead_id IN (SELECT id FROM leads WHERE assigned_to = auth.uid()::uuid)
  );

CREATE POLICY "Agents can view activities for their leads" ON lead_activities
  FOR SELECT USING (
    lead_id IN (SELECT id FROM leads WHERE assigned_to = auth.uid()::uuid)
  );