# Multi-Category Retail Inventory & Billing System

A full stack web application for managing,  inventory, billing and sales analytics in a retail setting.

Tech stack used:
Frontend: HTML, CSS, JavaScript (or React/Vue)
● Backend: Node.js
● Database: JSON files
● Charts: Chart.js
● Code Assistant: Cursor AI, bolt ai

### 🏠 Dashboard (Homepage) - RetailPro
- Inventory metrics (total items, categories)
- Low stock alerts
- Recent sales feed
- System health/status cards

### 📂 Category Management (Admin)
- CRUD for categories
- Validation: prevents deletion if products exist
- Import/Export categories (CSV or JSON)

### 📦 Inventory Control
- Product schema: `id`, `name`, `SKU`, `categoryId`, `price`, `stock`, `reorderPoint`
- Batch stock updates
- Product image upload (max 1MB)
- Reorder alerts

### 🧾 Billing System
- Cart-based multi-item billing
- Auto-calculation: subtotal, tax (10%), discounts (fixed/percentage)
- PDF invoice generation
- Payment method tracking
- Automatic stock updates

### 📊 Analytics & Reporting
- Sales trends by date/category/product
- Top-selling items
- Downloadable reports: CSV, PDF, Excel
