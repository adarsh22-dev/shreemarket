import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './OurStory.css';
import { Bookmark, Share2 } from 'lucide-react';
import ourstyhero from '../assets/homepgI1.png'
import FarmhouseWovenBasket from '../assets/FarmhouseWovenBasket.png'

const OurStory = () => {
    // Scroll to top on load
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="our-story-page">
            <Navbar />

            <div className="story-content-wrapper">
                <section className="story-hero">
                    <img
                        src={ourstyhero}
                        alt="Weaving loom"
                        className="story-hero-bg"
                    />
                    <div className="story-hero-content">
                        <span className="story-hero-tag">COMMUNITY STORIES</span>
                        <h1 className="story-hero-title">The Hands that Build: A Deep Dive into Weaver Communities</h1>
                    </div>
                </section>

                <p className="story-caption">
                    Savithri Ramesh the intricate dance of threads in the highlands, Oct 12, 2023.
                </p>

                <article className="story-article">
                    <div className="story-author-section">
                        <div className="story-author-info">
                            <img
                                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop"
                                alt="Savi3"
                                className="story-author-avatar"
                            />
                            <div className="story-author-details">
                                <span className="story-author-name">Savithri ramesh</span>
                                <span className="story-author-role">EDITOR-IN-CHIEF • 8 MIN READ</span>
                            </div>
                        </div>
                        <div className="story-author-actions">
                            <button aria-label="Bookmark article"><Bookmark size={20} /></button>
                            <button aria-label="Share article"><Share2 size={20} /></button>
                        </div>
                    </div>

                    <p className="story-paragraph story-drop-cap">
                        eep in the heart of the Andean valleys, the rhythm of life is set not by clocks, but by the steady thrum of the loom. For generations, these communities have woven the very fabric of their identity into every textile they produce. This isn't just manufacturing; it's a spiritual dialogue between the past and the future.
                    </p>

                    <h2 className="story-subheading">Ancestral Techniques</h2>

                    <p className="story-paragraph">
                        The process begins long before the shuttle flies. It starts with the selection of natural fibers—alpaca wool, organic cotton, and linen. These materials are dyed using recipes passed down through oral tradition, utilizing local flora like cochineal and indigo. The result is a palette of colors that feels alive, shifting with the light in a way synthetic dyes never could.
                    </p>

                    <blockquote className="story-blockquote">
                        <div className="story-quote-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.017 21L16.417 14C16.917 12.5 17.417 11.1 17.417 9.8C17.417 8.2 16.917 6.9 15.917 6C14.917 5.1 13.617 4.5 12.017 4.5V21H14.017ZM5.017 21L7.417 14C7.917 12.5 8.417 11.1 8.417 9.8C8.417 8.2 7.917 6.9 6.917 6C5.917 5.1 4.617 4.5 3.017 4.5V21H5.017Z" />
                            </svg>
                        </div>
                        <p className="story-quote-text">
                            "Weaving isn't just work; it's the thread that binds our ancestors to our children. Every pattern we create is a story they will one day read with their hands."
                        </p>
                        <footer className="story-quote-author">— Mariyam Joseph, Master Weaver</footer>
                    </blockquote>

                    <h2 className="story-subheading">The Impact of Every Stitch</h2>

                    <p className="story-paragraph">
                        EmpowerHome's mission has always been to bridge the gap between these talented artisans and the global market. By ensuring fair wages and providing resources for community development, we help preserve these essential cultural practices. Every rug, throw, and tapestry purchased represents more than just a home accessory—it's a direct investment in a family's future.
                    </p>

                    <div className="story-image-grid">
                        <img
                            src={FarmhouseWovenBasket}
                            alt="Spools of blue yarn"
                            className="story-grid-image"
                        />
                        <img
                            src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop"
                            alt="Plants in pots"
                            className="story-grid-image"
                            style={{ objectPosition: 'center' }}
                        />
                    </div>

                    <p className="story-paragraph">
                        As we look toward a future of mass production, these weaver communities offer a different path—one of patience, quality, and soul. They remind us that the things we bring into our homes should have a heart.
                    </p>
                </article>
            </div>

            <Footer />
        </div>
    );
};

export default OurStory;
