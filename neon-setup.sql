CREATE TABLE IF NOT EXISTS images (
  id serial PRIMARY KEY,
  mime_type text NOT NULL DEFAULT 'image/jpeg',
  data text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  sku text,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'عام',
  description text NOT NULL DEFAULT '',
  packets_per_carton integer NOT NULL DEFAULT 0,
  pieces_per_packet integer NOT NULL DEFAULT 0,
  carton_price double precision NOT NULL DEFAULT 0,
  packet_price double precision NOT NULL DEFAULT 0,
  piece_price double precision NOT NULL DEFAULT 0,
  retail_piece_price double precision NOT NULL DEFAULT 0,
  stock_cartons double precision NOT NULL DEFAULT 0,
  image_id integer,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);

CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  order_number text NOT NULL,
  customer_name text NOT NULL,
  shop_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  item_count integer NOT NULL DEFAULT 0,
  total_cost double precision NOT NULL DEFAULT 0,
  total_retail double precision NOT NULL DEFAULT 0,
  total_profit double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'جديد',
  whatsapp_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id integer,
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  unit text NOT NULL,
  qty double precision NOT NULL DEFAULT 1,
  unit_price double precision NOT NULL DEFAULT 0,
  line_cost double precision NOT NULL DEFAULT 0,
  line_retail double precision NOT NULL DEFAULT 0,
  line_profit double precision NOT NULL DEFAULT 0,
  packets_per_carton integer NOT NULL DEFAULT 0,
  pieces_per_packet integer NOT NULL DEFAULT 0,
  retail_piece_price double precision NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
