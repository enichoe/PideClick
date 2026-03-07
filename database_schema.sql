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

-- MODIFICACIÓN PARA TENANTS (Asegurar owner_email)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='owner_email') THEN
        ALTER TABLE tenants ADD COLUMN owner_email TEXT;
    END IF;
END $$;

-- POLÍTICAS TENANTS (Dinámicas)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Permitir lectura pública de tenants" ON tenants;
    CREATE POLICY "Permitir lectura pública de tenants" ON tenants FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public Insert Tenants" ON tenants;
    CREATE POLICY "Public Insert Tenants" ON tenants FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Owners can update their own tenants" ON tenants;
    CREATE POLICY "Owners can update their own tenants" ON tenants FOR UPDATE 
    TO authenticated USING (lower(owner_email) = lower(auth.jwt() ->> 'email'));

    DROP POLICY IF EXISTS "Super Admin Full Access" ON tenants;
    CREATE POLICY "Super Admin Full Access" ON tenants FOR ALL TO authenticated 
    USING (lower(auth.jwt() ->> 'email') IN ('programador.web.ernesto@gmail.com', 'enichoe@gmail.com')); -- Añadido enichoe como posible admin
END $$;

-- POLÍTICAS SUBSCRIPTIONS (Dinámicas)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Permitir lectura pública de subscriptions" ON subscriptions;
    CREATE POLICY "Permitir lectura pública de subscriptions" ON subscriptions FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Owners can manage their subscriptions" ON subscriptions;
    CREATE POLICY "Owners can manage their subscriptions" ON subscriptions FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = subscriptions.tenant_id AND lower(tenants.owner_email) = lower(auth.jwt() ->> 'email')))
    WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = subscriptions.tenant_id AND lower(tenants.owner_email) = lower(auth.jwt() ->> 'email')));

    DROP POLICY IF EXISTS "Super Admin Subscriptions Access" ON subscriptions;
    CREATE POLICY "Super Admin Subscriptions Access" ON subscriptions FOR ALL TO authenticated 
    USING (lower(auth.jwt() ->> 'email') IN ('programador.web.ernesto@gmail.com', 'enichoe@gmail.com'))
    WITH CHECK (lower(auth.jwt() ->> 'email') IN ('programador.web.ernesto@gmail.com', 'enichoe@gmail.com'));
END $$;

-- TABLA DE RESTAURANTES (Asegurar owner_email para RLS directo y QRs)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='owner_email') THEN
        ALTER TABLE restaurants ADD COLUMN owner_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='yape_qr_url') THEN
        ALTER TABLE restaurants ADD COLUMN yape_qr_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='plin_qr_url') THEN
        ALTER TABLE restaurants ADD COLUMN plin_qr_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='is_active') THEN
        ALTER TABLE restaurants ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- POLÍTICAS RESTAURANTS (Dinámicas)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Read Restaurants" ON restaurants;
    CREATE POLICY "Public Read Restaurants" ON restaurants FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public Insert Restaurants" ON restaurants;
    CREATE POLICY "Public Insert Restaurants" ON restaurants FOR INSERT WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Owners can update their restaurants" ON restaurants;
    CREATE POLICY "Owners can update their restaurants" ON restaurants FOR UPDATE TO authenticated 
    USING (lower(owner_email) = lower(auth.jwt() ->> 'email'));

    DROP POLICY IF EXISTS "Admin Full Access Restaurants" ON restaurants;
    CREATE POLICY "Admin Full Access Restaurants" ON restaurants FOR ALL TO authenticated 
    USING (lower(auth.jwt() ->> 'email') IN ('programador.web.ernesto@gmail.com', 'enichoe@gmail.com'));
END $$;

-- POLÍTICAS ORDERS (Dinámicas)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Read Orders" ON orders;
    CREATE POLICY "Public Read Orders" ON orders FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public Insert Orders" ON orders;
    CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Owners can manage their orders" ON orders;
    CREATE POLICY "Owners can manage their orders" ON orders FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = orders.restaurant_id AND lower(restaurants.owner_email) = lower(auth.jwt() ->> 'email')));

    DROP POLICY IF EXISTS "Admin Full Access Orders" ON orders;
    CREATE POLICY "Admin Full Access Orders" ON orders FOR ALL TO authenticated 
    USING (lower(auth.jwt() ->> 'email') IN ('programador.web.ernesto@gmail.com', 'enichoe@gmail.com'));
END $$;


-- TRIGGERS OTROS
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
