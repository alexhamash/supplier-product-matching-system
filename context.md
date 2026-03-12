# Supplier Product Matching System - Business Context

## Project Purpose
The system is designed to solve the problem of managing multiple supplier product catalogs and linking them to a store's internal product catalog. Suppliers usually provide product lists in spreadsheets (Google Sheets or Excel), and the goal is to match those supplier products with the store’s main products.

## Target Audience
The primary users are e-commerce store managers or employees responsible for working with suppliers and managing product assortments.

## Key Features & Processes
- **Authentication**: Secure login and logout to protect store and supplier data.
- **Import Supplier Catalogs**: Import supplier product catalogs (usually via spreadsheet links).
- **Display Supplier Products**: View supplier products within the system.
- **Manual Matching**: Allow manual matching between the store’s main product and supplier products.
- **Automatic Suggestions**: Provide automatic suggestions for matching based on similarity (e.g., product name).
- **Supplier Management**: Manage multiple suppliers and their catalogs.

## Matching Logic
Matching can be based on several criteria:
- **SKU** (if available)
- **Product Name Similarity**
- **Brand**
- **Category**
- **Manual Confirmation** by the user

Initially, the system will focus on simple matching logic (SKU and name similarity).

## Business Goals
- **Secure Access**: Ensure only authorized users can manage catalogs and matches.
- **Reduce Manual Work**: Decrease the effort required when working with supplier catalogs.
- **Centralize Data**: Centralize supplier data in one system.
- **Improve Accuracy**: Enhance the precision of product matching.
- **Speed Up Onboarding**: Accelerate the process of adding new supplier products.

## System Concepts & Architecture
The system follows a central product catalog model where store-internal products serve as the "Main Products" to which various "Supplier Products" are linked.

### Main Products
The core products of the store. Each product contains basic information such as:
- Name
- SKU
- Brand
- Category

### Suppliers
Entities that provide product catalogs.

### Supplier Products
Products imported from supplier spreadsheets. These may have different names, SKUs, or formats depending on the supplier.

### Product Matches / Links
Supplier products are linked to a Main Product. One Main Product can have multiple Supplier Products connected to it from different (or even the same) suppliers.

**Example:**
- **Main Product**: iPhone 13 128GB Midnight
  - **Supplier A Product**: Apple iPhone 13 128 Midnight
  - **Supplier B Product**: iPhone 13 128GB Black
  - **Supplier C Product**: MLPF3 iPhone 13 128GB

All of these supplier products are connected to the same Main Product.

## Integrations
- **Initial Stage**: Support for supplier spreadsheets (Google Sheets or Excel links).
- **Future**: Potential integration with ERP systems or supplier APIs.
