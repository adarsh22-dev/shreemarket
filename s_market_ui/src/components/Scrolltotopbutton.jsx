import { useState, useEffect } from "react";

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    const onResize = () => setIsMobile(window.innerWidth <= 768);

    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Desktop: bottom-right | Mobile: bottom-center
  const position = isMobile
    ? { bottom: "24px", left: "50%", transform: visible ? "translateX(-50%) scale(1)" : "translateX(-50%) scale(0.8) translateY(20px)" }
    : { bottom: "90px", right: "35px", transform: visible ? "translateY(0px) scale(1)" : "translateY(20px) scale(0.8)" };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Scroll to top"
      style={{
        position: "fixed",
        ...position,
        width: isMobile ? "48px" : "44px",
        height: isMobile ? "48px" : "44px",
        borderRadius: "50%",
        background: "#1a1a2e",
        border: "1.5px solid rgba(255,255,255,0.12)",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        zIndex: 9999,
        outline: "none",
        padding: 0,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.35s cubic-bezier(0.34,1.56,0.64,1), transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.38)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)";
      }}
      onMouseDown={e => {
        e.currentTarget.style.transform = isMobile
          ? "translateX(-50%) scale(0.93)"
          : "scale(0.93)";
      }}
      onMouseUp={e => {
        e.currentTarget.style.transform = isMobile
          ? "translateX(-50%) scale(1)"
          : "translateY(0px) scale(1)";
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 13.5V4.5M9 4.5L4.5 9M9 4.5L13.5 9"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default ScrollToTopButton;