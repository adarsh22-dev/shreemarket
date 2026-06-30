import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getPublicHelpArticles } from "../api/api";
import "./VendorPortalPage.css";

const sections = [
  {
    num: "01",
    title: "Getting Started",
    guides: [
      { title: "Accessing Your Vendor Dashboard", desc: "Learn how to log in and navigate the vendor dashboard." },
      { title: "Setting Up Your Store Profile", desc: "Upload your logo, banner, and enter your store policies." },
      { title: "Updating Business & Bank Details", desc: "Ensure your payout and business details are correct." },
    ],
  },
  {
    num: "02",
    title: "Product Management",
    guides: [
      { title: "Adding Products", desc: "Step-by-step guide for adding simple and variable products." },
      { title: "Inventory Control", desc: "Manage stock levels, SKUs, and product variations." },
      { title: "Editing or Removing Products", desc: "Update product details or temporarily disable listings." },
    ],
  },
  {
    num: "03",
    title: "Order Management",
    guides: [
      { title: "Viewing Orders", desc: "Access new, pending, and completed orders in one place." },
      { title: "Processing Orders", desc: "Print invoices, update order status, and manage shipping." },
      { title: "Handling Returns & Refunds", desc: "Guidelines on refund requests and communication with customers." },
    ],
  },
  {
    num: "04",
    title: "Payments & Earnings",
    guides: [
      { title: "Commission Structure", desc: "Understand how commissions are calculated on your sales." },
      { title: "Earning Reports", desc: "Track your sales, commissions, and pending payouts." },
      { title: "Payment Schedule", desc: "Learn when and how payments are processed to your account." },
    ],
  },
  {
    num: "05",
    title: "Vendor Policies & Compliance",
    guides: [
      { title: "Marketplace Rules", desc: "Understand vendor responsibilities and prohibited items." },
      { title: "Return & Refund Policy", desc: "Vendor obligations regarding returns and customer claims." },
      { title: "Code of Conduct", desc: "Maintain professionalism and ensure customer satisfaction." },
    ],
  },
];

export default function VendorPortalPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicHelpArticles()
      .then((data) => {
        if (Array.isArray(data)) setArticles(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />

      <div className="vp-page">

        <div className="vp-hero">
          <span className="vp-hero-label">Vendor Portal — Resources &amp; Guides</span>
          <h1>Resources Center</h1>
          <p>
            Welcome to the Vendor Portal Resources Center. Here, you'll find all
            the information you need to successfully manage your store on our
            marketplace. From onboarding guides to order management tips,
            everything is designed to help you grow your business with ease.
          </p>
        </div>

        {articles.length > 0 && (
          <div className="vp-section">
            <div className="vp-section-head">
              <div className="vp-section-num">•</div>
              <h2>Help Articles</h2>
            </div>
            <div className="vp-guides-grid">
              {articles.map((article) => (
                <div className="vp-guide-card" key={article.id}>
                  <div className="vp-guide-title">{article.title}</div>
                  {article.time && <div className="vp-guide-desc">{article.time}</div>}
                  {article.badge && <span className="vp-guide-badge">{article.badge}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="vp-section" style={{ textAlign: "center", padding: "2rem" }}><p>Loading resources...</p></div>
        ) : (
          sections.map((section) => (
            <div className="vp-section" key={section.num}>
              <div className="vp-section-head">
                <div className="vp-section-num">{section.num}</div>
                <h2>{section.title}</h2>
              </div>
              <div className="vp-guides-grid">
                {section.guides.map((guide) => (
                  <div className="vp-guide-card" key={guide.title}>
                    <div className="vp-guide-title">{guide.title}</div>
                    <div className="vp-guide-desc">{guide.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div className="vp-cta">
          <div className="vp-cta-text">
            <h3>Need Further Guidance?</h3>
            <p>
              Visit our Vendor Support Page or contact our support team for
              personalized assistance with any questions about managing your store.
            </p>
          </div>
          <div className="vp-cta-actions">
            <a href="#" className="vp-btn vp-btn-primary">Vendor Support</a>
            <a href="#" className="vp-btn vp-btn-ghost">Contact Us</a>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
