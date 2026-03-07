import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./ShippingPage.css";

const shippingOptions = [
  {
    icon: "",
    name: "Standard Shipping",
    time: "5–7 Business Days",
    desc: "Reliable and cost-effective delivery for everyday orders.",
  },
  {
    icon: "",
    name: "Express Shipping",
    time: "2–3 Business Days",
    desc: "Faster delivery for urgent orders that can't wait.",
  },
  {
    icon: "",
    name: "Overnight Shipping",
    time: "1 Business Day",
    desc: "Next-day delivery on select products and locations.",
  },
];

const shippingCosts = [
  {
    label: "Orders over ₹X",
    badge: "Free",
    badgeClass: "cost-badge free",
    note: "Free standard shipping included",
  },
  {
    label: "Orders under ₹X",
    badge: "Calculated at Checkout",
    badgeClass: "cost-badge",
    note: "Based on size, weight & destination",
  },
  {
    label: "Express & Overnight",
    badge: "Additional Charges",
    badgeClass: "cost-badge",
    note: "View exact cost at checkout",
  },
];

const deliveryTable = [
  { method: "Standard Shipping", time: "5–7 business days" },
  { method: "Express Shipping", time: "2–3 business days" },
  { method: "Overnight Shipping", time: "1 business day" },
];

const importantNotes = [
  "We currently ship only within [your country/region].",
  "Make sure your shipping address is accurate to avoid delays.",
  "Some items may require additional processing time due to high demand or customization.",
  "Delays may occur during holidays or due to unforeseen circumstances.",
  "Orders are processed and shipped within 1–2 business days of receiving payment.",
];

export default function ShippingPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div>
      <Navbar />

      <div className="shipping-page">

        {/* Hero */}
        <section className="shipping-hero">
          <h1>Shipping Information</h1>
          <p>
            Everything you need to know about our shipping options, costs, and
            delivery times — so your order arrives exactly when you need it.
          </p>
        </section>

        {/* Shipping Options */}
        <section className="shipping-section">
          <h2>Shipping Options</h2>
          <div className="options-grid">
            {shippingOptions.map((opt) => (
              <div className="option-card" key={opt.name}>
                <div className="option-icon">{opt.icon}</div>
                <div className="option-name">{opt.name}</div>
                <div className="option-time">{opt.time}</div>
                <p className="option-desc">{opt.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Shipping Costs */}
        <section className="shipping-section">
          <h2>Shipping Costs</h2>
          <ul className="cost-list">
            {shippingCosts.map((item) => (
              <li key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "2px" }}>
                    {item.note}
                  </p>
                </div>
                <span className={item.badgeClass}>{item.badge}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Delivery Times */}
        <section className="shipping-section">
          <h2>Delivery Times</h2>
          <table className="delivery-table">
            <thead><tr>
              <th>Shipping Method</th>
              <th>Estimated Delivery Time</th>
            </tr></thead>
            <tbody>
              {deliveryTable.map((row) => (
                <tr key={row.method}><td>{row.method}</td>
                  <td>{row.time}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Order Tracking */}
        <section className="shipping-section">
          <h2>Order Tracking</h2>
          <div className="tracking-box">
            <div className="tracking-icon"></div>
            <div>
              <h3>Track Your Shipment</h3>
              <p>
                Once your order is shipped, you'll receive a tracking number via
                email or SMS. Use it to monitor your shipment's status online in
                real time.
              </p>
              <p>
                If you encounter any issues with tracking, our Customer Support
                Team is ready to help.
              </p>
              <a href="#" className="tracking-link">Track My Order →</a>
            </div>
          </div>
        </section>

        {/* Important Notes */}
        <section className="shipping-section">
          <h2>Important Notes</h2>
          <ul className="notes-list">
            {importantNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </section>

        {/* Help */}
        <section className="shipping-section">
          <div className="help-box">
            <div>
              <h2>Need Help?</h2>
              <p>
                Questions about shipping, delivery times, or tracking? Our
                support team is here for you.
              </p>
            </div>
            <a href="#" className="help-btn">Contact Support</a>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}
