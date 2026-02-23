-- Add shipping configuration to stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS shipping_couriers text[] DEFAULT ARRAY['jne', 'jnt', 'sicepat', 'anteraja', 'pos', 'tiki'];

-- Add tracking information to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_tracking_code text;
