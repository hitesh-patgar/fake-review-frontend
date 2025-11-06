-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products are viewable by everyone
CREATE POLICY "Products are viewable by everyone"
  ON public.products
  FOR SELECT
  USING (true);

-- Only authenticated users can create products
CREATE POLICY "Authenticated users can create products"
  ON public.products
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own products
CREATE POLICY "Users can update their own products"
  ON public.products
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Users can delete their own products
CREATE POLICY "Users can delete their own products"
  ON public.products
  FOR DELETE
  USING (auth.uid() = created_by);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_fake BOOLEAN DEFAULT false,
  confidence_score DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are viewable by everyone
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can update any review (for marking as fake)
CREATE POLICY "Admins can update any review"
  ON public.reviews
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample products
INSERT INTO public.products (name, description, price, category, image_url) VALUES
  ('Premium Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 149.99, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'),
  ('Smart Watch Pro', 'Feature-rich smartwatch with health tracking', 299.99, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'),
  ('Laptop Backpack', 'Durable backpack with laptop compartment', 79.99, 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62'),
  ('Bluetooth Speaker', 'Portable speaker with amazing sound quality', 89.99, 'Electronics'