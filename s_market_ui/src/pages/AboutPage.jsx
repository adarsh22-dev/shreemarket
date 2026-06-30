import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCmsPageBySlug } from "../api/api";
import "./AboutPage.css";

const businessHours = [
  { day: "Monday",    time: "7am – 6pm", closed: false },
  { day: "Tuesday",   time: "7am – 6pm", closed: false },
  { day: "Wednesday", time: "7am – 6pm", closed: false },
  { day: "Thursday",  time: "7am – 6pm", closed: false },
  { day: "Friday",    time: "7am – 6pm", closed: false },
  { day: "Saturday",  time: "7am – 6pm", closed: false },
  { day: "Sunday",    time: "Closed",    closed: true  },
];

const features = [
  {
    name: "Easy To Contact Us",
    desc: "Reach our team through multiple channels. We're always available to help with any enquiry.",
  },
  {
    name: "Expert Advisor",
    desc: "Our specialists bring years of experience to guide you through every step of your journey.",
  },
  {
    name: "Well-Known Team",
    desc: "A trusted team recognized for delivering outstanding results and exceptional service.",
  },
];

const partners = ["Partner A", "Partner B", "Partner C", "Partner D", "Partner E"];

const timeline = [
  {
    tag: "Starting Point",
    date: "07 June 2013",
    title: "We Are Founded",
    desc: "Our journey began with a vision to create a trusted marketplace connecting artisans and buyers across the globe.",
  },
  {
    tag: "Expansion",
    date: "27 May 2016",
    title: "Expanding Reach to Asia",
    desc: "We extended our operations across Asia, partnering with local artisan co-ops and opening new regional offices.",
  },
  {
    tag: "First Peak",
    date: "1 April 2020",
    title: "Becoming a Global Company",
    desc: "Having established a presence across 12 countries, we achieved our milestone of becoming a truly global marketplace.",
  },
];

export default function AboutPage() {
  const [cmsContent, setCmsContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCmsPageBySlug("about")
      .then((data) => {
        if (data && data.content) setCmsContent(data.content);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />

      <div className="about-page">

        <section className="about-hero">
          <span className="about-hero-label">Know Us More</span>
          <h1>About Us</h1>
          <p>
            We are Shreemarket — a marketplace built on the belief that quality,
            trust, and community go hand in hand.
          </p>
        </section>

        <div className="about-intro">

          <div className="about-story-card">
            <div className="section-label">Who We Are</div>
            <h2>We are Shreemarket</h2>
            <div className="since">Your Creative Partner Since 1973</div>
            {loading ? (
              <p>Loading...</p>
            ) : cmsContent ? (
              <div dangerouslySetInnerHTML={{ __html: cmsContent }} />
            ) : (
              <>
                <p>
                  At Shreemarket, we are dedicated to creating the best possible
                  shopping and selling experience for our community. We work with
                  artisans, vendors, and customers from around the world to bring
                  high-quality, handcrafted products to every home.
                </p>
                <p>
                  Our platform is built on values of fairness, transparency, and
                  social responsibility. Every product tells a story — of skill,
                  heritage, and the people behind it. We believe that commerce
                  should uplift communities, not just move goods.
                </p>
                <p>
                  From our humble beginnings to a growing global presence, we
                  remain committed to our founding mission: making the world a
                  better place, one purchase at a time.
                </p>
              </>
            )}
          </div>

          <div className="about-hours-card">
            <div className="section-label">Business Hours</div>
            <p className="hours-desc">
              Our team is available during the following hours to assist you
              with any enquiries.
            </p>
            <ul className="hours-list">
              {businessHours.map((h) => (
                <li key={h.day}>
                  <span className="day">{h.day}</span>
                  <span className={`time${h.closed ? " closed" : ""}`}>{h.time}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="about-features">
          {features.map((f) => (
            <div className="about-feature-card" key={f.name}>
              <div className="feature-name">{f.name}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="about-partners-card">
          <div className="section-label">Our Global Partners</div>
          <div className="partners-grid">
            {partners.map((p) => (
              <div className="partner-placeholder" key={p}>{p}</div>
            ))}
          </div>
        </div>

        <div className="about-timeline-card">
          <div className="section-label">Our Journey</div>
          <div className="timeline">
            {timeline.map((item) => (
              <div className="timeline-item" key={item.date}>
                <div className="timeline-dot" />
                <div className="timeline-meta">
                  <span className="timeline-tag">{item.tag}</span>
                  <span className="timeline-date">{item.date}</span>
                </div>
                <div className="timeline-title">{item.title}</div>
                <div className="timeline-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="about-cta">
          <div className="about-cta-text">
            <div className="cta-label">Get In Touch</div>
            <h3>Let's Talk</h3>
            <p>
              Get in touch with our specialists. We're here to help you find
              the best solution for your needs and answer any questions you may
              have about our platform.
            </p>
          </div>
          <a href="/contact" className="about-cta-btn">Contact Us</a>
        </div>

      </div>

      <Footer />
    </div>
  );
}
