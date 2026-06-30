import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./LegalPage.css";

// ── Data ──────────────────────────────────────────────────────────────────────

const tocItems = [
  // Part 1
  { id: "acceptance",     label: "1.1 Acceptance of Terms"        },
  { id: "eligibility",    label: "1.2 Eligibility"                 },
  { id: "responsibilities", label: "1.3 Vendor Responsibilities"   },
  { id: "ip",             label: "1.4 Intellectual Property"       },
  { id: "payments",       label: "1.5 Payments & Fees"             },
  { id: "termination",    label: "1.6 Termination"                 },
  { id: "liability",      label: "1.7 Limitation of Liability"     },
  { id: "governing",      label: "1.8 Governing Law"               },
  // Part 2
  { id: "data-collect",   label: "2.2 Information We Collect"      },
  { id: "data-use",       label: "2.3 How We Use Your Data"        },
  { id: "data-sharing",   label: "2.4 Sharing Your Data"           },
  { id: "data-security",  label: "2.5 Data Security"               },
  { id: "your-rights",    label: "2.6 Your Rights"                 },
  { id: "cookies",        label: "2.7 Cookies & Tracking"          },
  { id: "retention",      label: "2.10 Retention"                  },
  { id: "contact",        label: "Contact Us"                      },
];

const vendorResponsibilities = [
  "Provide accurate, up-to-date information during registration and ongoing use.",
  "Only list products or services that you have the legal right to sell — no counterfeit, illegal, or restricted items.",
  "Honor all orders placed through your store, including timely fulfillment and customer communication.",
  "Maintain secure access to your Vendor Dashboard — use strong passwords and do not share credentials.",
  "Comply with our pricing, payment, and refund policies.",
  "Use platform features ethically — no spam, misleading listings, or automated scraping.",
];

const prohibitedActivities = [
  "Uploading malware or harmful code.",
  "Harassing other users or violating intellectual property rights.",
  "Engaging in fraudulent activities such as fake reviews.",
];

const dataCollected = [
  { label: "Registration Data",         text: "Name, email, phone, business details such as store name and tax ID." },
  { label: "Usage Data",                text: "IP address, browser type, and interactions with the platform." },
  { label: "Payment Data",              text: "Processed via third-party gateways — we do not store full card details." },
  { label: "Customer Interaction Data", text: "Anonymized insights from your sales, such as buyer emails for fulfillment." },
];

const dataUsage = [
  "To provide platform services including dashboard access and order notifications.",
  "To process payments and vendor payouts.",
  "For analytics and platform improvements using aggregated, anonymized data.",
  "To communicate updates, promotions, or legal notices.",
  "To prevent fraud by monitoring suspicious activity.",
  "With your consent, for marketing such as newsletter opt-in.",
];

const dataSharing = [
  "Service Providers: Hosting, payment, and email providers — all bound by data protection agreements.",
  "Affiliates: For operational support.",
  "Legal Requirements: If compelled by law, subpoena, or to protect rights.",
  "Business Transfers: In case of merger or acquisition.",
  "We do not sell your data to third parties.",
];

const yourRights = [
  "Access — Request a copy of your data.",
  "Rectification — Correct inaccuracies.",
  "Erasure — Delete data (subject to legal retention, e.g., 7 years for tax records).",
  "Objection — Opt out of processing.",
  "Portability — Export your data.",
  "Withdraw Consent — For non-essential uses.",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function LegalPage() {
  return (
    <div>
      <Navbar />

      <div className="legal-page" id="top">

        {/* Hero */}
        <section className="legal-hero">
          <span className="legal-hero-label">Last Updated: November 25, 2025</span>
          <h1>Legal Information &amp; Data Protection</h1>
          <p>
            This page outlines the legal terms governing the use of our vendor
            platform. By accessing or using the Vendor Dashboard, you agree to
            these terms.
          </p>
        </section>

        {/* Important Notice */}
        <div className="legal-notice">
          <p>
            <strong>Important Note:</strong> This is a sample template for
            informational purposes only. It is not legal advice. We strongly
            recommend consulting a qualified attorney to customize this for your
            specific jurisdiction, business, and compliance needs (e.g., GDPR,
            CCPA).
          </p>
        </div>

        {/* Table of Contents */}
        <div className="legal-toc">
          <h3>Contents</h3>
          <div className="legal-toc-grid">
            {tocItems.map((item) => (
              <a href={`#${item.id}`} key={item.id}>{item.label}</a>
            ))}
          </div>
        </div>

        {/* ══ PART 1: TERMS OF USE ══════════════════ */}
        <div className="legal-part">
          <div className="legal-part-heading">Part 1 — Terms of Use</div>

          {/* 1.1 Acceptance */}
          <div className="legal-section" id="acceptance">
            <div className="legal-section-head">
              <div className="legal-section-num">1.1</div>
              <h2>Acceptance of Terms</h2>
            </div>
            <p>
              By registering as a vendor, accessing the frontend manager, or
              using any associated features such as product listings, order
              management, or shipping settings, you accept these Terms of Use.
              If you do not agree, please do not use the platform.
            </p>
            <p>
              These Terms form a binding agreement between you ("Vendor") and
              [Your Company Name] ("We," "Us," or "Our"), the operator of this
              website.
            </p>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 1.2 Eligibility */}
          <div className="legal-section" id="eligibility">
            <div className="legal-section-head">
              <div className="legal-section-num">1.2</div>
              <h2>Eligibility</h2>
            </div>
            <ul className="legal-list">
              <li>You must be at least 18 years old (or the age of majority in your jurisdiction) to register as a Vendor.</li>
              <li>Vendors must comply with all applicable laws, including those related to e-commerce, consumer protection, and intellectual property.</li>
              <li>We reserve the right to reject or suspend any Vendor account at our discretion, especially for violations of these Terms.</li>
            </ul>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 1.3 Vendor Responsibilities */}
          <div className="legal-section" id="responsibilities">
            <div className="legal-section-head">
              <div className="legal-section-num">1.3</div>
              <h2>Vendor Responsibilities</h2>
            </div>
            <p>As a Vendor, you agree to:</p>
            <ul className="legal-list">
              {vendorResponsibilities.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p style={{ marginTop: "16px" }}>
              <strong style={{ fontFamily: "'Arial', sans-serif", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Prohibited Activities:
              </strong>
            </p>
            <ul className="legal-list">
              {prohibitedActivities.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 1.4 Intellectual Property */}
          <div className="legal-section" id="ip">
            <div className="legal-section-head">
              <div className="legal-section-num">1.4</div>
              <h2>Intellectual Property</h2>
            </div>
            <ul className="legal-list">
              <li>All content on the website (design, logos, etc.) is owned by us or our licensors. You may not copy or distribute it without permission.</li>
              <li>As a Vendor, you retain ownership of your product listings, images, and descriptions, but grant us a non-exclusive, royalty-free license to display them on the platform for promotional and operational purposes.</li>
              <li>You must ensure your uploaded content does not infringe third-party rights.</li>
            </ul>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 1.5 Payments */}
          <div className="legal-section" id="payments">
            <div className="legal-section-head">
              <div className="legal-section-num">1.5</div>
              <h2>Payments &amp; Fees</h2>
            </div>
            <ul className="legal-list">
              <li>Vendors receive payouts via the integrated payment gateway after deducting platform fees (e.g., [X]% commission per sale).</li>
              <li>All transactions are processed securely, but we are not liable for payment disputes — resolve them directly with customers.</li>
              <li>Refunds must be processed by vendors as per our policy, typically within 30 days.</li>
            </ul>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 1.6 Termination */}
          <div className="legal-section" id="termination">
            <div className="legal-section-head">
              <div className="legal-section-num">1.6</div>
              <h2>Termination</h2>
            </div>
            <ul className="legal-list">
              <li>You may deactivate your Vendor account at any time via settings.</li>
              <li>We may terminate access for breaches, with or without notice.</li>
              <li>Upon termination, outstanding payouts will be processed, but access to historical data may be limited.</li>
            </ul>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 1.7 Limitation of Liability */}
          <div className="legal-section" id="liability">
            <div className="legal-section-head">
              <div className="legal-section-num">1.7</div>
              <h2>Limitation of Liability</h2>
            </div>
            <div className="legal-notice" style={{ marginBottom: "14px" }}>
              <p>
                The platform is provided "as is." We disclaim warranties for
                interruptions, data loss, or third-party actions. Our liability
                is limited to the fees paid by you in the last 12 months. You
                indemnify us against claims arising from your products, listings,
                or actions.
              </p>
            </div>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 1.8 Governing Law */}
          <div className="legal-section" id="governing">
            <div className="legal-section-head">
              <div className="legal-section-num">1.8</div>
              <h2>Governing Law</h2>
            </div>
            <p>
              These Terms are governed by the laws of [Your Jurisdiction].
              Disputes will be resolved in [Your Courts]. We may update these
              Terms periodically — continued use constitutes acceptance. We will
              notify you via email or dashboard notice of any material changes.
            </p>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>
        </div>

        <hr className="legal-divider" />

        {/* ══ PART 2: DATA PROTECTION ═══════════════ */}
        <div className="legal-part">
          <div className="legal-part-heading">Part 2 — Data Protection &amp; Privacy</div>

          {/* 2.2 Information We Collect */}
          <div className="legal-section" id="data-collect">
            <div className="legal-section-head">
              <div className="legal-section-num">2.2</div>
              <h2>Information We Collect</h2>
            </div>
            <div className="legal-cards-grid">
              {dataCollected.map((card) => (
                <div className="legal-card" key={card.label}>
                  <div className="lc-label">{card.label}</div>
                  <p>{card.text}</p>
                </div>
              ))}
            </div>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 2.3 How We Use Your Data */}
          <div className="legal-section" id="data-use">
            <div className="legal-section-head">
              <div className="legal-section-num">2.3</div>
              <h2>How We Use Your Data</h2>
            </div>
            <ul className="legal-list">
              {dataUsage.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 2.4 Sharing */}
          <div className="legal-section" id="data-sharing">
            <div className="legal-section-head">
              <div className="legal-section-num">2.4</div>
              <h2>Sharing Your Data</h2>
            </div>
            <ul className="legal-list">
              {dataSharing.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 2.5 Security */}
          <div className="legal-section" id="data-security">
            <div className="legal-section-head">
              <div className="legal-section-num">2.5</div>
              <h2>Data Security</h2>
            </div>
            <ul className="legal-list">
              <li>We use encryption (SSL/TLS), firewalls, and access controls to protect your data.</li>
              <li>Regular audits and compliance with standards like PCI DSS for payment processing.</li>
              <li>In case of a breach, we will notify affected users as required by applicable law.</li>
            </ul>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 2.6 Your Rights */}
          <div className="legal-section" id="your-rights">
            <div className="legal-section-head">
              <div className="legal-section-num">2.6</div>
              <h2>Your Rights</h2>
            </div>
            <p>Depending on your location, you have the right to:</p>
            <div className="legal-rights-grid">
              {yourRights.map((item, i) => (
                <div className="legal-rights-item" key={i}>
                  <div className="legal-rights-dot" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p>
              Contact us at{" "}
              <a href="mailto:privacy@yourcompany.com">privacy@yourcompany.com</a>{" "}
              to exercise your rights. We will respond within 30 days (or 45
              days under GDPR).
            </p>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 2.7 Cookies */}
          <div className="legal-section" id="cookies">
            <div className="legal-section-head">
              <div className="legal-section-num">2.7</div>
              <h2>Cookies &amp; Tracking</h2>
            </div>
            <ul className="legal-list">
              <li>The Vendor Dashboard uses cookies for functionality (e.g., session management) and analytics (e.g., Google Analytics).</li>
              <li>You can manage preferences via browser settings. Refer to our Cookie Policy for full details.</li>
            </ul>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 2.8 Children */}
          <div className="legal-section">
            <div className="legal-section-head">
              <div className="legal-section-num">2.8</div>
              <h2>Children's Privacy</h2>
            </div>
            <div className="legal-notice">
              <p>
                Our platform is not for users under 13 (or 16 in some regions).
                We do not knowingly collect data from minors.
              </p>
            </div>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>

          {/* 2.10 Retention */}
          <div className="legal-section" id="retention">
            <div className="legal-section-head">
              <div className="legal-section-num">2.10</div>
              <h2>Retention</h2>
            </div>
            <ul className="legal-list">
              <li>Vendor data is retained as long as your account is active, plus 7 years post-termination for legal reasons.</li>
              <li>Transaction data is retained for 7–10 years for audit purposes.</li>
            </ul>
            <p>
              Updates to this policy will be posted here with notice. Continued
              use of the platform implies acceptance of any revised policy.
            </p>
            <a href="#top" className="back-to-top">Back to Top</a>
          </div>
        </div>

        {/* Contact */}
        <div className="legal-section" id="contact">
          <div className="legal-contact-box">
            <h2>Contact Us</h2>
            <div className="legal-contact-grid">
              <div className="legal-contact-item">
                <div className="ci-label">Legal Enquiries</div>
                <p><a href="mailto:legal@yourcompany.com">legal@yourcompany.com</a></p>
              </div>
              <div className="legal-contact-item">
                <div className="ci-label">Phone</div>
                <p>[Your Phone Number]</p>
              </div>
              <div className="legal-contact-item">
                <div className="ci-label">Address</div>
                <p>[Your Full Address]</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
