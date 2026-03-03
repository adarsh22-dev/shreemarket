import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./PrivacyPage.css";

// ── Data ──────────────────────────────────────────────────────────────────────

const tocItems = [
  { id: "collect", label: "Information We Collect" },
  { id: "usage", label: "How We Use Your Information" },
  { id: "sharing", label: "Sharing of Information" },
  { id: "security", label: "Data Protection & Security" },
  { id: "cookies", label: "Cookies & Tracking" },
  { id: "children", label: "Children's Privacy" },
  { id: "rights", label: "Your Rights" },
  { id: "contact", label: "Contact Us" },
];

const collectCards = [
  {
    label: "Personal Details",
    items: ["Full name", "Email address", "Phone number", "Billing and shipping address"],
  },
  {
    label: "Order & Payment Information",
    items: [
      "Payment method details (processed by third-party gateways)",
      "Order history and transaction details",
    ],
    note: "We do NOT store your complete debit or credit card details on our servers.",
  },
  {
    label: "Technical & Device Information",
    items: [
      "IP address",
      "Browser, device type, and operating system",
      "Pages visited and time spent on our website",
      "Cookies (explained below)",
    ],
  },
];

const usageItems = [
  "To process and deliver orders",
  "To provide customer support",
  "To improve website performance and user experience",
  "To prevent fraudulent transactions",
  "To send updates, promotions, or offers (only with your consent)",
];

const sharingItems = [
  "Delivery and logistics partners",
  "Payment gateway providers",
  "Service providers assisting with marketing, analytics, or website functionality",
];

const securityCards = [
  "Secure SSL Encryption",
  "Restricted Access to Personal Data",
  "Continuous Security Monitoring",
];

const cookiesItems = [
  "Improve browsing experience",
  "Remember cart and login information",
  "Personalize product recommendations",
  "Analyze website performance and traffic",
];

const rightsItems = [
  "Access the personal data we hold about you",
  "Request correction or updates to your data",
  "Request deletion of your account and related information",
  "Opt out of promotional or marketing emails",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <Navbar />

      <div className="privacy-page" id="top">

        {/* Hero */}
        <section className="privacy-hero">
          <span className="privacy-hero-label">Last Updated: [Add Date]</span>
          <h1>Privacy Policy</h1>
          <p>
            At Shreemarket, we are committed to protecting your personal information
            and ensuring a safe, secure shopping experience. This policy describes
            how your data is collected, used, and safeguarded.
          </p>
        </section>

        {/* Table of Contents */}
        <div className="privacy-toc">
          <h3>Contents</h3>
          <div className="privacy-toc-grid">
            {tocItems.map((item) => (
              <a href={`#${item.id}`} key={item.id}>{item.label}</a>
            ))}
          </div>
        </div>

        {/* Information We Collect */}
        <section className="privacy-section" id="collect">
          <h2>Information We Collect</h2>
          <p>
            We may collect the following types of information when you interact
            with our website:
          </p>
          <div className="privacy-collect-grid">
            {collectCards.map((card) => (
              <div className="privacy-collect-card" key={card.label}>
                <div className="cc-label">{card.label}</div>
                <ul>
                  {card.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                {card.note && (
                  <div className="privacy-note">
                    <p>{card.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <a href="#top" className="back-to-top">Back to Top</a>
        </section>

        {/* How We Use Your Information */}
        <section className="privacy-section" id="usage">
          <h2>How We Use Your Information</h2>
          <p>
            Your information is used only for purposes that help us serve you
            better, including:
          </p>
          <ul className="privacy-list">
            {usageItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <a href="#top" className="back-to-top">Back to Top</a>
        </section>

        {/* Sharing of Information */}
        <section className="privacy-section" id="sharing">
          <h2>Sharing of Information</h2>
          <p>
            We respect your privacy and do not sell, rent, or trade your personal
            information. However, your information may be shared with trusted
            third parties only when necessary, such as:
          </p>
          <ul className="privacy-list">
            {sharingItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p>
            These partners are authorized to use the information only to perform
            services on behalf of Shreemarket.
          </p>
          <a href="#top" className="back-to-top">Back to Top</a>
        </section>

        {/* Data Protection & Security */}
        <section className="privacy-section" id="security">
          <h2>Data Protection &amp; Security</h2>
          <p>
            We use industry-standard encryption and security measures to protect
            your data:
          </p>
          <div className="privacy-security-grid">
            {securityCards.map((label) => (
              <div className="privacy-security-card" key={label}>
                <div className="sc-label">{label}</div>
              </div>
            ))}
          </div>
          <div className="privacy-note">
            <p>
              No online platform can guarantee 100% security. By using our
              website, you agree to assume this inherent risk.
            </p>
          </div>
          <a href="#top" className="back-to-top">Back to Top</a>
        </section>

        {/* Cookies */}
        <section className="privacy-section" id="cookies">
          <h2>Cookies &amp; Tracking Technologies</h2>
          <p>Shreemarket uses cookies to:</p>
          <ul className="privacy-list">
            {cookiesItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p>
            You can disable cookies at any time through your browser settings,
            but some features of the website may not function properly.
          </p>
          <a href="#top" className="back-to-top">Back to Top</a>
        </section>

        {/* Children's Privacy */}
        <section className="privacy-section" id="children">
          <h2>Children's Privacy</h2>
          <div className="privacy-note">
            <p>
              Shreemarket does not knowingly collect information from children
              under 18 years of age. If you believe a minor has provided personal
              information, please contact us and we will delete it immediately.
            </p>
          </div>
          <a href="#top" className="back-to-top">Back to Top</a>
        </section>

        {/* Your Rights */}
        <section className="privacy-section" id="rights">
          <h2>Your Rights</h2>
          <p>As a user of Shreemarket, you have the right to:</p>
          <div className="privacy-rights-grid">
            {rightsItems.map((item, i) => (
              <div className="privacy-rights-item" key={i}>
                <div className="privacy-rights-dot" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p>
            To exercise these rights, email us at:{" "}
            <a href="mailto:support@shreemarket.com">support@shreemarket.com</a>
          </p>
          <a href="#top" className="back-to-top">Back to Top</a>
        </section>

        {/* Contact Us */}
        <section className="privacy-section" id="contact">
          <div className="privacy-contact-box">
            <h2>Contact Us</h2>
            <div className="privacy-contact-grid">
              <div className="privacy-contact-item">
                <div className="ci-label">Email</div>
                <p>
                  <a href="mailto:support@shreemarket.com">
                    support@shreemarket.com
                  </a>
                </p>
              </div>
              <div className="privacy-contact-item">
                <div className="ci-label">Phone</div>
                <p>[Add phone number here]</p>
              </div>
              <div className="privacy-contact-item" style={{ gridColumn: "1 / -1" }}>
                <div className="ci-label">Address</div>
                <p>[Add address here]</p>
              </div>
            </div>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}
