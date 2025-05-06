
-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  progress INT NOT NULL,
  budget DECIMAL NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  thumbnail VARCHAR,
  team_size INT NOT NULL,
  coordinates_latitude FLOAT,
  coordinates_longitude FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create materials table
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL,
  unit VARCHAR NOT NULL,
  price_per_unit DECIMAL NOT NULL,
  inventory_count INT NOT NULL,
  source_location VARCHAR,
  coordinates_latitude FLOAT,
  coordinates_longitude FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_materials junction table
CREATE TABLE IF NOT EXISTS public.project_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (project_id, material_id)
);

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR,
  phone VARCHAR,
  national_id VARCHAR UNIQUE,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, national_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'national_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to add profile when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add Row Level Security policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Allow public read access to projects"
ON public.projects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to update their own projects"
ON public.projects FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow users to delete their own projects"
ON public.projects FOR DELETE
TO authenticated
USING (true);

-- Materials policies
CREATE POLICY "Allow public read access to materials"
ON public.materials FOR SELECT
TO authenticated
USING (true);

-- Project Materials policies
CREATE POLICY "Allow public read access to project materials"
ON public.project_materials FOR SELECT
TO authenticated
USING (true);

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
