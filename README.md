# Lost-Link — College Campus Lost & Found System

Lost-Link is a distinctive, production-ready web application designed for universities, colleges, and educational institutions to manage lost and found property using the tactile visual language of luggage claim tickets, cloakroom stubs, and rubber ink stamps.

> **Tagline:** "Lost it? Link it back."

---

## 🌟 Key Features

1. **Found Item Reporting ("Link a Found Item")**:
   - Report items found anywhere on campus with rich metadata (category, location, date, photos in vintage polaroid frames, storage bin ID, secret identifying marks).
2. **Lost Item Reporting ("Link a Lost Item")**:
   - Submit lost item tickets with last seen locations, unique serial numbers or lock screen wallpapers, and descriptions.
3. **Smart Inventory Search & Tag Filters**:
   - Ticket-counter search slot by keyword, category tag labels (electronics, wallets & IDs, keys, bags, books, etc.), campus building/zone, date window, and status stamps (`unclaimed`, `in_review`, `claimed`, `returned`).
4. **Claim Request Workflow**:
   - Students can submit ownership proof (photo proof, serial number, answers to identifying questions).
   - Prevents duplicate claims while tracking claim status in real-time.
5. **Admin Verification & Storage Management**:
   - Campus security & administrators can review, catalog, store in specific lockers, approve or reject claims, and schedule item pickups.
6. **Smart Matchmaker**:
   - Algorithmic pairing engine comparing Lost Item Reports against Found Items based on category, location proximity, date delta, and description keywords.
7. **Complete Status Audit History**:
   - Immutable historical ledger documenting every status change (`unclaimed` -> `in_review` -> `claimed` -> `returned`), with the changer's role, name, timestamp, and verification notes.
8. **Signature Stamp Animation**:
   - Rubber ink stamp thumping animation when new tickets are linked, matched, or returned to their owners.
9. **Role-Based Access Control**:
   - Student & Staff access vs. Administrator command center with dedicated dashboards and protected routes.
10. **Zero-Friction Demo Mode**:
   - Works immediately out-of-the-box with pre-seeded campus items and instant one-click login for both Student and Admin roles, while fully connecting to live Supabase when `.env` credentials are provided.

---

## 🎨 Visual Identity: "Claim Ticket"

- **Base Colors:** Warm kraft paper & cream (`#F4ECE1`), deep ink black (`#1E1B18`)
- **Action Colors:** Signal red-orange (`#D94825`) for LOST, deep teal green (`#0E6251`) for FOUND
- **Wordmark & Logo:** Custom inline SVG wordmark with interlocking chain link hyphen and luggage tag mark with woven string loop
- **Ticket Stubs:** Punched eyelet hole at the top with a string loop, perforated edges, and monospace ticket numbers (e.g. `No. 0427`)
- **Stamps:** Vintage rubber-stamp badges slightly tilted with ink texture
- **Polaroid Frames:** Photo uploads styled as pinned or taped polaroids

---

## 📂 Project Architecture

```
src/
├── components/          # Reusable accessible UI components
│   ├── Alert.tsx        # Success/warning/error banners
│   ├── Button.tsx       # Accessible button variants (primary, secondary, danger, ghost)
│   ├── EmptyState.tsx   # Informative empty states with call to actions
│   ├── ImageUploader.tsx# Polaroid-style photo upload with live preview
│   ├── Input.tsx        # Styled input with labels, validation errors, and helper text
│   ├── ItemCard.tsx     # Claim ticket card with punch hole, string loop & stub
│   ├── Logo.tsx         # Lost-Link Wordmark and Luggage Tag Logo Mark
│   ├── Modal.tsx        # Accessible dialog with keyboard navigation & backdrop trap
│   ├── ProtectedRoute.tsx # Route guard for authenticated users
│   ├── AdminRoute.tsx   # Route guard strictly for admin users
│   ├── Spinner.tsx      # Interlocking chain link animation
│   └── StatusBadge.tsx  # Ink rubber-stamps (LOST, FOUND, RETURNED, IN REVIEW)
├── context/
│   └── AuthContext.tsx  # Central auth session, current user, role, and profile state
├── layouts/
│   ├── AppLayout.tsx    # Student portal shell with claim dispatch bar and footer
│   └── AdminLayout.tsx  # Admin dispatcher desk with management sidebar
├── lib/
│   ├── constants.ts     # Categories, locations, status enums, demo presets
│   ├── formatters.ts    # Date, time-ago, phone, and text formatters
│   ├── validation.ts    # Comprehensive client-side validators
│   └── matching.ts      # Automated lost & found pairing algorithm
├── pages/
│   ├── AdminDashboard.tsx # Comprehensive admin control center & audit logs
│   ├── BrowseItems.tsx    # Claim ticket board with counter slot search
│   ├── Claims.tsx         # My Claims review and pickup coordination
│   ├── Dashboard.tsx      # Personal student portal (my ticket envelope)
│   ├── FoundItemForm.tsx  # Link a Found Item ticket form
│   ├── ItemDetails.tsx    # Detailed ticket view with stub, photo & claim modal
│   ├── Login.tsx          # Ticket kiosk sign-in with quick student/admin demo switch
│   ├── LostReportForm.tsx # Link a Lost Item ticket form
│   ├── NotFound.tsx       # 404 handler
│   └── Register.tsx       # Campus Claim ID registration form
├── services/
│   ├── claims.ts          # Claim submission, status review, and retrieval
│   ├── foundItems.ts      # Found items CRUD and status history fetcher
│   ├── lostReports.ts     # Lost tickets CRUD and matching queries
│   ├── profiles.ts        # User profile query and updates
│   └── storage.ts         # Supabase Storage client with client-side fallback
├── supabaseClient.ts      # Dual-mode Supabase client (Live Supabase + Mock Storage)
├── App.tsx                # React Router v6 tree with route protection
└── main.tsx               # App entrypoint
```

---

## 🗄️ Database Migrations

SQL migrations are located in `/supabase/migrations/`:

- `001_initial_schema.sql`: Core tables (`profiles`, `categories`, `campus_locations`, `found_items`, `lost_reports`, `claims`, `item_status_history`).
- `002_rls_policies.sql`: Row-Level Security rules enforcing ownership and admin permissions.
- `003_storage_policies.sql`: Storage policies for `item-photos` (public read) and `claim-proofs` (restricted to claimant & admin).
- `004_functions_triggers.sql`: User profile auto-creation trigger, status transition audit trail trigger, and seed data.

---

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Environment Variables**:
   Copy `.env.example` to `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
4. **Run Unit Tests**:
   ```bash
   node --test
   ```

---

## 👥 Demo Accounts

If running without a live Supabase backend, you can use the one-click demo credentials directly on the login page:

- **Student Account**: `alex.rivera@campus.edu` / `Password123!` (Roll: `2024CS104`)
- **Admin Account**: `marcus.security@campus.edu` / `AdminPass123!` (Roll: `FACULTY-09`)
