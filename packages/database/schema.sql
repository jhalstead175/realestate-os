-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (synced from Clerk)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'assistant', 'client')),
  phone TEXT,
  brokerage_name TEXT,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads with lead scoring
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted')),
  lead_score INTEGER DEFAULT 0,
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  preferred_locations JSONB, -- Array of locations
  bedrooms_min INTEGER,
  bedrooms_max INTEGER,
  notes TEXT,
  assigned_to UUID REFERENCES profiles(id),
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property Listings (from IDX + manual)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mls_id TEXT UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  neighborhood TEXT,
  listing_price DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'withdrawn', 'expired')),
  property_type TEXT CHECK (property_type IN ('single_family', 'condo', 'townhouse', 'multi_family', 'land', 'commercial')),
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  square_feet INTEGER,
  lot_size INTEGER,
  year_built INTEGER,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}', -- Supabase storage URLs
  virtual_tour_url TEXT,
  listing_date DATE DEFAULT CURRENT_DATE,
  expiration_date DATE,
  is_idx BOOLEAN DEFAULT TRUE,
  idx_provider TEXT,
  idx_last_sync TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Searches (for leads & agents)
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  lead_id UUID REFERENCES leads(id),
  filters JSONB NOT NULL, -- All search criteria
  email_alerts BOOLEAN DEFAULT TRUE,
  frequency TEXT DEFAULT 'daily',
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions (SISU replacement)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number TEXT UNIQUE NOT NULL DEFAULT ('TXN-' || substr(md5(random()::text), 1, 8)),
  property_id UUID REFERENCES properties(id),
  listing_agent UUID REFERENCES profiles(id),
  buyer_agent UUID REFERENCES profiles(id),
  buyer_id UUID REFERENCES leads(id),
  seller_id UUID REFERENCES leads(id),
  offer_price DECIMAL(12,2),
  accepted_price DECIMAL(12,2),
  closing_price DECIMAL(12,2),
  contract_date DATE,
  closing_date DATE,
  closing_location TEXT,
  status TEXT DEFAULT 'pre_offer' CHECK (status IN (
    'pre_offer', 'offer_pending', 'under_contract', 
    'due_diligence', 'closing', 'closed', 'cancelled'
  )),
  commission_total DECIMAL(12,2),
  commission_split JSONB, -- {agent: 60%, brokerage: 30%, referral: 10%}
  earnest_money DECIMAL(12,2),
  earnest_money_holder TEXT,
  title_company TEXT,
  lender TEXT,
  inspector TEXT,
  docusign_envelope_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction Checklist (SISU killer feature)
CREATE TABLE transaction_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN (
    'financing', 'inspection', 'appraisal', 'title', 
    'insurance', 'repairs', 'closing', 'disclosures'
  )),
  assignee_id UUID REFERENCES profiles(id),
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  required_documents TEXT[], -- List of required docs
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communications (Unified Inbox)
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  transaction_id UUID REFERENCES transactions(id),
  type TEXT CHECK (type IN ('email', 'sms', 'call', 'note', 'meeting')),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- {opens: 0, clicks: 0, duration: 120}
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents (with e-signature tracking)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL, -- Supabase storage path
  file_type TEXT,
  size_bytes INTEGER,
  transaction_id UUID REFERENCES transactions(id),
  lead_id UUID REFERENCES leads(id),
  property_id UUID REFERENCES properties(id),
  category TEXT CHECK (category IN (
    'contract', 'disclosure', 'inspection', 'appraisal',
    'title', 'loan', 'insurance', 'other'
  )),
  docusign_envelope_id TEXT,
  docusign_status TEXT CHECK (docusign_status IN (
    'created', 'sent', 'delivered', 'signed', 'completed', 'declined', 'voided'
  )),
  signed_by JSONB, -- {name: "John Doe", email: "john@email.com", signed_at: "2024-01-01"}
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Workflows (Followup Boss replacement)
CREATE TABLE automation_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL, -- lead_created, property_viewed, email_opened, etc.
  trigger_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  steps JSONB NOT NULL, -- Array of actions with delays/conditions
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  lead_id UUID REFERENCES leads(id),
  event_type TEXT NOT NULL, -- lead_created, property_viewed, email_opened, etc.
  event_data JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties(city, state);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_communications_lead ON communications(lead_id);
CREATE INDEX idx_documents_transaction ON documents(transaction_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON automation_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies (basic - you'll customize these)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid()::text = clerk_id);
CREATE POLICY "Agents can view assigned leads" ON leads FOR SELECT USING (assigned_to IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()::text));