-- HABILITAR EXTENSIÓN PARA UUID (si no existe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLA DE NEGOCIOS (TENANTS)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar que las columnas existan si la tabla ya fue creada
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='updated_at') THEN
        ALTER TABLE tenants ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- TABLA DE SUSCRIPCIONES
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'essential', 
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='updated_at') THEN
        ALTER TABLE subscriptions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- HABILITAR RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS TENANTS
DO $$ BEGIN
    DROP POLICY IF EXISTS "Permitir lectura pública de tenants" ON tenants;
    CREATE POLICY "Permitir lectura pública de tenants" ON tenants FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public Insert Tenants" ON tenants;
    CREATE POLICY "Public Insert Tenants" ON tenants FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Super Admin Full Access" ON tenants;
    CREATE POLICY "Super Admin Full Access" ON tenants FOR ALL TO authenticated 
    USING (lower(auth.jwt() ->> 'email') = 'programador.web.ernesto@gmail.com');
END $$;

-- POLÍTICAS SUBSCRIPTIONS
DO $$ BEGIN
    DROP POLICY IF EXISTS "Permitir lectura pública de subscriptions" ON subscriptions;
    CREATE POLICY "Permitir lectura pública de subscriptions" ON subscriptions FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Super Admin Subscriptions Access" ON subscriptions;
    CREATE POLICY "Super Admin Subscriptions Access" ON subscriptions FOR ALL TO authenticated 
    USING (lower(auth.jwt() ->> 'email') = 'programador.web.ernesto@gmail.com');
END $$;

-- FUNCIÓN UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGER TENANTS
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TABLA DE RESTAURANTES (CONFIGURACIÓN DE TIENDA)
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slogan TEXT,
  banner_url TEXT,
  logo_url TEXT,
  whatsapp_num TEXT,
  delivery_whatsapp_num TEXT,
  payment_whatsapp_num TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  location_url TEXT,
  open_time TEXT DEFAULT '08:00',
  close_time TEXT DEFAULT '22:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='updated_at') THEN
        ALTER TABLE restaurants ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- TABLA DE PEDIDOS (ORDERS)
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  gps_coords JSONB,
  items JSONB,
  subtotal DECIMAL(10,2),
  delivery_fee DECIMAL(10,2),
  total DECIMAL(10,2),
  payment_method TEXT,
  payment_details TEXT,
  payment_image_url TEXT,
  order_type TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='updated_at') THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- HABILITAR RLS OTROS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RESTAURANTS
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Read Restaurants" ON restaurants;
    CREATE POLICY "Public Read Restaurants" ON restaurants FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public Insert Restaurants" ON restaurants;
    CREATE POLICY "Public Insert Restaurants" ON restaurants FOR INSERT WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Admin Full Access Restaurants" ON restaurants;
    CREATE POLICY "Admin Full Access Restaurants" ON restaurants FOR ALL TO authenticated 
    USING (lower(auth.jwt() ->> 'email') = 'programador.web.ernesto@gmail.com');
END $$;

-- POLÍTICAS ORDERS
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Read Orders" ON orders;
    CREATE POLICY "Public Read Orders" ON orders FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public Insert Orders" ON orders;
    CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Admin Full Access Orders" ON orders;
    CREATE POLICY "Admin Full Access Orders" ON orders FOR ALL TO authenticated 
    USING (lower(auth.jwt() ->> 'email') = 'programador.web.ernesto@gmail.com');
END $$;

-- TRIGGERS OTROS
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
