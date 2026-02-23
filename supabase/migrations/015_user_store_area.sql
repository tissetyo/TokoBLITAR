-- Add address and area fields to users table for faster checkout
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS province text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS area_id text;

-- Add area_id to stores table for accurate origin calculation
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS area_id text;
