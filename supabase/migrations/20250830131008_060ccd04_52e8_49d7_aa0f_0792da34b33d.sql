-- Enable Row Level Security for all tables
ALTER TABLE btp.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.quantity_takeoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.notifications ENABLE ROW LEVEL SECURITY;
/**
-- Create RLS Policies for Projects
CREATE POLICY "Enable read access for all users" ON btp.projects
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON btp.projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON btp.projects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON btp.projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS Policies for Materials
CREATE POLICY "Enable read access for all users" ON btp.materials
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON btp.materials
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON btp.materials
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON btp.materials
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS Policies for Suppliers
CREATE POLICY "Enable read access for all users" ON btp.suppliers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON btp.suppliers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON btp.suppliers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON btp.suppliers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS Policies for Tenders
CREATE POLICY "Enable read access for all users" ON btp.tenders
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON btp.tenders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON btp.tenders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON btp.tenders
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS Policies for Documents
CREATE POLICY "Enable read access for all users" ON btp.documents
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON btp.documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users who uploaded or are assigned" ON btp.documents
    FOR UPDATE USING (auth.uid() = uploaded_by OR auth.uid() = assigned_to);

CREATE POLICY "Enable delete for users who uploaded" ON btp.documents
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Create RLS Policies for Quantity Takeoffs
CREATE POLICY "Enable read access for all users" ON btp.quantity_takeoffs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON btp.quantity_takeoffs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON btp.quantity_takeoffs
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON btp.quantity_takeoffs
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS Policies for Notifications
CREATE POLICY "Users can view their own notifications" ON btp.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON btp.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS Policies for Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS Policies for User Roles
CREATE POLICY "Users can view all user roles" ON public.user_roles
    FOR SELECT USING (true);

-- Create RLS Policies for Workspaces
CREATE POLICY "Users can view workspaces they own" ON btp.workspaces
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can update workspaces they own" ON btp.workspaces
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert workspaces as owner" ON btp.workspaces
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
    **/