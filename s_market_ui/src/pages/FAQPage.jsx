import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getPublicFaqs } from "../api/api";
import "./FAQPage.css";

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
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    getPublicFaqs()
      .then((data) => {
        setFaqs(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setFaqs([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
        {loading ? (
          <div className="faq-list">
            <p>Loading FAQs...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="faq-list">
            <p>No FAQs available at this time.</p>
          </div>
        ) : (
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
        )}

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
