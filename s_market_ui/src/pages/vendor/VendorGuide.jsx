// src/pages/vendor/VendorGuide.jsx

import React, { useState } from "react";
import VendorLayout from "../../components/vendor/VendorLayout";
import {
  Package,
  ClipboardList,
  CreditCard,
  Tag,
  RotateCcw,
  BarChart3,
} from "lucide-react";
import "./VendorGuide.css";

const sections = [
  { id: "products", label: "Products", icon: <Package size={18} /> },
  { id: "orders", label: "Orders", icon: <ClipboardList size={18} /> },
  { id: "payments", label: "Payments", icon: <CreditCard size={18} /> },
  { id: "coupons", label: "Coupons", icon: <Tag size={18} /> },
  { id: "refunds", label: "Refunds", icon: <RotateCcw size={18} /> },
  { id: "reports", label: "Reports", icon: <BarChart3 size={18} /> },
];

const VendorGuide = () => {
  const [active, setActive] = useState("products");

  return (
    <VendorLayout>
      <div className="guide-container">

        {/* Header */}
        <div className="guide-top">
          <h1>Vendor Guide</h1>
          <p>
            Comprehensive guide to manage your store effectively across key
            sections.
          </p>
        </div>

        <div className="guide-body">

          {/* Sidebar Navigation */}
          <div className="guide-sidebar">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`guide-nav-item ${
                  active === section.id ? "active" : ""
                }`}
                onClick={() => setActive(section.id)}
              >
                {section.icon}
                {section.label}
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div className="guide-content">

            {active === "products" && (
  <div className="guide-section">
    <h2>Products</h2>
    <p>
      Manage your product catalog: add, edit, and track inventory.
    </p>

    {/* Product List Overview */}
    <div className="info-card">
      <h3>Product List</h3>
      <p>Browse and filter your products easily.</p>
    </div>

    {/* Product Listing & Filters */}
    <div className="info-card">
      <h3>Product Listing & Filters</h3>
      <ul>
        <li>View all products with status, stock, and price.</li>
        <li>Filter by category, status, or type.</li>
        <li>Search for specific items quickly.</li>
      </ul>
    </div>

    {/* Add / Edit Product */}
    <div className="info-card">
      <h3>Add Product Form</h3>
      <h4 style={{ marginTop: "10px" }}>Add / Edit Products</h4>
      <p>
        Create new products or update existing ones with images and details.
      </p>
    </div>

    {/* Product Listing Detailed Explanation */}
    <div className="info-card">
      <h3>Products Listing</h3>
      <p>
        To view products that have been created, go to <strong>Products</strong> in
        the WCFM Dashboard left menu. At the top of this screen you can view
        the standard filter and search area. A list of products appears in
        order of date made.
      </p>

      <ul>
        <li>Filter by status using the status links at the top</li>
        <li>Filter by category</li>
        <li>Filter by product types</li>
        <li>Search products</li>
      </ul>

      <p style={{ marginTop: "15px" }}>
        At the far right of each product row, the following actions are available:
      </p>

      <ul>
        <li>View</li>
        <li>Edit</li>
        <li>Duplicate</li>
        <li>Featured Mark</li>
        <li>Delete</li>
      </ul>

      <p style={{ marginTop: "15px" }}>
        You also have useful options at the top right of the screen:
      </p>

      <ul>
        <li>Add New Product</li>
        <li>Product Export</li>
        <li>Product Import</li>
      </ul>
    </div>

    {/* Additional Images */}
    <div className="info-card">
      <h3>Products Additional Image</h3>
      <p>
        Upload multiple product images to provide better visual details and
        improve customer engagement.
      </p>
    </div>

    {/* Highlight Box */}
    <div className="highlight-box">
      <h4>Why Use This Dashboard?</h4>
      <ul>
        <li>Streamline operations across all sections</li>
        <li>Real-time data for informed decisions</li>
        <li>Boost sales and customer satisfaction</li>
        <li>Easy exports for compliance and analysis</li>
      </ul>
    </div>
  </div>
)}
{active === "orders" && (
  <div className="guide-section">
    <h2>Orders</h2>
    <p>
      Handle customer orders: view, update, and process shipments.
    </p>

    {/* Orders List Overview */}
    <div className="info-card">
      <h3>Orders List</h3>
      <p>Comprehensive order overview.</p>
    </div>

    {/* Order Columns */}
    <div className="info-card">
      <h3>Order Columns & Details</h3>
      <ul>
        <li>Order ID, customer, products, and quantities.</li>
        <li>Billing & shipping addresses with locations.</li>
        <li>Gross sales, earnings, and dates.</li>
      </ul>
    </div>

    {/* Orders Listing */}
    <div className="info-card">
      <h3>Orders Listing</h3>
      <p>
        To view orders that have been placed, go to <strong>Orders</strong> in
        the WCFM Dashboard left menu. At the top of this screen you can view
        the standard filter and search area. A list of orders appears in order
        of date made.
      </p>

      <ul>
        <li>Filter by status using the status links at the top</li>
        <li>Filter by date</li>
        <li>Search orders</li>
        <li>WooCommerce Sequential Order Number search supported</li>
      </ul>

      <p style={{ marginTop: "15px" }}>
        At the far right of each order row, the following actions are available:
      </p>

      <ul>
        <li>View</li>
        <li>Mark as Complete (Admin only)</li>
        <li>Mark as Shipped (Vendor only)</li>
        <li>
          Download PDF Invoice (Requires WooCommerce PDF Invoices & Packing Slips plugin)
        </li>
        <li>Delete</li>
      </ul>

      <p style={{ marginTop: "15px" }}>
        You also have useful options at the top right of the screen:
      </p>

      <ul>
        <li>WP Admin Order Dashboard (Admin only)</li>
        <li>
          Screen Manager (Admin only) – Manage listing columns visibility
        </li>
      </ul>
    </div>

    {/* Additional Images */}
    <div className="info-card">
      <h3>Orders Additional Images</h3>
      <p>
        Orders Additional Image 1 and Orders Additional Image 2 sections
        allow better visual reference and documentation where applicable.
      </p>
    </div>

    {/* Highlight Box */}
    <div className="highlight-box">
      <h4>Why Use This Dashboard?</h4>
      <ul>
        <li>Streamline operations across all sections</li>
        <li>Real-time data for informed decisions</li>
        <li>Boost sales and customer satisfaction</li>
        <li>Easy exports for compliance and analysis</li>
      </ul>
    </div>
  </div>
)}

            {active === "payments" && (
  <div className="guide-section">
    <h2>Payments</h2>
    <p>
      Monitor earnings, commissions, and withdrawal requests.
    </p>

    {/* Earnings Overview */}
    <div className="info-card">
      <h3>Earnings Overview</h3>
      <p>Total earnings and commission breakdown.</p>
    </div>

    <div className="info-card">
      <h3>Earnings & Commissions</h3>
      <ul>
        <li>View gross, net, and commission amounts</li>
        <li>Filter by date range or payment status</li>
        <li>Track pending and approved payments</li>
      </ul>
    </div>

    {/* Payment Overview */}
    <div className="info-card">
      <h3>Payment Overview</h3>
      <p>
        Vendor payment gateways are essential for commission payouts. Vendors
        can withdraw commissions using the enabled payment methods.
      </p>

      <p><strong>Available Vendor Payment Options:</strong></p>
      <ul>
        <li>PayPal</li>
        <li>Stripe</li>
        <li>Stripe Split Pay</li>
        <li>Skrill</li>
        <li>Bank Transfer</li>
        <li>Cash Pay</li>
      </ul>

      <p>
        Admin can enable these from:
        <strong> WCFM Admin Settings → Payment Settings Tab</strong>.
        Vendors can then choose their preferred withdrawal method.
      </p>
    </div>

    {/* Electronic Payment Methods */}
    <div className="info-card">
      <h3>Electronic Payment Methods</h3>
      <p>
        These allow automatic online transfer (API-based) from Admin to Vendor.
      </p>
      <ul>
        <li>PayPal</li>
        <li>Stripe</li>
        <li>Stripe Split Pay</li>
      </ul>
    </div>

    {/* PayPal */}
    <div className="info-card">
      <h3>PayPal Setup</h3>
      <ul>
        <li>Enable PayPal from payment list</li>
        <li>Configure PayPal credentials</li>
        <li>Enable Test Mode for testing</li>
      </ul>

      <p><strong>Vendor PayPal Connect:</strong></p>
      <p>
        Vendors can connect PayPal from:
        Store Manager → Settings → Payment → Preferred Payment Method.
      </p>
    </div>

    {/* Stripe */}
    <div className="info-card">
      <h3>Stripe Setup</h3>
      <ul>
        <li>Enable Stripe from payment list</li>
        <li>Enable Test Mode if required</li>
        <li>Generate Test & Live API Keys from Stripe dashboard</li>
        <li>Copy Secret & Publishable keys into WCFM</li>
        <li>Generate Client ID from Stripe Connect → OAuth tab</li>
        <li>Add WCFM redirect URLs inside Stripe settings</li>
      </ul>

      <p><strong>Vendor Stripe Connect:</strong></p>
      <p>
        Vendors connect Stripe from:
        Store Manager → Settings → Payment → Preferred Payment Method.
      </p>
      <p>
        Vendors may disconnect anytime from the same location.
      </p>
    </div>

    {/* Stripe Split Pay */}
    <div className="info-card">
      <h3>Stripe Split Pay</h3>
      <p>
        Automatically splits order amount into vendor commission and admin fee.
        Vendor share goes to vendor Stripe account instantly.
      </p>

      <ul>
        <li>Enable from payment list</li>
        <li>Supports Test Mode</li>
        <li>No additional Stripe plugin required</li>
        <li>Works as Stripe payment gateway at WooCommerce checkout</li>
        <li>Order status changes to “Processing” after payment</li>
      </ul>

      <p><strong>Supported Charge Types:</strong></p>
      <ul>
        <li>Direct Charges</li>
        <li>Destination Charges</li>
        <li>Transfer Charges</li>
      </ul>
    </div>

    {/* Payfast */}
    <div className="info-card">
      <h3>Payfast</h3>
      <p><strong>Requirements:</strong></p>
      <ul>
        <li>WCFM – Frontend Manager</li>
        <li>WooCommerce Payfast Gateway</li>
        <li>WCFM Payfast Addon</li>
      </ul>

      <p><strong>Admin Setup:</strong></p>
      <p>
        WCFM Admin Dashboard → Settings → Payment Settings → Enable Payfast.
      </p>

      <p><strong>Vendor Setup:</strong></p>
      <p>
        Vendor Dashboard → Settings → Payment → Enter Merchant ID and select Payfast.
      </p>
    </div>

    {/* Paystack */}
    <div className="info-card">
      <h3>Paystack</h3>
      <p><strong>Requirements:</strong></p>
      <ul>
        <li>WCFM – Frontend Manager</li>
        <li>Paystack WooCommerce Gateway</li>
        <li>WCFM Paystack Addon</li>
      </ul>

      <p><strong>Admin Setup:</strong></p>
      <p>
        Enable from WCFM Admin → Payment Settings and insert Test Secret Key and Public Key.
      </p>

      <p><strong>Vendor Setup:</strong></p>
      <p>
        Vendor Dashboard → Settings → Payments → Enter required Paystack details.
      </p>
    </div>

    {/* MangoPay */}
    <div className="info-card">
      <h3>MangoPay</h3>
      <p><strong>Requirements:</strong></p>
      <ul>
        <li>WCFM – Frontend Manager</li>
        <li>MANGOPAY WooCommerce</li>
        <li>WCFM MangoPay Addon</li>
      </ul>

      <p><strong>Admin Setup:</strong></p>
      <p>
        Enable MangoPay from WCFM Admin → Payment Settings.
      </p>

      <p><strong>Vendor Setup:</strong></p>
      <p>
        Vendors configure MangoPay details and identity proofs under
        Vendor Dashboard → Settings → Payment.
      </p>
    </div>

    {/* Manual Payment Methods */}
    <div className="info-card">
      <h3>Manual Payment Methods</h3>
      <p>
        Manual methods require Admin to transfer commission manually.
      </p>
      <ul>
        <li>Bank Transfer</li>
        <li>Skrill</li>
        <li>Cash Pay</li>
      </ul>
    </div>

    {/* Highlight Box */}
    <div className="highlight-box">
      <h4>Why Use This Dashboard?</h4>
      <ul>
        <li>Streamline operations across all sections</li>
        <li>Real-time data for informed decisions</li>
        <li>Boost sales and customer satisfaction</li>
        <li>Easy exports for compliance and analysis</li>
      </ul>
    </div>
  </div>
)}

           {active === "coupons" && (
  <div className="guide-section">
    <h2>Coupons</h2>
    <p>Create and manage discount coupons to boost sales.</p>

    {/* ================= ADMIN COUPONS ================= */}
    <div className="info-card">
      <h3>Admin – Adding / Editing Coupons</h3>
      <p>
        Admin can create coupons from: <br />
        <strong>WCFM Admin Dashboard → Coupons → Add New</strong>
      </p>
      <p>
        Existing coupons can be edited from the coupon list using the
        <strong> Edit</strong> option under the Action column.
      </p>
    </div>

    <div className="info-card">
      <h3>Admin – General Settings</h3>
      <ul>
        <li><strong>Code:</strong> Name of the coupon.</li>
        <li><strong>Description:</strong> Coupon description.</li>
        <li><strong>Discount Type:</strong> Fixed Cart / Fixed Product / Percentage.</li>
        <li><strong>Coupon Amount:</strong> Discount value.</li>
        <li><strong>Expiry Date:</strong> Set expiration date.</li>
        <li><strong>Allow Free Shipping:</strong> Grants free shipping if enabled.</li>
        <li><strong>Store:</strong> Select applicable store.</li>
        <li><strong>Show on Store:</strong> Display coupon on store page (requires widget).</li>
      </ul>
    </div>

    <div className="info-card">
      <h3>Admin – Restriction Settings</h3>
      <ul>
        <li>Minimum spend (Cart total + tax)</li>
        <li>Maximum spend</li>
        <li>Individual use only</li>
        <li>Exclude sale items</li>
        <li>Include specific products</li>
        <li>Exclude specific products</li>
        <li>Product categories inclusion</li>
        <li>Exclude categories</li>
        <li>Email restrictions (comma separated emails)</li>
      </ul>
    </div>

    <div className="info-card">
      <h3>Admin – Usage Limits</h3>
      <ul>
        <li>Usage limit per coupon</li>
        <li>Limit usage to X items</li>
        <li>Usage limit per user</li>
      </ul>
    </div>

    {/* ================= VENDOR COUPONS ================= */}
    <div className="info-card">
      <h3>Vendor – Adding / Editing Coupons</h3>
      <p>
        Vendors can create coupons from: <br />
        <strong>WCFM Vendor Dashboard → Coupons → Add New</strong>
      </p>
      <p>
        Vendors can edit existing coupons from the listing page using the
        <strong> Edit</strong> option.
      </p>
    </div>

    <div className="info-card">
      <h3>Vendor – General Settings</h3>
      <ul>
        <li><strong>Code:</strong> Coupon name.</li>
        <li><strong>Description:</strong> Coupon description.</li>
        <li><strong>Discount Type:</strong> Percentage / Fixed Product.</li>
        <li><strong>Coupon Amount:</strong> Discount value.</li>
        <li><strong>Expiry Date:</strong> Expiration date.</li>
        <li><strong>Allow Free Shipping:</strong> Enable free shipping option.</li>
        <li><strong>Show on Store:</strong> Display coupon in store sidebar.</li>
      </ul>
    </div>

    <div className="info-card">
      <h3>Vendor – Restriction Settings</h3>
      <ul>
        <li>Minimum spend (Cart total + tax)</li>
        <li>Maximum spend</li>
        <li>Individual use only</li>
        <li>Exclude sale items</li>
        <li>Product inclusion</li>
        <li>Exclude specific products</li>
        <li>Category inclusion</li>
        <li>Exclude categories</li>
        <li>Email restrictions</li>
      </ul>
    </div>

    <div className="info-card">
      <h3>Vendor – Usage Limits</h3>
      <ul>
        <li>Usage limit per coupon</li>
        <li>Limit usage to X items</li>
        <li>Usage limit per user</li>
      </ul>
    </div>

    {/* ================= DELETE OPTION ================= */}
    <div className="info-card">
      <h3>Deleting Coupons</h3>
      <p>
        Both Admin and Vendors can delete coupons from:
        <br />
        <strong>Dashboard → Coupons → Delete (Action Column)</strong>
      </p>
    </div>

    {/* ================= BENEFITS ================= */}
    <div className="highlight-box">
      <h4>Why Use This Dashboard?</h4>
      <ul>
        <li>Run promotional campaigns</li>
        <li>Increase conversion rates</li>
        <li>Drive repeat purchases</li>
        <li>Control coupon usage efficiently</li>
        <li>Boost overall sales performance</li>
      </ul>
    </div>
  </div>
)}
            {active === "refunds" && (
  <div className="guide-section">
    <h2>Refunds</h2>
    <p>Process refunds efficiently for customer satisfaction.</p>

    {/* ================= VENDOR REFUND ================= */}
    <div className="info-card">
      <h3>Refund Claim by Vendors</h3>
      <p>
        Vendors can apply for a refund from:
        <br />
        <strong>WCFM Vendor Dashboard → Orders → Order Item List</strong>
      </p>
      <p>
        Click the <strong>Refund</strong> icon under the Actions column to open
        the refund request popup.
      </p>
    </div>

    <div className="info-card">
      <h3>Vendor Refund Details</h3>
      <ul>
        <li>
          <strong>Refund Request:</strong> Choose Full Refund or Partial Refund.
          (For partial refund, specify refund amount.)
        </li>
        <li>
          <strong>Refund Request Reason:</strong> Provide the reason for refund.
        </li>
      </ul>
      <p>
        Once approved by Admin (automatically or manually), the refund will
        reflect in the order list.
      </p>
      <p>
        <strong>Note:</strong> If commission was already withdrawn, vendors
        cannot request a refund.
      </p>
    </div>

    {/* ================= CUSTOMER REFUND ================= */}
    <div className="info-card">
      <h3>Refund Claim by Customers</h3>
      <p>
        Customers can request refunds only if Admin enables
        <strong> “Refund by Customer”</strong> from:
        <br />
        <strong>
          WCFM Admin Dashboard → Settings → Refund Settings
        </strong>
      </p>
    </div>

    <div className="info-card">
      <h3>Customer Refund Process</h3>
      <ul>
        <li>Customer views order from their Order Dashboard</li>
        <li>Selects Full or Partial Refund</li>
        <li>Submits refund request form</li>
        <li>Admin processes the request</li>
      </ul>
    </div>

    {/* ================= APPROVAL PROCESS ================= */}
    <div className="info-card">
      <h3>Request Approval</h3>
      <p>
        Admin can configure refund approval settings from:
        <br />
        <strong>
          WCFM Admin Dashboard → Settings → Refund Settings
        </strong>
      </p>

      <ul>
        <li>
          <strong>Auto Approve Enabled:</strong> Refunds processed automatically.
        </li>
        <li>
          <strong>Manual Approval:</strong> Admin must approve each request.
        </li>
      </ul>

      <p>
        Manual requests can be viewed here:
        <br />
        <strong>WCFM Admin Dashboard → Refund</strong>
      </p>
      <p>
        Admin can Approve or Reject requests from the refund list.
      </p>
    </div>

    {/* ================= BENEFITS ================= */}
    <div className="highlight-box">
      <h4>Why Use This Dashboard?</h4>
      <ul>
        <li>Streamline operations across all sections</li>
        <li>Real-time data for informed decisions</li>
        <li>Boost sales and customer satisfaction</li>
        <li>Maintain transparent refund workflow</li>
        <li>Improve vendor–customer trust</li>
      </ul>
    </div>
  </div>
)}

           {active === "reports" && (
  <div className="guide-section">
    <h2>Reports</h2>
    <p>
      Analyze sales, performance, and trends with insightful reports.
    </p>

    {/* ================= ACCESS ================= */}
    <div className="info-card">
      <h3>Access Reports</h3>
      <p>
        Both Admin and Vendors can view reports from:
        <br />
        <strong>WCFM Admin/Vendor Dashboard → Reports</strong>
      </p>
    </div>

    {/* ================= SALES BY DATE ================= */}
    <div className="info-card">
      <h3>1. Sales by Date (Admin & Vendor)</h3>
      <p>
        View sales figures for a selected time range:
      </p>
      <ul>
        <li>Year</li>
        <li>Month</li>
        <li>Week</li>
        <li>Custom Date Range</li>
      </ul>
      <p>
        <strong>Admin:</strong> Can view total store sales.
        <br />
        <strong>Vendor:</strong> Can view only their store sales.
      </p>
    </div>

    {/* ================= SALES BY PRODUCT ================= */}
    <div className="info-card">
      <h3>2. Sales by Product (Admin & Vendor)</h3>
      <p>
        Analyze product performance within a selected time range.
      </p>

      <ul>
        <li>
          <strong>Time Range:</strong> Select report duration.
        </li>
        <li>
          <strong>Product Search:</strong> Search and select a specific product.
        </li>
        <li>
          <strong>Top Sellers:</strong> View highest-selling products.
        </li>
        <li>
          <strong>Top Freebies:</strong> View most distributed free products.
        </li>
        <li>
          <strong>Top Earners:</strong> View products generating highest revenue.
        </li>
      </ul>

      <p>
        <strong>Admin:</strong> Can analyze all store products.
        <br />
        <strong>Vendor:</strong> Can analyze only their own products.
      </p>
    </div>

    {/* ================= SALES BY STORE ================= */}
    <div className="info-card">
      <h3>3. Sales by Store (Admin Only)</h3>
      <p>
        Admin can select any vendor store from the dropdown
        and view sales reports for that specific store.
      </p>
    </div>

    {/* ================= LOW IN STOCK ================= */}
    <div className="info-card">
      <h3>4. Low in Stock (Admin & Vendor)</h3>
      <p>
        View products that are running low on inventory.
      </p>
      <ul>
        <li>Quick inventory overview</li>
        <li>Edit products directly</li>
        <li>View product details</li>
        <li>Delete products if needed</li>
      </ul>
    </div>

    {/* ================= OUT OF STOCK ================= */}
    <div className="info-card">
      <h3>5. Out of Stock (Admin & Vendor)</h3>
      <p>
        View products that are currently out of stock.
      </p>
      <p>
        <strong>Admin:</strong> Can view stock status across all vendors.
        <br />
        <strong>Vendor:</strong> Can view stock status of their store only.
      </p>
    </div>

    {/* ================= COUPONS ================= */}
    <div className="info-card">
      <h3>6. Coupons by Date (Admin Only)</h3>
      <p>
        Admin can analyze coupon performance for a selected time range.
      </p>
      <ul>
        <li>Total coupons used</li>
        <li>Total discount amount</li>
        <li>Filter by specific coupon</li>
        <li>Most popular coupons</li>
        <li>Highest discount-generating coupons</li>
      </ul>
    </div>

    {/* ================= BENEFITS ================= */}
    <div className="highlight-box">
      <h4>Why Use This Dashboard?</h4>
      <ul>
        <li>Streamline operations across all sections</li>
        <li>Real-time data for informed decisions</li>
        <li>Boost sales and customer satisfaction</li>
        <li>Identify top-performing products</li>
        <li>Monitor inventory health</li>
        <li>Track promotional effectiveness</li>
      </ul>
    </div>
  </div>
)}

          </div>
        </div>
      </div>
    </VendorLayout>
  );
};

export default VendorGuide;