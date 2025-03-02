import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Target, Users } from 'lucide-react';

const About = () => {
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createParticle = () => {
      if (!particlesRef.current) return;
      
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${6 + Math.random() * 4}s`;
      particle.style.opacity = '0';
      
      particlesRef.current.appendChild(particle);

      particle.addEventListener('animationend', () => {
        particle.remove();
      });
    };

    const interval = setInterval(createParticle, 200);
    return () => clearInterval(interval);
  }, []);

  const teamMembers = [
    {
      name: "Amruth",
      role: "Co-Founder & CEO",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      bio: "Passionate about bridging the gap between college events and brand partnerships. Previously worked with multiple startups in the education sector."
    },
    {
      name: "Rahul",
      role: "Co-Founder & CTO",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      bio: "Tech enthusiast with a vision to revolutionize the sponsorship landscape. Expert in building scalable platforms and digital solutions."
    }
  ];

  const advisors = [
    {
      name: "Priya Sharma",
      role: "Marketing Advisor",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      bio: "15+ years of experience in digital marketing and brand partnerships."
    },
    {
      name: "Rajesh Kumar",
      role: "Industry Expert",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      bio: "Former VP of Events at leading corporations, bringing valuable industry insights."
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00FF0015_1px,transparent_1px)] bg-[size:100px] bg-[position:center] animated-grid after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,#00FF0015_1px,transparent_1px)] after:bg-[size:100px] after:bg-[position:center]">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        </div>
        <div ref={particlesRef} className="floating-particles" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Company Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-white mb-6 neon-glow">About Illuminatii</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Illuminatii is a digital platform bridging the gap between college fests and brand sponsorships. 
            We simplify sponsorship processes, provide networking opportunities, and keep students updated on latest trends.
          </p>
        </motion.div>

        {/* Vision & Mission */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Neon Circle Background */}
          <div className="neon-circle absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-neon-green/20 hover:border-neon-green/40 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <Target className="w-8 h-8 text-neon-green" />
              <h2 className="text-2xl font-semibold text-white">Our Vision</h2>
            </div>
            <p className="text-gray-300">
              To be the largest sponsorship marketplace for students and brands, revolutionizing how college events secure funding and partnerships.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative z-10 bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-neon-green/20 hover:border-neon-green/40 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <Rocket className="w-8 h-8 text-neon-green" />
              <h2 className="text-2xl font-semibold text-white">Our Mission</h2>
            </div>
            <p className="text-gray-300">
              Empowering students with opportunities through digital sponsorships, making event funding accessible, transparent, and efficient.
            </p>
          </motion.div>
        </div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4 neon-glow">Meet Our Team</h2>
            <p className="text-gray-300">The visionaries behind Illuminatii</p>
          </div>

          {/* Founders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-neon-green/20 hover:border-neon-green/40 transition-all"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                    <p className="text-neon-green mb-2">{member.role}</p>
                    <p className="text-gray-300 text-sm">{member.bio}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Advisors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advisors.map((advisor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 + 0.4 }}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-neon-green/20 hover:border-neon-green/40 transition-all"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={advisor.image}
                    alt={advisor.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-white">{advisor.name}</h3>
                    <p className="text-neon-green mb-2">{advisor.role}</p>
                    <p className="text-gray-300 text-sm">{advisor.bio}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;