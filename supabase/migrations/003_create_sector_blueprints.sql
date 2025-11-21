-- Create sector blueprints table
CREATE TABLE sector_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    short_description TEXT,
    default_data_schema JSONB,
    default_workflows JSONB,
    default_ui_layout JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sector_blueprints ENABLE ROW LEVEL SECURITY;

-- Create policies - allow all authenticated users to read
CREATE POLICY "Authenticated users can view sector blueprints" ON sector_blueprints
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert sample sector blueprints
INSERT INTO sector_blueprints (sector_code, name, short_description, default_data_schema, default_workflows, default_ui_layout) VALUES
('saas', 'SaaS Platform', 'Software as a Service platform with subscription model', 
'{"entities": ["users", "subscriptions", "payments", "features"], "relationships": {"users": {"subscriptions": "one-to-many"}}}', 
'{"onboarding": "user_signup", "billing": "subscription_renewal", "feature_access": "permission_check"}', 
'{"navigation": ["dashboard", "analytics", "users", "billing"], "theme": "modern"}'),

('agency', 'Digital Agency', 'Service-based business with client management', 
'{"entities": ["clients", "projects", "team_members", "invoices"], "relationships": {"clients": {"projects": "one-to-many"}}}', 
'{"client_onboarding": "project_setup", "project_delivery": "milestone_tracking", "billing": "invoice_generation"}', 
'{"navigation": ["clients", "projects", "team", "finances"], "theme": "professional"}'),

('ecommerce', 'E-commerce Store', 'Online retail platform with product management', 
'{"entities": ["products", "orders", "customers", "inventory"], "relationships": {"customers": {"orders": "one-to-many"}}}', 
'{"order_processing": "payment_confirmation", "inventory": "stock_alert", "shipping": "delivery_tracking"}', 
'{"navigation": ["products", "orders", "customers", "analytics"], "theme": "retail"}'),

('hotel', 'Hotel Management', 'Hospitality property management system', 
'{"entities": ["rooms", "bookings", "guests", "services"], "relationships": {"rooms": {"bookings": "one-to-many"}}}', 
'{"booking": "availability_check", "checkin": "room_assignment", "checkout": "billing_summary"}', 
'{"navigation": ["rooms", "bookings", "guests", "services"], "theme": "hospitality"}'),

('legaltech', 'Legal Tech Platform', 'Legal practice management and automation', 
'{"entities": ["cases", "clients", "documents", "time_tracking"], "relationships": {"clients": {"cases": "one-to-many"}}}', 
'{"case_intake": "client_onboarding", "document_generation": "template_filling", "billing": "time_tracking"}', 
'{"navigation": ["cases", "clients", "documents", "billing"], "theme": "legal"}');