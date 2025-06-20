-- Create users table with roles
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inspection_reports table
CREATE TABLE IF NOT EXISTS inspection_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  contact_no VARCHAR(50),
  address TEXT NOT NULL,
  claim_number VARCHAR(100),
  policy_number VARCHAR(100),
  inspector_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'reviewed')),
  report_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create damage_causes lookup table
CREATE TABLE IF NOT EXISTS damage_causes (
  id SERIAL PRIMARY KEY,
  code CHAR(1) NOT NULL UNIQUE,
  description VARCHAR(100) NOT NULL
);

-- Insert damage cause codes
INSERT INTO damage_causes (code, description) VALUES
('A', 'Lighting'),
('B', 'Power surge / Dip'),
('C', 'Wear & Tear'),
('D', 'Water Damage'),
('E', 'Component Failure'),
('F', 'No Damage')
ON CONFLICT (code) DO NOTHING;

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON inspection_reports
  FOR SELECT USING (inspector_id = auth.uid());

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON inspection_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert their own reports
CREATE POLICY "Users can create reports" ON inspection_reports
  FOR INSERT WITH CHECK (inspector_id = auth.uid());

-- Users can update their own reports
CREATE POLICY "Users can update own reports" ON inspection_reports
  FOR UPDATE USING (inspector_id = auth.uid());
