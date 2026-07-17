
**Role & Context**
Act as an Expert Full-Stack Developer specializing in Next.js (App Router), Supabase, Tailwind CSS, and `shadcn/ui`.
We are building an Admin Dashboard. The login logic to Supabase is already working, but we need to fix route protection, build the layout, and develop specific pages.

**Rules of Execution (STRICT)**

1. **Step-by-Step Only:** You MUST execute this plan sequentially. Do NOT proceed to the next step until you have provided the code for the current step and I have explicitly said "Proceed to next step" or "Approved".
2. **No Hallucination:** Use the standard `shadcn/ui` documentation and Next.js App Router best practices.
3. **No File Overwrites without Warning:** Tell me exactly which file you are creating or modifying before providing the code.
4. **Complete Code:** Provide complete functional code for each step, not just snippets, unless instructed otherwise.

### **PHASE 1: Dashboard Layout Setup**

**Objective:** Setup the base UI using `shadcn/ui` blocks.

* [x] **Task:** Implement the layout based on `dashboard-01` (`npx shadcn@latest add dashboard-01`).
* [x] **Requirement:** Create the global `layout.tsx` for the `/admin` route. Ensure the sidebar navigation and header are responsive and functional.

### **PHASE 2: Route Protection (Middleware)**

**Objective:** Secure the `/admin` routes. Currently, `/admin` can be accessed without logging in.

* [x] **Task:** Create or update Next.js `middleware.ts` (or Supabase route handler) to check for an active Supabase session.
* [x] **Requirement:**
  * [x] If a user tries to access `/admin/*` or `/admin` without a valid session, redirect them immediately to `/login`.
  * [x] If they are logged in, allow them to proceed.

### **PHASE 3: WebGIS Map Layout (`/admin/simulasi-k3`)**

**Objective:** Create a specialized full-screen map layout inside the admin panel.

* [x] **Task:** Create the page `/admin/simulasi-k3/page.tsx`.
* [x] **Requirement:**
  * [x] The admin sidebar and header MUST remain visible.
  * [x] The content area for the map MUST be full-size (taking up 100% of the remaining width and height of the viewport).
  * [x] Remove any default padding or margin from the content container specifically for this page.
  * [x] Use Tailwind utilities like `h-[calc(100vh-header_height)]`, `w-full`, `overflow-hidden` so it behaves exactly like a WebGIS interface.

### **PHASE 4: Data & User Roles Management**

**Objective:** Build the Data Management and RBAC (Role-Based Access Control) UI.

* [x] **Task:** Create a User Management page (`/admin/users`).
* [x] **Requirement:**
  * [x] Use `shadcn/ui` Data Table component to display the list of users and their roles.
  * [x] Include search, pagination, and basic filtering functionality.
  * [x] Create standard Form components (using `shadcn/ui` forms + Zod validation) for creating/editing users and assigning roles.
  * [x] Assume Supabase is the backend for data fetching.

**Semua fase telah diselesaikan.**
