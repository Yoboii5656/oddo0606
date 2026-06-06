-- VendorBridge Database Schema
-- Run this in your Supabase SQL Editor or as a migration

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'procurement_officer', 'manager', 'vendor')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by all authenticated users"
  ON profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'procurement_officer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- VENDORS
-- ============================================
CREATE TABLE vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT,
  category        TEXT,
  gst_number      TEXT,
  pan_number      TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  pincode         TEXT,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
  rating          NUMERIC(2,1),
  contact_person  TEXT,
  user_id         UUID REFERENCES profiles(id),
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors viewable by all authenticated"
  ON vendors FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Vendors insertable by admin/procurement"
  ON vendors FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
  );

CREATE POLICY "Vendors updatable by admin"
  ON vendors FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- RFQs
-- ============================================
CREATE TABLE rfqs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number      TEXT UNIQUE NOT NULL DEFAULT ('RFQ-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('rfq_seq')::TEXT, 4, '0')),
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','open','under_review','approved','closed','cancelled')),
  deadline        DATE NOT NULL,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence for RFQ numbering
CREATE SEQUENCE IF NOT EXISTS rfq_seq START 1;

ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RFQs viewable by authenticated"
  ON rfqs FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "RFQs creatable by procurement/admin"
  ON rfqs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
  );

CREATE POLICY "RFQs updatable by creator or admin"
  ON rfqs FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- RFQ ITEMS
-- ============================================
CREATE TABLE rfq_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id       UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description  TEXT,
  quantity     NUMERIC NOT NULL,
  unit         TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rfq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RFQ items viewable by authenticated"
  ON rfq_items FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "RFQ items insertable by procurement/admin"
  ON rfq_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
  );

-- ============================================
-- RFQ VENDORS (invited vendors)
-- ============================================
CREATE TABLE rfq_vendors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id      UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id   UUID REFERENCES vendors(id),
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  status      TEXT DEFAULT 'invited' CHECK (status IN ('invited','submitted','declined'))
);

ALTER TABLE rfq_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RFQ vendors viewable by authenticated"
  ON rfq_vendors FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "RFQ vendors insertable by procurement/admin"
  ON rfq_vendors FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
  );

-- ============================================
-- QUOTATIONS
-- ============================================
CREATE TABLE quotations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id          UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id       UUID REFERENCES vendors(id),
  status          TEXT DEFAULT 'submitted' CHECK (status IN ('draft','submitted','accepted','rejected')),
  delivery_days   INTEGER,
  notes           TEXT,
  total_amount    NUMERIC(12,2),
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quotations viewable by internal roles"
  ON quotations FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','procurement_officer','manager'))
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Quotations insertable by vendor"
  ON quotations FOR INSERT WITH CHECK (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
  );

-- ============================================
-- QUOTATION ITEMS
-- ============================================
CREATE TABLE quotation_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id    UUID REFERENCES quotations(id) ON DELETE CASCADE,
  rfq_item_id     UUID REFERENCES rfq_items(id),
  unit_price      NUMERIC(10,2) NOT NULL,
  quantity        NUMERIC NOT NULL,
  total_price     NUMERIC GENERATED ALWAYS AS (unit_price * quantity) STORED
);

ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quotation items viewable like quotations"
  ON quotation_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_items.quotation_id
      AND (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','procurement_officer','manager'))
        OR q.vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
      )
    )
  );

-- ============================================
-- APPROVALS
-- ============================================
CREATE TABLE approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id    UUID REFERENCES quotations(id) ON DELETE CASCADE,
  requested_by    UUID REFERENCES profiles(id),
  approved_by     UUID REFERENCES profiles(id),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  remarks         TEXT,
  requested_at    TIMESTAMPTZ DEFAULT NOW(),
  actioned_at     TIMESTAMPTZ
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approvals viewable by internal roles"
  ON approvals FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','procurement_officer','manager'))
  );

CREATE POLICY "Approvals updatable by managers"
  ON approvals FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
  );

CREATE POLICY "Approvals insertable by procurement"
  ON approvals FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','procurement_officer'))
  );

-- ============================================
-- PURCHASE ORDERS
-- ============================================
CREATE TABLE purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number       TEXT UNIQUE NOT NULL,
  quotation_id    UUID REFERENCES quotations(id),
  vendor_id       UUID REFERENCES vendors(id),
  rfq_id          UUID REFERENCES rfqs(id),
  status          TEXT DEFAULT 'issued' CHECK (status IN ('issued','delivered','cancelled')),
  delivery_date   DATE,
  total_amount    NUMERIC(12,2),
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "POs viewable by authenticated"
  ON purchase_orders FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "POs insertable by procurement/admin"
  ON purchase_orders FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','procurement_officer'))
  );

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT UNIQUE NOT NULL,
  po_id           UUID REFERENCES purchase_orders(id),
  vendor_id       UUID REFERENCES vendors(id),
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','cancelled')),
  subtotal        NUMERIC(12,2),
  tax_percent     NUMERIC(5,2) DEFAULT 18.00,
  tax_amount      NUMERIC(12,2),
  total_amount    NUMERIC(12,2),
  due_date        DATE,
  sent_at         TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoices viewable by authenticated"
  ON invoices FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Invoices insertable by procurement/admin"
  ON invoices FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','procurement_officer'))
  );

-- ============================================
-- ATTACHMENTS
-- ============================================
CREATE TABLE attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  file_name     TEXT NOT NULL,
  file_path     TEXT NOT NULL,
  file_size     INTEGER,
  uploaded_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attachments viewable by authenticated"
  ON attachments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Attachments insertable by authenticated"
  ON attachments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- ACTIVITY LOGS
-- ============================================
CREATE TABLE activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES profiles(id),
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  metadata      JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity logs viewable by internal roles"
  ON activity_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','procurement_officer','manager'))
  );

CREATE POLICY "Activity logs insertable by authenticated"
  ON activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  message       TEXT,
  entity_id     UUID,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- RPC: Generate Purchase Order
-- ============================================
CREATE OR REPLACE FUNCTION generate_purchase_order(p_approval_id UUID)
RETURNS UUID AS $$
DECLARE
  v_po_id UUID;
  v_quotation quotations%ROWTYPE;
  v_po_number TEXT;
BEGIN
  SELECT q.* INTO v_quotation
  FROM approvals a
  JOIN quotations q ON q.id = a.quotation_id
  WHERE a.id = p_approval_id AND a.status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval not found or not approved';
  END IF;

  v_po_number := 'PO-' || EXTRACT(YEAR FROM NOW())::TEXT || '-'
    || LPAD((SELECT COUNT(*) + 1 FROM purchase_orders)::TEXT, 4, '0');

  INSERT INTO purchase_orders (po_number, quotation_id, vendor_id, rfq_id, total_amount, created_by)
  VALUES (v_po_number, v_quotation.id, v_quotation.vendor_id,
          v_quotation.rfq_id, v_quotation.total_amount, auth.uid())
  RETURNING id INTO v_po_id;

  UPDATE quotations SET status = 'accepted' WHERE id = v_quotation.id;
  UPDATE rfqs SET status = 'approved' WHERE id = v_quotation.rfq_id;

  RETURN v_po_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
