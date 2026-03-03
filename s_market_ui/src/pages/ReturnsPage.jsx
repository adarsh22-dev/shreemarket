import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./ReturnsPage.css";

const eligibilityItems = [
  {
    label: "Timeframe",
    text: "Items can be returned or exchanged within 30 days of delivery.",
  },
  {
    label: "Condition",
    text: "Products must be unused, in original packaging, and in the same condition as received.",
  },
  {
    label: "Eligible Items",
    text: "Most items are eligible except personalized products, gift cards, and final sale items.",
  },
  {
    label: "Proof of Purchase",
    text: "A receipt or order confirmation is required for all returns and exchanges.",
  },
];

const returnSteps = [
  {
    title: "Contact Us",
    text: 'Email support@example.com or call 1-800-123-4567 to request an RMA number. Provide your order number and reason for return.',
  },
  {
    title: "Package Your Item",
    text: "Securely pack the item in its original packaging, including all accessories, manuals, and documentation. Include a copy of your receipt.",
  },
  {
    title: "Label the Package",
    text: "Attach the provided return shipping label and clearly mark the RMA number on the outside of the package.",
  },
  {
    title: "Ship the Package",
    text: "Drop off at an authorized carrier (USPS, FedEx, etc.). Use a trackable shipping method — we are not responsible for lost shipments.",
  },
  {
    title: "Confirmation",
    text: "Once received and inspected, we'll notify you by email. Approved refunds are processed within 5–7 business days to the original payment method.",
  },
];

const refundItems = [
  "Processing Time: Refunds are processed within 5–7 business days after we receive and inspect the returned item.",
  "Shipping Costs: Original shipping costs are non-refundable. Return shipping is at your expense unless the return is due to our error.",
  "Restocking Fee: A restocking fee up to 15% may apply for opened items or items returned in non-resalable condition.",
];

const exceptionItems = [
  "Defective or Damaged Items: Contact us within 7 days of delivery. We'll provide a prepaid return label and offer a full refund or replacement.",
  "Non-Returnable Items: Personalized items, gift cards, and final sale items cannot be returned or exchanged unless defective.",
];

export default function ReturnsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div>
      <Navbar />
      <div className="returns-page">

        {/* Hero */}
        <section className="returns-hero">
          <h1>Returns &amp; Exchange Policy</h1>
          <p>
            We want you to be completely satisfied with your purchase. If for any
            reason you're not happy, we're here to help.
          </p>
        </section>

        {/* Eligibility */}
        <section className="returns-section">
          <h2>Return &amp; Exchange Eligibility</h2>
          <div className="eligibility-grid">
            {eligibilityItems.map((item) => (
              <div className="eligibility-card" key={item.label}>
                <div className="label">{item.label}</div>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Return Process */}
        <section className="returns-section">
          <h2>Return Process</h2>
          <ol className="steps-list">
            {returnSteps.map((step, i) => (
              <li key={i}>
                <div className="step-number">{i + 1}</div>
                <div className="step-content">
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Exchange Process */}
        <section className="returns-section">
          <h2>Exchange Process</h2>
          <ul className="info-list">
            <li>Follow the same steps as the return process above.</li>
            <li>Specify your desired exchange item (size, color, etc.) when contacting customer service.</li>
            <li>If the exchange item costs more, you'll be charged the difference. If less, we'll refund the difference.</li>
          </ul>
        </section>

        {/* Refunds */}
        <section className="returns-section">
          <h2>Refunds</h2>
          <ul className="info-list">
            {refundItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Exceptions */}
        <section className="returns-section">
          <h2>Exceptions</h2>
          <ul className="info-list">
            {exceptionItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Contact */}
        <section className="returns-section contact-box">
          <h2>Contact Us</h2>
          <div className="contact-methods">
            <div className="contact-method">
              <div className="method-label">Email</div>
              <p><a href="mailto:support@example.com">support@example.com</a></p>
            </div>
            <div className="contact-method">
              <div className="method-label">Phone</div>
              <p>1-800-123-4567<br />Mon–Fri, 9 AM–5 PM EST</p>
            </div>
            <div className="contact-method">
              <div className="method-label">Live Chat</div>
              <p>Available on our website during business hours</p>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}