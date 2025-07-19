-- Enable Row Level Security for all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantity_takeoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Projects
CREATE POLICY "Enable read access for all users" ON public.projects
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.projects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS Policies for Materials
CREATE POLICY "Enable read access for all users" ON public.materials
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.materials
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.materials
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.materials
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS Policies for Suppliers
CREATE POLICY "Enable read access for all users" ON public.suppliers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.suppliers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.suppliers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.suppliers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS Policies for Tenders
CREATE POLICY "Enable read access for all users" ON public.tenders
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.tenders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.tenders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.tenders
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS Policies for Documents
CREATE POLICY "Enable read access for all users" ON public.documents
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users who uploaded or are assigned" ON public.documents
    FOR UPDATE USING (auth.uid() = uploaded_by OR auth.uid() = assigned_to);

CREATE POLICY "Enable delete for users who uploaded" ON public.documents
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Create RLS Policies for Quantity Takeoffs
CREATE POLICY "Enable read access for all users" ON public.quantity_takeoffs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.quantity_takeoffs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.quantity_takeoffs
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.quantity_takeoffs
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS Policies for Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
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
CREATE POLICY "Users can view workspaces they own" ON public.workspaces
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can update workspaces they own" ON public.workspaces
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert workspaces as owner" ON public.workspaces
    FOR INSERT WITH CHECK (auth.uid() = owner_id);