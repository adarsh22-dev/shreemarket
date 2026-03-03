import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./FAQPage.css";

// ── Data ──────────────────────────────────────────────────────────────────────

const faqs = [
  {
    id: 1,
    question: "How to Change my Photo from Admin Dashboard?",
    answer:
      "To update your profile photo, navigate to the Admin Dashboard and select 'My Account' from the top-right menu. Under the Profile section, click on your current photo or the upload icon to choose a new image from your device. Supported formats are JPG, PNG, and WEBP. Changes are saved automatically once the upload is complete.",
  },
  {
    id: 2,
    question: "How to Change my Password Easily?",
    answer:
      "Log in to your account and go to Account Settings. Under the Security tab, click 'Change Password.' You will be prompted to enter your current password followed by your new password twice for confirmation. Passwords must be at least 8 characters and include a mix of letters and numbers. Once saved, you will receive a confirmation email.",
  },
  {
    id: 3,
    question: "How to Change my Subscription Plan Using PayPal?",
    answer:
      "Visit the Billing section within your account settings and click 'Manage Subscription.' Select the plan you wish to upgrade or downgrade to, then choose PayPal as your payment method at checkout. You will be redirected to PayPal to authorize the payment. Once confirmed, your new plan will be activated immediately.",
  },
  {
    id: 4,
    question: "How Do I Add or Remove Products from My Store?",
    answer:
      "From your Vendor Dashboard, navigate to Products and click 'Add New Product' to create a listing. Fill in the title, description, price, and upload images. To remove a product, locate it in your product list and click 'Delete' or set its status to 'Draft' to temporarily hide it without permanently deleting it.",
  },
  {
    id: 5,
    question: "How Do I Track My Orders and Manage Shipments?",
    answer:
      "All incoming orders are visible under the Orders section of your Vendor Dashboard. You can filter by status — Pending, Processing, Shipped, or Completed. To update a shipment, open the order, enter the tracking number provided by your carrier, and update the status. Customers are notified automatically via email when the status changes.",
  },
  {
    id: 6,
    question: "What Is the Commission Structure and When Do I Get Paid?",
    answer:
      "Shreemarket charges a platform commission on each sale, deducted automatically before payout. You can view the exact commission rate in your account settings under Billing. Payouts are processed on a weekly basis every Friday. Funds are transferred directly to your registered bank account or payment gateway within 3–5 business days.",
  },
];

// ── Accordion Item ─────────────────────────────────────────────────────────────

function FAQItem({ item, isOpen, onToggle }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className={`faq-item${isOpen ? " open" : ""}`}>
      <button className="faq-question" onClick={onToggle}>
        <span className="faq-question-text">{item.question}</span>
        <span className="faq-icon">
          <span className="faq-icon-bar" />
        </span>
      </button>
      <div className="faq-answer">
        <div className="faq-answer-inner">
          <p>{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FAQPage() {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId(openId === id ? null : id);

  return (
    <div>
      <Navbar />

      <div className="faq-page">

        {/* Hero */}
        <section className="faq-hero">
          <span className="faq-hero-label">Home / Pages / FAQ</span>
          <h1>Common Questions</h1>
          <p>
            Find answers to the most frequently asked questions about our
            platform. If you can't find what you're looking for, our support
            team is always ready to help.
          </p>
        </section>

        {/* Accordion */}
        <div className="faq-list">
          {faqs.map((item) => (
            <FAQItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="faq-cta">
          <span className="cta-label">Still Have Questions?</span>
          <h3>Are You Ready to Take Our Service?</h3>
          <p>
            We at Shreemarket are proud to offer a carefully designed marketplace
            built to suit our vendors' and customers' preferences while
            prioritizing trust and sustainability.
          </p>
          <a href="/contact" className="faq-cta-btn">Get In Touch</a>
        </div>

      </div>

      <Footer />
    </div>
  );
}
