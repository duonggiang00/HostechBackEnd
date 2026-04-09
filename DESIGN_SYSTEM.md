1. Color System
Colors greatly influence the user experience; therefore, this palette uses cool tones as the primary base to provide a sense of security, while adding warm colors at strategic positions so the interface stands out.

Primary Color: #1E3A8A (Navy Blue). This tone creates a more professional and reliable feeling than bright colors, perfect for real estate or financial apps.

Accent Color: #F59E0B (Amber). Dedicated to Call-to-Action buttons (Add Room, Create Invoice). This color brings a warm feeling similar to autumn weather, creating the best contrast on light backgrounds.

Background Colors:

App Background: #F3F4F6 (Light Gray).

Card/Container Background: #FFFFFF (White).

Text Colors:

Heading: #111827 (Dark Gray - This is the most readable color code on screens).

Body Text: #4B5563 (Ash Gray).

Status Colors: This color system requires strict compliance so managers easily recognize room statuses when they are managing a large volume:

Available: #10B981 (Green).

Rented: #EF4444 (Red).

Maintenance/Pending: #F59E0B (Yellow/Amber).

2. Typography
Modern admin interfaces always prioritize minimalism; thus, you should choose sans-serif fonts to optimize data display in tables.

Font Family: Inter or Roboto.

Typographic Scale: To make the information hierarchy clearer, break down the sizes as follows:

H1 (Page Title): 24px - Weight: 700 (Bold).

H2 (Widget Title): 20px - Weight: 600 (Semi-bold).

Body (Main content, table data): 14px - Weight: 400 (Regular).

Small (Notes, Status Badges): 12px - Weight: 400.

3. Sizing & Grid
To prevent the UI from becoming messy, this design system includes a spacing set based on multiples of 4 (4pt grid). Strictly applying this rule speeds up your CSS alignment process significantly.

Basic Margin / Padding:

sm: 8px (Used for the space between an Icon and Text inside a button).

md: 16px (Standard padding inside cards).

lg: 24px (Spacing between components and larger sections).

Border Radius:

Buttons / Input forms: 6px or 8px.

Cards / Modal: 12px (A larger border radius makes the design look softer and friendlier).

4. Modern Sidebar Design
The sidebar is the most important navigation component of an Admin page. Currently, you are coding this frame; however, to meet modern standards, lay out the structure as follows:

A. Dimensions:

Expanded: Fixed width 260px.

Collapsed: Width 80px. Allowing the sidebar to collapse provides a more spacious workspace for complex tables.

B. Color and Structure:

Instead of using a fully dark Sidebar, use a white background (#FFFFFF) combined with an ultra-thin right border (#E5E7EB). This approach creates a clearer and more airy space.

C. Menu Item States:

Default: Both Text and Icon use a neutral gray (#6B7280).

Hover: The item background changes to light gray (#F3F4F6), and the text becomes darker (#111827).

Active: When a user is viewing a specific page (e.g., "Utilities"), the menu background shifts to light blue (#EFF6FF), while the text and Icon turn to Primary Blue (#1E3A8A). Moreover, you need to add a 4px thick blue left border to mark the current location in the clearest way.

D. Layout Placement:

Top: App logo and system name (bolded).

Middle: Main navigation items grouped together (Room Management, Tenants, Services, Invoices).

Bottom: The User profile area, "Settings", and "Logout" buttons are pushed completely to the bottom. This arrangement clears up the main viewing area of the menu, helping users focus better on daily operational tasks.