import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Shield, Zap, Quote } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Home = () => {
  const particlesRef = useRef<HTMLDivElement>(null);
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);

  // Fetch initial waitlist count
useEffect(() => {
  const fetchWaitlistCount = async () => {
    const { count, error } = await supabase
      .from('student_waitlist')
      .select('*', {count: 'exact'});
    
    if (error) {
      console.error('Error fetching waitlist count:', error);
      return;
    }

    

    if (count !== null) {
      console.log('Count:', count);
      setWaitlistCount(count);
      setDisplayCount(count);
    }
  };

  fetchWaitlistCount();
}, []);

// Random counter increment effect with reduced timer
useEffect(() => {
  const incrementInterval = setInterval(() => {
    const delay = 500 + Math.random() * 3000; // Reduced random delay between 0.5-3.5 seconds
    
    setTimeout(() => {
      setDisplayCount(prev => prev + 1);
    }, delay);
  }, 10000); // Reduced interval to 10 seconds
  
  // Add cleanup function
  return () => {
    clearInterval(incrementInterval);
  };
}, []);

  // Particles effect
  useEffect(() => {
    const createParticle = () => {
      if (!particlesRef.current) return;
      
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${4 + Math.random() * 2}s`; // Decreased from 6+4 to 4+2
      particle.style.opacity = '0';
      
      particlesRef.current.appendChild(particle);

      particle.addEventListener('animationend', () => {
        particle.remove();
      });
    };

    // Decreased interval from 200ms to 100ms for more frequent particles
    const interval = setInterval(createParticle, 100);
    
    // Create initial batch of particles immediately
    for(let i = 0; i < 10; i++) {
      createParticle();
    }

    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Event Coordinator, IIT Delhi",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      quote: "Illuminatii made securing sponsorships for our tech fest incredibly smooth. We raised 50% more funds compared to last year!"
    },
    {
      name: "Rahul Verma",
      role: "Marketing Head, BITS Pilani",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      quote: "The platform's verification system gave us confidence in dealing with sponsors. Highly recommended!"
    },
    {
      name: "Aisha Patel",
      role: "Cultural Secretary, NIT Trichy",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      quote: "Thanks to Illuminatii, we connected with premium brands that aligned perfectly with our college festival's vision."
    },
    {
      name: "Vikram Singh",
      role: "Fest Coordinator, VIT Vellore",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      quote: "Illuminatii transformed our sponsorship process. We secured partnerships with top tech companies within weeks!"
    },
    {
      name: "Neha Gupta",
      role: "Sponsorship Lead, IIIT Hyderabad",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      quote: "The platform's AI-powered matching made finding relevant sponsors effortless. Game-changer for college fests!"
    }
  ];

  const brands = [
    {
      name: "TechCorp",
      logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    },
    {
      name: "InnovateX",
      logo: "https://images.unsplash.com/photo-1599305446868-59d6166953d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    },
    {
      name: "FutureWave",
      logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    },
    {
      name: "NextGen Solutions",
      logo: "https://images.unsplash.com/photo-1599305446868-59d6166953d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    }
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="min-h-[90vh] relative overflow-hidden bg-black flex items-start">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00FF0015_1px,transparent_1px)] bg-[size:100px] bg-[position:center] animated-grid after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,#00FF0015_1px,transparent_1px)] after:bg-[size:100px] after:bg-[position:center]">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          </div>
          <div ref={particlesRef} className="floating-particles" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-8rem)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 hero-title">
                EMPOWERING CONNECTIONS.
                <br />
                <span className="text-neon-green">
                  ELEVATING EXPERIENCES
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                India's first-ever exclusive platform where students, universities, and brands collaborate for event sponsorships.
              </p>
              <div className="flex flex-col gap-6 mb-8">
                <div className="text-2xl text-neon-green font-bold">
                  Students waitlist: {displayCount}
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/waitlist" className="neon-button px-8 py-4 rounded-lg flex items-center justify-center gap-2">
                    Join Waitlist <ArrowRight size={20} />
                  </Link>
                  <Link to="/sponsorships" className="px-8 py-4 bg-white/5 backdrop-blur-md text-white rounded-lg font-semibold hover:bg-white/10 transition-all border border-neon-green/20">
                    Explore Sponsorships
                  </Link>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative w-full h-[calc(100vh-8rem)] lg:h-[600px] bg-black/40"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10"></div>
              <spline-viewer url="https://prod.spline.design/zhL2SkD5i3pvyGwl/scene.splinecode" className="opacity-60"></spline-viewer>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 neon-glow">
              Key Features
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Discover how Illuminatii transforms the sponsorship landscape
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-neon-green" />,
                title: "Sponsorship Matching",
                description: "Connect brands with college fests through our intelligent matching system"
              },
              {
                icon: <Users className="w-8 h-8 text-neon-green" />,
                title: "University Collaboration",
                description: "Help institutions secure sponsorships with ease and transparency"
              },
              {
                icon: <Shield className="w-8 h-8 text-neon-green" />,
                title: "Verified Sponsorships",
                description: "Ensure authenticity and legitimacy of all partnerships"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="border border-neon-green/20 rounded-xl p-8 hover:border-neon-green/40 transition-all"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Partners Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-white text-center mb-12">
            Trusted by Leading Brands
          </h3>
          <div className="relative overflow-hidden">
            <div className="brand-scroll">
              {[...brands, ...brands].map((brand, index) => (
                <motion.div
                  key={index}
                  className="flex-shrink-0 w-[200px] h-[100px] bg-white/5 rounded-lg p-4 flex items-center justify-center mx-4"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain filter brightness-0 invert opacity-50 hover:opacity-100 transition-opacity"
                  />
                </motion.div>
              ))}
            </div>
            <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-black to-transparent z-10"></div>
            <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-black to-transparent z-10"></div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 neon-glow">
              Testimonials
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Join hundreds of students who have transformed their college events through Illuminatii
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="testimonial-card border border-neon-green/20 rounded-xl p-6 hover:border-neon-green/40"
              >
                <Quote className="w-8 h-8 text-neon-green mb-4 opacity-50" />
                <p className="text-gray-300 mb-6 italic">{testimonial.quote}</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-neon-green text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;