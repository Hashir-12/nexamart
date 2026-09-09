-- Create carts table
CREATE TABLE carts (
  session_id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  order_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional indexes
CREATE INDEX idx_orders_session ON orders(session_id);