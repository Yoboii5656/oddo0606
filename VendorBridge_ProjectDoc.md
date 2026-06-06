# VendorBridge — Complete Project Documentation
> Procurement & Vendor Management ERP — Full Technical Blueprint

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Recommended Tech Stack](#2-recommended-tech-stack)
3. [Why This Stack?](#3-why-this-stack)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Database Design (Supabase / PostgreSQL)](#5-database-design)
6. [Authentication & Roles (Supabase Auth)](#6-authentication--roles)
7. [Module Breakdown](#7-module-breakdown)
8. [API / RPC Layer](#8-api--rpc-layer)
9. [Email & PDF Strategy](#9-email--pdf-strategy)
10. [Real-Time & Notifications](#10-real-time--notifications)
11. [Development Roadmap](#11-development-roadmap)
12. [Environment Variables](#12-environment-variables)
13. [Quick Start](#13-quick-start)

---

## 1. Project Overview

VendorBridge is a **Procurement & Vendor Management ERP** that digitizes the full procurement lifecycle:

```
RFQ Creation → Vendor Quotation → Quotation Comparison → Approval → Purchase Order → Invoice
```

**Core Roles:**
| Role | Capabilities |
|---|---|
| Admin | Manage users, vendors, view analytics |
| Procurement Officer | Create RFQs, compare quotations, generate POs & Invoices |
| Manager / Approver | Approve or reject procurement requests |
| Vendor | Submit quotations, track RFQ status, view POs |

---

## 2. Recommended Tech Stack

### Frontend
| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR + SSG + API routes in one; fast, SEO-friendly |
| Language | **TypeScript** | Type safety = fewer bugs in ERP logic |
| Styling | **Tailwind CSS** | Rapid UI development, consistent design tokens |
| UI Components | **shadcn/ui** | Accessible, unstyled components built on Radix UI |
| State Management | **Zustand** | Lightweight, zero boilerplate for procurement state |
| Forms | **React Hook Form + Zod** | Validation + type-safe forms for complex procurement forms |
| Tables/Data | **TanStack Table v8** | Powerful for quotation comparison, PO listing |
| Charts | **Recharts** | Analytics dashboard, procurement trends |
| PDF Generation | **react-pdf / @react-pdf/renderer** | Generate invoice PDFs client-side |
| Date Handling | **date-fns** | Deadline management, timeline formatting |
| Icons | **Lucide React** | Consistent, clean iconset |

### Backend (BaaS — Supabase)
| Layer | Technology | Why |
|---|---|---|
| BaaS | **Supabase** | PostgreSQL + Auth + Storage + Realtime + Edge Functions |
| Database | **PostgreSQL** (via Supabase) | Relational, perfect for ERP relationships |
| Authentication | **Supabase Auth** | Email/password, magic links, JWT-based sessions |
| Storage | **Supabase Storage** | RFQ attachments, vendor documents |
| Realtime | **Supabase Realtime** | Live approval status updates, notifications |
| Edge Functions | **Supabase Edge Functions** (Deno) | Email sending, complex business logic |
| Row Level Security | **Supabase RLS** | Role-based data access enforced at DB level |

### Email
| Service | Technology |
|---|---|
| Transactional Email | **Resend** (via Supabase Edge Function) |
| Email Templates | **React Email** |

### Hosting & Deployment
| Service | Technology |
|---|---|
| Frontend Hosting | **Vercel** |
| Backend | **Supabase** (managed) |
| CI/CD | **GitHub Actions** (optional) |

---

## 3. Why This Stack?

### Supabase as BaaS — The Core Decision
- **Zero backend server to manage** — auth, database, storage, realtime all in one dashboard
- **PostgreSQL** is battle-tested for ERP-style relational data (vendors, POs, invoices all join naturally)
- **Row Level Security (RLS)** enforces role-based access at the database level — not just the API
- **Supabase Auth** handles email/password, sessions, JWT tokens out of the box
- **Supabase Realtime** gives live notifications without writing WebSocket code
- **Free tier** is generous enough to build and test the full application

### Next.js 14 — Speed of Development
- **App Router** with React Server Components = fast initial page loads
- **API Routes** handle anything Supabase Edge Functions can't (PDF rendering, etc.)
- **Built-in TypeScript** support reduces bugs in complex procurement logic

### shadcn/ui — Not a Component Library
shadcn/ui copies components directly into your project — you own the code, can customize everything, and it ships with Radix UI accessibility built in. Perfect for complex ERP forms and modals.

---

## 4. Project Folder Structure

```
vendorbridge/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Sidebar + header layout
│   │   ├── page.tsx              # Dashboard home
│   │   ├── vendors/
│   │   │   ├── page.tsx          # Vendor list
│   │   │   ├── new/page.tsx      # Register vendor
│   │   │   └── [id]/page.tsx     # Vendor detail
│   │   ├── rfqs/
│   │   │   ├── page.tsx          # RFQ list
│   │   │   ├── new/page.tsx      # Create RFQ
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # RFQ detail
│   │   │       ├── quotations/   # Quotation comparison
│   │   │       └── approval/     # Approval workflow
│   │   ├── purchase-orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── approvals/page.tsx
│   │   ├── activity/page.tsx
│   │   └── reports/page.tsx
│   └── api/
│       ├── invoices/[id]/pdf/route.ts   # PDF generation endpoint
│       └── webhooks/route.ts
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── DashboardLayout.tsx
│   ├── vendors/
│   │   ├── VendorForm.tsx
│   │   ├── VendorCard.tsx
│   │   └── VendorTable.tsx
│   ├── rfqs/
│   │   ├── RFQForm.tsx
│   │   ├── RFQStatusBadge.tsx
│   │   └── QuotationCompare.tsx
│   ├── approvals/
│   │   └── ApprovalTimeline.tsx
│   ├── invoices/
│   │   ├── InvoicePreview.tsx
│   │   └── InvoicePDF.tsx        # react-pdf component
│   └── dashboard/
│       ├── StatsCard.tsx
│       └── ProcurementChart.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (for RSC)
│   │   └── middleware.ts         # Auth middleware
│   ├── validations/              # Zod schemas
│   │   ├── vendor.ts
│   │   ├── rfq.ts
│   │   └── invoice.ts
│   └── utils.ts
│
├── hooks/
│   ├── useVendors.ts
│   ├── useRFQs.ts
│   ├── useApprovals.ts
│   └── useNotifications.ts       # Supabase Realtime hook
│
├── store/                        # Zustand stores
│   ├── authStore.ts
│   └── notificationStore.ts
│
├── types/
│   └── database.ts               # Generated Supabase types
│
├── supabase/
│   ├── migrations/               # SQL migration files
│   └── functions/                # Edge Functions
│       ├── send-invoice-email/
│       └── send-rfq-invite/
│
└── public/
    └── logo.svg
```

---

## 5. Database Design

All tables live in Supabase (PostgreSQL). Row Level Security is enabled on every table.

### Core Tables

#### `profiles` — Extended user info
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'procurement_officer', 'manager', 'vendor')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### `vendors` — Vendor master data
```sql
CREATE TABLE vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT,
  category        TEXT,                -- e.g. 'IT', 'Logistics', 'Raw Materials'
  gst_number      TEXT,
  pan_number      TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  pincode         TEXT,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
  rating          NUMERIC(2,1),        -- 1.0 to 5.0
  contact_person  TEXT,
  user_id         UUID REFERENCES profiles(id),  -- if vendor has portal access
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `rfqs` — Request for Quotations
```sql
CREATE TABLE rfqs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number      TEXT UNIQUE NOT NULL,   -- e.g. RFQ-2024-0001
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT DEFAULT 'draft' 
                  CHECK (status IN ('draft','open','under_review','approved','closed','cancelled')),
  deadline        DATE NOT NULL,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `rfq_items` — Line items inside an RFQ
```sql
CREATE TABLE rfq_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id       UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description  TEXT,
  quantity     NUMERIC NOT NULL,
  unit         TEXT NOT NULL,    -- e.g. 'pcs', 'kg', 'liters'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

#### `rfq_vendors` — Vendors invited to an RFQ
```sql
CREATE TABLE rfq_vendors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id      UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id   UUID REFERENCES vendors(id),
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  status      TEXT DEFAULT 'invited' CHECK (status IN ('invited','submitted','declined'))
);
```

#### `quotations` — Vendor quotation submissions
```sql
CREATE TABLE quotations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id          UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id       UUID REFERENCES vendors(id),
  status          TEXT DEFAULT 'submitted' 
                  CHECK (status IN ('draft','submitted','accepted','rejected')),
  delivery_days   INTEGER,
  notes           TEXT,
  total_amount    NUMERIC(12,2),
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `quotation_items` — Line items in a quotation
```sql
CREATE TABLE quotation_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id    UUID REFERENCES quotations(id) ON DELETE CASCADE,
  rfq_item_id     UUID REFERENCES rfq_items(id),
  unit_price      NUMERIC(10,2) NOT NULL,
  quantity        NUMERIC NOT NULL,
  total_price     NUMERIC GENERATED ALWAYS AS (unit_price * quantity) STORED
);
```

#### `approvals` — Approval workflow
```sql
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
```

#### `purchase_orders` — Generated after approval
```sql
CREATE TABLE purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number       TEXT UNIQUE NOT NULL,   -- e.g. PO-2024-0001
  quotation_id    UUID REFERENCES quotations(id),
  vendor_id       UUID REFERENCES vendors(id),
  rfq_id          UUID REFERENCES rfqs(id),
  status          TEXT DEFAULT 'issued' CHECK (status IN ('issued','delivered','cancelled')),
  delivery_date   DATE,
  total_amount    NUMERIC(12,2),
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `invoices` — Invoices from POs
```sql
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT UNIQUE NOT NULL,   -- e.g. INV-2024-0001
  po_id           UUID REFERENCES purchase_orders(id),
  vendor_id       UUID REFERENCES vendors(id),
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','cancelled')),
  subtotal        NUMERIC(12,2),
  tax_percent     NUMERIC(5,2) DEFAULT 18.00,  -- GST percentage
  tax_amount      NUMERIC(12,2),
  total_amount    NUMERIC(12,2),
  due_date        DATE,
  sent_at         TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `attachments` — Files for RFQs and quotations
```sql
CREATE TABLE attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL,   -- 'rfq', 'quotation', 'invoice'
  entity_id     UUID NOT NULL,
  file_name     TEXT NOT NULL,
  file_path     TEXT NOT NULL,   -- Supabase Storage path
  file_size     INTEGER,
  uploaded_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `activity_logs` — Full audit trail
```sql
CREATE TABLE activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES profiles(id),
  action        TEXT NOT NULL,        -- e.g. 'rfq.created', 'quotation.approved'
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  metadata      JSONB,                -- extra context (old value, new value, etc.)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `notifications` — In-app notifications
```sql
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,        -- 'rfq_invite', 'approval_needed', 'po_generated', etc.
  title         TEXT NOT NULL,
  message       TEXT,
  entity_id     UUID,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Relationships Diagram
```
auth.users (Supabase)
    │
    └── profiles (role, name)
            │
            ├── vendors (managed by admin/procurement officer)
            │       │
            │       └── rfq_vendors ──── rfqs
            │                               │
            │                               └── rfq_items
            │
            ├── quotations ◄── rfq_vendors
            │       │
            │       └── quotation_items ──► rfq_items
            │
            ├── approvals ◄── quotations
            │
            ├── purchase_orders ◄── approvals
            │
            └── invoices ◄── purchase_orders
```

---

## 6. Authentication & Roles

### Supabase Auth Setup
- Email + Password authentication (built-in)
- After signup → `profiles` table row is auto-created via **Supabase DB Trigger**
- JWT contains `user_id`; role is fetched from `profiles` table

### DB Trigger — Auto-create Profile on Signup
```sql
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
```

### Row Level Security — Examples

```sql
-- Vendors: visible to all authenticated users, editable only by admin
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors are viewable by all users"
  ON vendors FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Vendors editable by admin"
  ON vendors FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Quotations: vendor can only see their own
CREATE POLICY "Vendors see own quotations"
  ON quotations FOR SELECT
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','procurement_officer','manager'))
  );

-- Approvals: only managers can action
CREATE POLICY "Managers can update approvals"
  ON approvals FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
  );
```

---

## 7. Module Breakdown

### Module 1: Auth
- `app/(auth)/login` — Supabase `signInWithPassword()`
- `app/(auth)/signup` — `signUp()` with metadata (name, role)
- `app/(auth)/forgot-password` — `resetPasswordForEmail()`
- Middleware: check session on every route, redirect if unauthenticated

### Module 2: Dashboard
- Fetch counts: pending approvals, active RFQs, recent POs, recent invoices
- Analytics cards: total spend this month, vendors active, RFQs in progress
- Quick action buttons: + New RFQ, + Register Vendor

### Module 3: Vendor Management
- CRUD for vendors with GST, PAN, contact info
- Vendor category tags: IT, Logistics, Raw Materials, etc.
- Vendor status: Active / Inactive / Blacklisted
- Search + filter by category, status, rating
- Vendor rating displayed as stars

### Module 4: RFQ Creation
- Form: title, description, deadline, line items (product, qty, unit)
- Attach documents → upload to **Supabase Storage**
- Assign vendors → `rfq_vendors` insert + send email invite (Edge Function)
- Auto-generate `rfq_number` via DB function: `RFQ-{YEAR}-{SEQUENCE}`

### Module 5: Vendor Quotation Submission
- Vendor-facing portal: view invited RFQs
- Submit quotation with per-item pricing, delivery days, notes
- Allow draft save + final submission
- Status: Draft → Submitted

### Module 6: Quotation Comparison
- Side-by-side table per RFQ item: price per vendor
- Highlight lowest price per line item (green)
- Show total quotation amount, delivery days, vendor rating
- Sort by total price or delivery time
- Select winning quotation → triggers approval workflow

### Module 7: Approval Workflow
- Procurement Officer selects quotation → creates `approval` record (status: pending)
- Manager receives notification → reviews and approves/rejects with remarks
- Timeline view: Requested → Under Review → Approved/Rejected
- On approval → auto-generate Purchase Order

### Module 8: Purchase Orders & Invoices
- PO auto-generated with `po_number`: `PO-{YEAR}-{SEQUENCE}`
- Invoice generated from PO with GST calculation
- Invoice preview in-browser (react-pdf renderer)
- **Download as PDF** → react-pdf rendered on client
- **Print** → browser `window.print()` on the PDF preview
- **Send via Email** → call Supabase Edge Function → Resend API

### Module 9: Activity Logs & Notifications
- Every significant action (create RFQ, approve, generate PO) logs to `activity_logs`
- `notifications` table + Supabase Realtime subscription for live bell icon updates
- Activity timeline per entity (RFQ, PO, Invoice)

### Module 10: Reports & Analytics
- Recharts: monthly procurement spend trend (bar chart)
- Vendor performance table: quotations submitted, win rate, average rating
- Top vendors by spend
- Export to CSV (simple JSON → CSV conversion)

---

## 8. API / RPC Layer

Use Supabase **RPC (Remote Procedure Calls)** for complex operations that span multiple tables.

### Example: Generate Purchase Order After Approval
```sql
CREATE OR REPLACE FUNCTION generate_purchase_order(p_approval_id UUID)
RETURNS UUID AS $$
DECLARE
  v_po_id UUID;
  v_quotation quotations%ROWTYPE;
  v_po_number TEXT;
BEGIN
  -- Get quotation details
  SELECT q.* INTO v_quotation
  FROM approvals a
  JOIN quotations q ON q.id = a.quotation_id
  WHERE a.id = p_approval_id AND a.status = 'approved';

  -- Generate PO number
  v_po_number := 'PO-' || EXTRACT(YEAR FROM NOW())::TEXT || '-'
    || LPAD((SELECT COUNT(*) + 1 FROM purchase_orders)::TEXT, 4, '0');

  -- Insert PO
  INSERT INTO purchase_orders (po_number, quotation_id, vendor_id, rfq_id, total_amount, created_by)
  VALUES (v_po_number, v_quotation.id, v_quotation.vendor_id,
          v_quotation.rfq_id, v_quotation.total_amount, auth.uid())
  RETURNING id INTO v_po_id;

  -- Update quotation and RFQ status
  UPDATE quotations SET status = 'accepted' WHERE id = v_quotation.id;
  UPDATE rfqs SET status = 'approved' WHERE id = v_quotation.rfq_id;

  RETURN v_po_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Call from frontend:
```typescript
const { data } = await supabase.rpc('generate_purchase_order', {
  p_approval_id: approvalId
})
```

---

## 9. Email & PDF Strategy

### Email — Supabase Edge Function + Resend

```typescript
// supabase/functions/send-invoice-email/index.ts
import { Resend } from 'npm:resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
  const { invoice_id, vendor_email, pdf_url } = await req.json()

  await resend.emails.send({
    from: 'VendorBridge <noreply@yourcompany.com>',
    to: vendor_email,
    subject: `Invoice from VendorBridge`,
    html: `<p>Please find your invoice attached.</p>`,
    attachments: [{ filename: 'invoice.pdf', path: pdf_url }]
  })

  return new Response(JSON.stringify({ success: true }))
})
```

### PDF Generation — react-pdf
```typescript
// components/invoices/InvoicePDF.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export const InvoicePDF = ({ invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>INVOICE #{invoice.invoice_number}</Text>
      </View>
      {/* Line items, totals, GST breakdown */}
    </Page>
  </Document>
)
```

---

## 10. Real-Time & Notifications

### Supabase Realtime Subscription
```typescript
// hooks/useNotifications.ts
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useNotificationStore } from '@/store/notificationStore'

export function useNotifications(userId: string) {
  const addNotification = useNotificationStore(s => s.add)

  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        addNotification(payload.new)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])
}
```

---

## 11. Development Roadmap

### Phase 1 — Foundation (Week 1–2)
- [ ] Supabase project setup, all migrations
- [ ] Next.js project scaffold with TypeScript + Tailwind + shadcn/ui
- [ ] Auth: Login, Signup, Forgot Password, Middleware
- [ ] Dashboard skeleton with navigation
- [ ] Supabase client helpers (browser + server)

### Phase 2 — Core Modules (Week 3–4)
- [ ] Vendor Management (full CRUD + search/filter)
- [ ] RFQ Creation with line items + file attachments
- [ ] Vendor invitation email (Edge Function)
- [ ] Vendor portal: view & submit quotations

### Phase 3 — Procurement Workflow (Week 5–6)
- [ ] Quotation Comparison screen
- [ ] Approval Workflow (request → approve/reject)
- [ ] Purchase Order auto-generation (RPC)
- [ ] Invoice generation with GST calculation

### Phase 4 — Documents & Notifications (Week 7)
- [ ] Invoice PDF preview (react-pdf)
- [ ] PDF download + print
- [ ] Email invoice via Resend (Edge Function)
- [ ] Realtime notifications (Supabase Realtime)
- [ ] Activity Logs timeline

### Phase 5 — Reports & Polish (Week 8)
- [ ] Reports & Analytics (Recharts)
- [ ] CSV export
- [ ] Admin user management
- [ ] Role-based UI guards (hide buttons, routes per role)
- [ ] Mobile responsiveness audit
- [ ] Error handling & loading states polish

---

## 12. Environment Variables

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Server only — never expose to browser

# Email (Resend) — used in Edge Functions
RESEND_API_KEY=re_xxxxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 13. Quick Start

```bash
# 1. Create Next.js project
npx create-next-app@latest vendorbridge --typescript --tailwind --app

cd vendorbridge

# 2. Install dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install zustand react-hook-form zod @hookform/resolvers
npm install @tanstack/react-table recharts date-fns lucide-react
npm install @react-pdf/renderer

# 3. Install shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card dialog table badge input select form

# 4. Install Supabase CLI (for local dev + migrations)
npm install -g supabase
supabase login
supabase init
supabase link --project-ref your-project-ref

# 5. Run migrations
supabase db push

# 6. Generate TypeScript types from your DB schema
supabase gen types typescript --linked > types/database.ts

# 7. Start development
npm run dev
```

---

## Quick Reference: Supabase Client Setup

```typescript
// lib/supabase/client.ts — for use in Client Components
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

```typescript
// lib/supabase/server.ts — for use in Server Components & API Routes
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
}
```

---

*VendorBridge — Built with Next.js 14 + Supabase BaaS*
*Documentation Version 1.0*
