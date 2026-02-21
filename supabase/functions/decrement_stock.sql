-- RPC function to decrement product stock atomically
CREATE OR REPLACE FUNCTION decrement_stock(p_id UUID, amount INT)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = stock - amount
  WHERE id = p_id AND stock >= amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
