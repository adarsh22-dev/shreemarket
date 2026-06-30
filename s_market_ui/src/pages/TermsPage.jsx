import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCmsPageBySlug } from "../api/api";
import "./TermsPage.css";

const tableOfContents = [
  { id: "personal-info", label: "Personal Information We Collect" },
  { id: "purposes", label: "How We Use Your Information" },
  { id: "cookies", label: "Cookies & Identifiers" },
  { id: "sharing", label: "Sharing Your Information" },
  { id: "security", label: "Information Security" },
  { id: "advertising", label: "Advertising" },
  { id: "your-choices", label: "Your Choices" },
  { id: "children", label: "Children's Policy" },
  { id: "revisions", label: "Conditions & Revisions" },
  { id: "grievance", label: "Grievance Officer" },
];

const dataTypes = [
  { icon: "", label: "Information You Give Us", desc: "Details you provide when placing orders, creating an account, writing reviews, or contacting us." },
  { icon: "", label: "Automatic Information", desc: "Data collected automatically when you browse — including cookies, IP address, device type, and usage patterns." },
  { icon: "", label: "Information from Other Sources", desc: "Updated delivery details from carriers, account data from co-branded partners, and credit history from bureaus." },
  { icon: "", label: "Location & Device Data", desc: "Location information, device identifiers, and connectivity data used to improve services and detect fraud." },
];

const purposes = [
  { title: "Purchase & Delivery", desc: "To take and fulfill orders, process payments, and communicate about your purchases." },
  { title: "Service Improvement", desc: "To analyze performance, fix errors, and improve the usability of our services." },
  { title: "Personalization", desc: "To recommend products and personalize your experience based on your preferences." },
  { title: "Legal Compliance", desc: "To comply with applicable laws, including identity verification for sellers." },
  { title: "Communication", desc: "To contact you via phone, email, or chat regarding your account and services." },
  { title: "Fraud Prevention", desc: "To detect and prevent fraud, abuse, and assess credit risks to protect all users." },
];

const sharingItems = [
  "Third-party sellers and marketplace partners involved in your transactions.",
  "Service providers performing functions on our behalf (e.g., shipping, payments, analytics).",
  "Affiliates and subsidiaries that follow equivalent privacy practices.",
  "Authorities when required by law or to protect the rights and safety of users.",
  "Acquiring entities in the event of a business transfer or acquisition.",
];

const securityItems = [
  "Encryption protocols are used to protect your data during transmission.",
  "We comply with the Payment Card Industry Data Security Standard (PCI DSS) for payment data.",
  "Physical, electronic, and procedural safeguards are maintained at all data facilities.",
  "We may request proof of identity before disclosing personal information.",
  "You are responsible for keeping your password and devices secure.",
];

const choicesItems = [
  "You may choose not to provide certain information, though some features may be unavailable.",
  "Update your profile, address, or payment settings anytime in Your Account.",
  "Adjust communication and notification preferences to control marketing emails and in-app alerts.",
  "Manage advertising preferences to opt out of interest-based ads.",
  "Log out and block cookies to browse without linking history to your account.",
  "Use device settings to manage permissions like location access.",
];

export default function TermsPage() {
  const [cmsContent, setCmsContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    getCmsPageBySlug("terms")
      .then((data) => {
        if (data && data.content) setCmsContent(data.content);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (cmsContent) {
    return (
      <div>
        <Navbar />
        <div className="terms-page" id="top">
          <section className="terms-hero">
            <span className="last-updated">Last Updated: April 25, 2024</span>
            <h1>Privacy & Terms</h1>
            <p>We know that you care how your information is used and shared.</p>
          </section>
          <div className="terms-section" style={{ padding: "2rem 1rem", maxWidth: "800px", margin: "0 auto" }}>
            <div dangerouslySetInnerHTML={{ __html: cmsContent }} />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="terms-page" id="top">

        <section className="terms-hero">
          <span className="last-updated">Last Updated: April 25, 2024</span>
          <h1>Privacy &amp; Terms</h1>
          <p>
            We know that you care how your information is used and shared. This
            notice describes how we collect, process, and protect your personal
            information across all our services.
          </p>
        </section>

        {loading ? (
          <div className="terms-section" style={{ textAlign: "center", padding: "2rem" }}><p>Loading...</p></div>
        ) : (
          <>
            <div className="toc-box">
              <h3>Contents</h3>
              <div className="toc-grid">
                {tableOfContents.map((item) => (
                  <a href={`#${item.id}`} key={item.id}>{item.label}</a>
                ))}
              </div>
            </div>

            <section className="terms-section" id="personal-info">
              <h2>Personal Information We Collect</h2>
              <p>We collect your personal information to provide and continually improve our products and services. The types of information we collect fall into the following categories:</p>
              <div className="info-cards">
                {dataTypes.map((item) => (
                  <div className="info-card" key={item.label}>
                    <div className="card-icon">{item.icon}</div>
                    <div className="card-label">{item.label}</div>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
              <a href="#top" className="back-to-top">↑ Back to Top</a>
            </section>

            <section className="terms-section" id="purposes">
              <h2>How We Use Your Information</h2>
              <p>We use your personal information to operate, develop, and improve our services. Key purposes include:</p>
              <ul className="purpose-list">
                {purposes.map((item) => (
                  <li key={item.title}>
                    <div className="purpose-dot" />
                    <div className="purpose-content">
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <a href="#top" className="back-to-top">↑ Back to Top</a>
            </section>

            <section className="terms-section" id="cookies">
              <h2>Cookies &amp; Identifiers</h2>
              <div className="highlight-box">
                <p>To recognize your browser or device and improve our services, we use cookies and other identifiers. These allow us to enable shopping cart functionality, remember your preferences, and provide a personalized experience. Disabling cookies may prevent certain features from working, including checkout and sign-in.</p>
              </div>
              <p>You can manage cookie preferences through your browser settings. For more information, please refer to our Cookies Notice.</p>
              <a href="#top" className="back-to-top">↑ Back to Top</a>
            </section>

            <section className="terms-section" id="sharing">
              <h2>Sharing Your Information</h2>
              <p>We are not in the business of selling your personal information. Customer data is shared only in the following circumstances:</p>
              <ul className="terms-list">
                {sharingItems.map((item, i) => (<li key={i}>{item}</li>))}
              </ul>
              <a href="#top" className="back-to-top">↑ Back to Top</a>
            </section>

            <section className="terms-section" id="security">
              <h2>Information Security</h2>
              <p>We design our systems with your security and privacy in mind. Here's how we protect your data:</p>
              <ul className="terms-list">
                {securityItems.map((item, i) => (<li key={i}>{item}</li>))}
              </ul>
              <a href="#top" className="back-to-top">↑ Back to Top</a>
            </section>

            <section className="terms-section" id="advertising">
              <h2>Advertising</h2>
              <div className="highlight-box">
                <p>We may display interest-based ads using identifiers such as cookies or device IDs — never your name or directly identifying details. Third-party ad partners may also collect information when you interact with their content on our platform.</p>
              </div>
              <p>You can adjust your advertising preferences at any time through the Advertising Preferences page in your account settings.</p>
              <a href="#top" className="back-to-top">↑ Back to Top</a>
            </section>

            <section className="terms-section" id="your-choices">
              <h2>Your Choices</h2>
              <p>You have meaningful control over how your personal information is used. Here are your options:</p>
              <ul className="terms-list">
                {choicesItems.map((item, i) => (<li key={i}>{item}</li>))}
              </ul>
              <a href="#top" className="back-to-top">↑ Back to Top</a>
            </section>

            <section className="terms-section" id="children">
              <h2>Children's Policy</h2>
              <div className="highlight-box">
                <p>We do not sell products for direct purchase by children. Children's products are intended to be purchased by adults. If you are under 18 years of age, you may use our services only with the involvement of a parent or guardian.</p>
              </div>
              <a href="#top" className="back-to-top">↑ Back to Top</a>
            </section>

            <section className="terms-section" id="revisions">
              <h2>Conditions &amp; Revisions</h2>
              <p>Your use of our services and any privacy-related disputes are subject to this Notice and our Conditions of Use, including limitations on damages and applicable law.</p>
              <p>Our business evolves, and this Privacy Notice may change over time. We encourage you to review it periodically. We will never materially reduce the protections applied to previously collected information without the consent of affected customers.</p>
              <a href="#top" className="back-to-top">↑ Back to Top</a>
            </section>

            <section className="terms-section" id="grievance">
              <div className="contact-dark-box">
                <h2>Grievance Officer</h2>
                <p style={{ marginTop: '8px' }}>For privacy concerns or data requests, please reach out to our designated Grievance Officer:</p>
                <div className="grievance-grid">
                  <div className="grievance-item">
                    <div className="g-label">Name</div>
                    <p>Saurabh Joshi</p>
                  </div>
                  <div className="grievance-item">
                    <div className="g-label">Designation</div>
                    <p>Grievance Officer</p>
                  </div>
                  <div className="grievance-item">
                    <div className="g-label">Email</div>
                    <p><a href="mailto:grievance-officer@amazon.in">grievance-officer@amazon.in</a></p>
                  </div>
                  <div className="grievance-item">
                    <div className="g-label">Fax</div>
                    <p>040 – 39922887</p>
                  </div>
                  <div className="grievance-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="g-label">Address</div>
                    <p>Amazon Seller Services Pvt. Ltd., 14th Floor, Block–E, International Trade Tower, Nehru Place, New Delhi 110019</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

      </div>

      <Footer />
    </div>
  );
}
