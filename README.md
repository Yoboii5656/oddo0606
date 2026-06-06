
A full-stack procurement and vendor management platform built for organizations to streamline their entire purchasing workflow — from requesting quotations to generating invoices.

**Live Demo:** [https://oddo0606-ei42lk8kd-manavs-projects-03539f52.vercel.app/](https://oddo0606-ei42lk8kd-manavs-projects-03539f52.vercel.app/)
---
## Demo Credentials

For testing purposes, use the following demo account:

| Email | Password |
|--------|----------|
| `admin@gmail.com` | `admin123` |

> **Warning:** These credentials are for demonstration and testing purposes only. Do not use them in a production environment, and replace them with secure credentials before deployment.
---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Backend & Auth | Supabase (PostgreSQL + Auth + RPC) |
| State Management | Zustand |
| Forms & Validation | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Features

### Authentication & Role-Based Access

- Email/password authentication via Supabase Auth
- Four distinct user roles with granular permissions:
  - **Admin** — Full access to all modules
  - **Procurement Officer** — Manages RFQs, vendors, POs, invoices, and reports
  - **Manager** — Approvals, oversight, activity logs, and reports
  - **Vendor** — Views assigned RFQs, submits quotations, views invoices
- Role-based sidebar navigation (each role sees only relevant modules)
- Protected routes with automatic redirect for unauthenticated users

---

### Dashboard

- **KPI Stats Cards** — Active RFQs, Active Vendors, Pending Approvals, Total Purchase Orders
- **Procurement Chart** — Monthly procurement trends visualization
- **Recent Activity Feed** — Latest actions across the platform with actor attribution
- **Quick Actions** — One-click buttons to create a new RFQ or register a vendor

---

### Vendor Management

- Full vendor registry with detailed profiles
- **Vendor Fields:** Name, email, phone, category, GST number, PAN number, full address (city, state, pincode), contact person, status, rating
- **Status Lifecycle:** Active → Inactive → Blacklisted
- Search and filter vendors by name or status
- Vendor detail pages with complete business information

---

### RFQs (Request for Quotations)

- Create RFQs with multi-item line items (product name, description, quantity, unit)
- Invite multiple active vendors to respond
- Auto-generated RFQ numbers for tracking
- **Status Lifecycle:** Draft → Open → Under Review → Approved → Closed / Cancelled
- Search and filter by title, RFQ number, or status
- RFQ detail view shows:
  - All requested items
  - Received quotations from vendors
  - Option to accept a quotation (auto-generates Purchase Order via Supabase RPC)

---

### Quotations

- Vendors submit quotations against RFQs with per-item unit pricing
- Auto-calculated totals per line item and grand total
- Delivery timeline (days) and notes
- **Status Lifecycle:** Draft → Submitted → Accepted / Rejected
- **Quotation Comparison:**
  - Side-by-side comparison of all quotations for an RFQ
  - Highlights lowest price, fastest delivery, and highest-rated vendor
  - Item-wise price comparison with best-price indicators per item

---

### Approvals Workflow

- Manager/admin approval queue for quotations
- Card-based UI showing quotation details (vendor, amount, RFQ title, requester)
- Approve or reject with remarks
- **Status Lifecycle:** Pending → Approved / Rejected
- Action timestamps and audit trail

---

### Purchase Orders

- Auto-generated from accepted quotations
- Links to vendor, RFQ, and quotation data
- **Status Lifecycle:** Issued → Delivered / Cancelled
- PO detail view with order breakdown
- Generate invoice directly from a PO

---

### Invoices

- Generated from Purchase Orders with automatic tax calculation (CGST + SGST at 18%)
- 30-day payment terms auto-applied
- **Status Lifecycle:** Draft → Sent → Paid / Cancelled
- **Invoice Detail (Print-Ready):**
  - Bill-to and vendor sections
  - PO reference number
  - Line items table with unit pricing
  - Tax breakdown (CGST/SGST)
  - Grand total
- **Actions:**
  - Download / Print (browser print dialog)
  - Email Invoice (pre-filled mailto link)
  - Mark as Paid

---

### Activity & Audit Logs

- Complete audit trail of all procurement actions across the platform
- Filter by category: All, RFQ, Approvals, Invoices, Vendors
- Timeline UI with contextual icons per action type
- Shows actor name, action description, and timestamp
- Human-readable action formatting

---

### Reports & Analytics

- **KPI Cards:** Total Spend, Total Orders, Active RFQs, Active Vendors (with YoY trend indicators)
- **Charts:**
  - Monthly Spend vs Budget (bar chart)
  - Spend by Category (pie chart)
  - Order Status Distribution (pie chart)
  - RFQ Trends over time (line chart)
  - Cost Savings Analysis (area chart)
  - Delivery Performance (stacked bar chart)
- **Top Vendors by Spend** — ranked table
- **Pending Actions** — summary of items requiring attention
- **Recent Procurement Activity** — tabular list of latest transactions
- **Export CSV** — download report data

---

### Notifications

- In-app notification system with bell icon and unread badge count
- Real-time notification state managed via Zustand store
- Mark individual or all notifications as read

---

### UI/UX

- **Dark/Light Theme** — toggle via next-themes
- **Responsive Layout** — collapsible sidebar, mobile-friendly tables
- **Design Language** — Vercel-inspired minimal aesthetic (Geist font, clean surfaces, subtle shadows)
- **Personalized Header** — "Welcome back, {name}" with role display and avatar dropdown

---

## Project Structure

```
vendorbridge/
├── app/
│   ├── (auth)/              # Login, Signup, Forgot Password
│   ├── (dashboard)/         # All authenticated pages (route group)
│   │   ├── activity/        # Activity logs
│   │   ├── approvals/       # Approval queue
│   │   ├── invoices/        # Invoice list + detail
│   │   ├── purchase-orders/ # PO list + detail
│   │   ├── quotations/      # List, submit, compare
│   │   ├── reports/         # Analytics dashboard
│   │   ├── rfqs/            # RFQ list, detail, create
│   │   └── vendors/         # Vendor list, detail, create
│   ├── auth/callback/       # Supabase auth callback
│   └── page.tsx             # Root redirect (→ dashboard or login)
├── components/
│   ├── dashboard/           # Stats cards, charts
│   ├── layout/              # Sidebar, Header, DashboardLayout
│   └── ui/                  # shadcn/ui primitives
├── lib/
│   ├── supabase/            # Server + client Supabase helpers
│   ├── validations/         # Zod schemas (RFQ, vendor, invoice)
│   ├── activity.ts          # Activity logging utility
│   └── utils.ts             # cn() and helpers
├── store/
│   ├── authStore.ts         # User profile state
│   └── notificationStore.ts # Notification state
├── types/
│   └── database.ts          # TypeScript interfaces for all entities
├── proxy.ts                 # Next.js 16 proxy (auth routing)
└── next.config.ts           # Next.js configuration
```

---

## Data Model

| Table | Description |
|-------|-------------|
| `profiles` | User accounts with role assignment |
| `vendors` | Vendor registry (GST, PAN, rating, status) |
| `rfqs` | Request for Quotations with status lifecycle |
| `rfq_items` | Line items per RFQ |
| `rfq_vendors` | Many-to-many RFQ ↔ Vendor invitations |
| `quotations` | Vendor responses to RFQs |
| `quotation_items` | Per-item pricing in quotations |
| `approvals` | Approval workflow records |
| `purchase_orders` | Generated from accepted quotations |
| `invoices` | Generated from POs with tax calculation |
| `attachments` | File attachments (RFQs, quotations, invoices) |
| `activity_logs` | Full audit trail |
| `notifications` | In-app notification records |

---

## Getting Started

First, run the development server:
### Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase project (with tables matching the data model above)

### Installation

```bash
git clone <repository-url>
cd vendorbridge
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
Open [http://localhost:3000](http://localhost:3000) in your browser.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
### Production Build

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
```bash
npm run build
npm run start
```

## Learn More
---

To learn more about Next.js, take a look at the following resources:
## Deployment

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
Deployed on **Vercel** with automatic deployments from Git.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
- Root Directory: `vendorbridge`
- Framework Preset: Next.js
- Environment variables configured in Vercel project settings

## Deploy on Vercel
---

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
## License

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
Private project.
