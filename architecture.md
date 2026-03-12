# Supplier Product Matching System - Architecture & Roadmap

## 1. Backend Technology Recommendation
For a React (Vite) frontend, a **Node.js-based stack** is highly recommended for consistency in language (JavaScript/TypeScript) and speed of development.

- **Framework**: **NestJS** or **Fastify**.
  - *NestJS* is preferred for long-term scalability and built-in support for architectural patterns (Dependency Injection, Modules).
- **Database**: **PostgreSQL**.
  - A relational database is ideal for managing the structured relationships between Main Products, Suppliers, and Supplier Products.
- **ORM**: **Prisma**.
  - Provides type-safety, easy migrations, and an intuitive API for database operations.
- **Authentication**: **Passport.js** or **NextAuth.js** (if using Next.js) / **Firebase Auth** or **Supabase Auth** (if you want to offload auth management).
- **Matching Logic**:
  - Simple SKU matching in SQL/Prisma.
  - Fuzzy matching using a library like `fuse.js` or `natural` (Natural Language Processing for Node.js).

## 2. High-Level System Architecture
The system follows a classic **Client-Server-Database** architecture.

- **Frontend (React/Vite)**:
  - Handles the UI, state management (e.g., React Query for data fetching), and user interactions.
  - Communicates with the Backend via REST API.
- **Backend (Node.js)**:
  - Exposes REST endpoints for CRUD operations on products and suppliers.
  - Contains the **Import Engine** to process spreadsheets.
  - Contains the **Matching Engine** to suggest links between products.
- **Data Storage (PostgreSQL)**:
  - Stores user data, supplier profiles, main products, supplier products, and the matching links.
- **External Integration**:
  - **Google Sheets API / Excel Parser**: To fetch and read supplier catalog data.

## 3. Project Structure
A **Monorepo** structure is recommended for managing both services in one place.

```text
/supplier-product-matching-system
├── /supplier-client (Frontend - React + Vite)
│   ├── /src
│   │   ├── /api          (API service layers/hooks)
│   │   ├── /components   (Reusable UI components)
│   │   ├── /pages        (Route pages)
│   │   ├── /store        (State management)
│   │   └── /utils        (Fuzzy matching utils, formatters)
│   └── ...
├── /supplier-server (Backend - NestJS/Fastify)
│   ├── /src
│   │   ├── /auth         (Auth logic)
│   │   ├── /products     (Main products logic)
│   │   ├── /suppliers    (Supplier & catalog logic)
│   │   ├── /matching     (Matching engine service)
│   │   ├── /import       (Spreadsheet processing service)
│   │   └── prisma/       (Database schema and migrations)
│   └── ...
├── context.md
├── stories.md
└── architecture.md
```

## 4. Development Roadmap

### Phase 1: MVP (Minimum Viable Product)
- **Core Functionality**: Manual creation of Main Products and Suppliers.
- **Import**: Simple CSV/Excel upload (local file).
- **Matching**: Manual linking + Exact SKU matching suggestions.
- **Auth**: Basic Email/Password login.

### Phase 2: Version 2 (Efficiency & Automation)
- **Advanced Import**: Google Sheets API integration for live links.
- **Matching**: Fuzzy name matching (Similarity scores).
- **Dashboards**: Progress tracking and sourcing comparisons.
- **Bulk Actions**: Confirm multiple suggestions at once.

### Phase 3: Future Improvements
- **AI-Powered Matching**: Using LLMs to understand product context beyond name similarity.
- **API Integrations**: Direct connections to ERPs or Shopify/Amazon catalogs.
- **Automated Sync**: Schedule periodic re-imports of supplier catalogs.
- **Conflict Resolution**: Logic for when suppliers provide conflicting data.

## 5. Main Development Stages

1.  **Project Initialization**: Set up the Monorepo and basic boilerplate for React and Node.js.
2.  **Database Design**: Define the Prisma schema for Products, Suppliers, and Matches.
3.  **Authentication**: Implement Login/Logout and secure the API routes.
4.  **Supplier & Catalog Management**: Build the ability to create suppliers and view their (empty) catalogs.
5.  **Import Engine**: Develop the logic to parse external spreadsheets and populate the `SupplierProducts` table.
6.  **Main Catalog Development**: Build the CRUD for the store’s internal `MainProducts`.
7.  **Matching Engine**:
    - Implement the logic to create links in the `ProductMatches` table.
    - Build the Suggestion logic (SKU matching first, then Fuzzy).
8.  **UI Implementation**: Build the Product Matching interface where users see suggestions and confirm links.
9.  **Reporting & Dashboard**: Add visual progress indicators and sourcing overview.
