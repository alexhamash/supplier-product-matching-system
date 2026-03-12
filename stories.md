# Supplier Product Matching System - MVP User Stories

## Main Product Catalog

### US 1: View Central List of Main Products
- **Statement**: As a store manager, I want to view a central list of my store's internal products, so that I can see what items need supplier matches.
- **Acceptance Criteria**:
  - List displays product name, SKU, brand, and category.
  - List displays a "Matching Status" (e.g., number of linked supplier products).
  - Search/Filter functionality to find specific main products.
- **Dependencies**: Database setup for Main Products table.
- **Edge Cases**:
  - Catalog is empty (display empty state).
  - Very large catalog (pagination required).
  - Special characters in product names/SKUs.

### US 2: Add New Main Product
- **Statement**: As a store manager, I want to add new products to my main catalog with a name, SKU, brand, and category, so that they can be linked to supplier products.
- **Acceptance Criteria**:
  - Form validation: Name and SKU are mandatory.
  - System prevents duplicate SKUs within the Main Product catalog.
  - Successful addition triggers a notification.
- **Dependencies**: US 1 (List View).
- **Edge Cases**:
  - Attempting to add a duplicate SKU.
  - Leaving mandatory fields empty.
  - Brand or Category not provided (optional fields handling).

## Supplier Management

### US 3: Create Supplier Profile
- **Statement**: As a store manager, I want to create a profile for each supplier, so that I can organize product catalogs by their source.
- **Acceptance Criteria**:
  - Form to enter Supplier Name, Contact Info, and Spreadsheet URL format.
  - Success message upon profile creation.
- **Dependencies**: None.
- **Edge Cases**:
  - Duplicate supplier names.
  - Invalid URL formats for supplier contact or website.

### US 4: View Supplier List
- **Statement**: As a store manager, I want to view a list of all current suppliers, so that I can quickly access their specific data.
- **Acceptance Criteria**:
  - List displays supplier name and the number of imported products.
  - Action buttons to edit supplier info or view their catalog.
- **Dependencies**: US 3 (Create Supplier).
- **Edge Cases**:
  - No suppliers created yet (display empty state).
  - Supplier has zero products imported.

## Catalog Import

### US 5: Import Supplier Product List
- **Statement**: As a store manager, I want to import a supplier's product list via a Google Sheets or Excel link, so that I don't have to manually enter every item.
- **Acceptance Criteria**:
  - System accepts a link and attempts to parse the data.
  - User can map spreadsheet columns to system fields (Name, SKU, Brand, Price, etc.).
  - Import process runs in the background.
- **Dependencies**: US 3 (Supplier Profile).
- **Edge Cases**:
  - Invalid/Broken link provided.
  - Permission issues (private Google Sheet).
  - Spreadsheet format differs from expected mapping.
  - Huge file size leading to timeout.

### US 6: View Import Status
- **Statement**: As a store manager, I want to see the progress or result of an import, so that I know if the supplier's products were successfully added to the system.
- **Acceptance Criteria**:
  - Visual progress bar or status indicator (Pending, In Progress, Success, Failed).
  - Error log if the import fails (e.g., "Row 45: Missing SKU").
- **Dependencies**: US 5 (Import Mechanism).
- **Edge Cases**:
  - Import interrupted by network failure.
  - Partial success (some rows imported, others failed).

## Supplier Product Display

### US 7: Browse Supplier Products
- **Statement**: As a store employee, I want to browse products imported from a specific supplier, so that I can understand what they are offering.
- **Acceptance Criteria**:
  - Table view showing supplier-specific product data (Original Name, Original SKU, etc.).
  - Indicates which items are already "Matched."
- **Dependencies**: US 5 (Import Catalog).
- **Edge Cases**:
  - Supplier products have no SKU (only names).
  - Supplier data contains duplicates.

### US 8: Filter Unmatched Products
- **Statement**: As a store employee, I want to filter supplier products by "unmatched," so that I can focus on items that still need to be linked to a main product.
- **Acceptance Criteria**:
  - Toggle or dropdown filter for "Unmatched Only."
  - Search bar within the supplier catalog view.
- **Dependencies**: US 7 (Display Supplier Products).
- **Edge Cases**:
  - All products are already matched.
  - No products are matched.

## Product Matching

### US 9: Manual Product Matching
- **Statement**: As a store employee, I want to manually search for a main product and link it to a supplier product, so that I can ensure 100% accuracy for complex items.
- **Acceptance Criteria**:
  - "Link" button next to supplier products.
  - Modal or dropdown to search and select from the Main Product catalog.
  - Visual confirmation of the link.
- **Dependencies**: US 1 (Main Catalog), US 7 (Supplier Catalog).
- **Edge Cases**:
  - Linking a supplier product that is already linked elsewhere (warning or block).
  - Main product not found (option to create new from matching screen).

### US 10: SKU-Based Suggestions
- **Statement**: As a store employee, I want to see automated suggestions for matches based on SKU similarity, so that I can quickly link products that share the same identifier.
- **Acceptance Criteria**:
  - System flags supplier products that have an exact or near-exact SKU match in the Main Catalog.
  - Display "Suggested Match" label with confidence score.
- **Dependencies**: Matching Logic Engine.
- **Edge Cases**:
  - Multiple main products share a similar SKU.
  - SKU formats differ (e.g., "ABC-123" vs "ABC123").

### US 11: Name Similarity Suggestions
- **Statement**: As a store employee, I want to see automated suggestions for matches based on product name similarity, so that I can efficiently link products with slightly different naming conventions.
- **Acceptance Criteria**:
  - Fuzzy matching logic calculates similarity between supplier product name and main product name.
  - Top 3 matches are suggested.
- **Dependencies**: Fuzzy Matching Algorithm.
- **Edge Cases**:
  - Extremely common names (e.g., "Cable") yielding too many low-quality matches.
  - Names in different languages.

### US 12: Confirm/Reject Suggestions
- **Statement**: As a store employee, I want to confirm or reject an automated match suggestion, so that I maintain control over the data accuracy.
- **Acceptance Criteria**:
  - One-click "Confirm" button to create the link.
  - "Reject" button to hide the suggestion and mark for manual matching.
- **Dependencies**: US 10/11 (Suggestions).
- **Edge Cases**:
  - Accidentally rejecting a correct match (undo functionality).
  - Confirming a match that conflicts with an existing link.

## Data Visualization & Progress

### US 13: View Sourcing Options per Main Product
- **Statement**: As a store manager, I want to see how many supplier products are linked to each main product, so that I can identify which items have multiple sourcing options.
- **Acceptance Criteria**:
  - Detailed view for a Main Product showing all linked Supplier Products.
  - Comparisons of prices/names from different suppliers for that item.
- **Dependencies**: US 9 (Matching).
- **Edge Cases**:
  - Main product has no suppliers linked.
  - High variance in pricing between linked suppliers.

### US 14: Matching Progress Overview
- **Statement**: As a store manager, I want to see an overview of matching progress for a specific supplier, so that I know how much work is left for their catalog.
- **Acceptance Criteria**:
  - Statistics dashboard: "X% matched", "Y items remaining".
  - Graphical representation (e.g., pie chart).
- **Dependencies**: US 7, US 9.
- **Edge Cases**:
  - Progress shows 100% but new products are added to the spreadsheet.
  - Supplier catalog is deleted (clean up stats).
