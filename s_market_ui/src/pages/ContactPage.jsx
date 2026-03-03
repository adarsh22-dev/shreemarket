import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./ContactPage.css";

// ── Data ──────────────────────────────────────────────────────────────────────

const phones = [
  { country: "Australia", number: "1.878.459.222" },
  { country: "Canada", number: "1.878.459.222" },
  { country: "USA", number: "1.878.459.222" },
  { country: "Indonesia", number: "1.878.459.222" },
  { country: "Malaysia", number: "1.878.459.222" },
  { country: "China", number: "1.878.459.222" },
];

const services = [
  {
    name: "Tax Planning",
    desc: "Strategic planning to minimize tax liabilities and ensure compliance across all business activities.",
  },
  {
    name: "Financial Planning",
    desc: "Comprehensive planning tailored to your personal and business financial goals.",
  },
  {
    name: "Asset Management",
    desc: "Professional oversight of your investments and asset portfolio for long-term growth.",
  },
  {
    name: "Investment Advisor",
    desc: "Expert guidance on investment opportunities aligned with your risk profile and objectives.",
  },
  {
    name: "Retire Planning",
    desc: "Structured strategies to secure your financial independence for the years ahead.",
  },
  {
    name: "Cash-Flow Management",
    desc: "Monitoring and optimizing cash flow to maintain financial stability and growth.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <div>
      <Navbar />

      <div className="contact-page">

        {/* Hero */}
        <section className="contact-hero">
          <span className="contact-hero-label">Get In Touch</span>
          <h1>Contact Us</h1>
          <p>
            Don't be shy — just tell us about yourself and we'll figure out the
            best option for you and your project.
          </p>
        </section>

        {/* Body */}
        <div className="contact-body">

          {/* Left — Info */}
          <div className="contact-left">

            {/* Phone Numbers */}
            <div className="contact-phones-card">
              <h3>Our Offices</h3>
              <ul className="contact-phone-list">
                {phones.map((p) => (
                  <li key={p.country}>
                    <span className="country">{p.country}</span>
                    <span className="number">{p.number}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="contact-services-card">
              <h3>Our Services</h3>
              <ul className="contact-service-list">
                {services.map((s) => (
                  <li key={s.name}>
                    <div className="service-dot" />
                    <div className="service-info">
                      <div className="service-name">{s.name}</div>
                      <div className="service-desc">{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Right — Form */}
          <div className="contact-form-card">
            <h2>Let's Talk</h2>
            <p>Get in touch with our experts and we'll find the right solution for you.</p>

            <form className="contact-form" onSubmit={handleSubmit}>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={form.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Smith"
                    value={form.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 000 000 0000"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="service">Service You Need</label>
                <select
                  id="service"
                  name="service"
                  value={form.service}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select a service</option>
                  {services.map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Tell us about your project or enquiry..."
                  value={form.message}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="contact-submit-btn">
                Send Message
              </button>

            </form>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
