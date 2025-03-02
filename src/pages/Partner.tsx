import React, { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, Phone, MapPin, Instagram, Linkedin, Twitter, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Partner = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    brand: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id === 'sponsorship-type' ? 'sponsorshipType' : id]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const { error } = await supabase
        .from('partner_inquiries')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            brand_name: formData.brand,
            message: formData.message
          }
        ]);

      if (error) throw error;

      setSubmitStatus({
        type: 'success',
        message: 'Your message has been sent successfully!'
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        brand: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Failed to send message. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      category: "General Questions",
      questions: [
        {
          question: "What is Illuminatii?",
          answer: "Illuminatii is a digital platform that connects students, colleges, and brands for sponsorship opportunities, collaborations, and industry insights. It helps colleges secure sponsors, brands reach engaged student audiences, and students stay updated on events and business trends."
        },
        {
          question: "Who can use Illuminatii?",
          answer: "Illuminatii is designed for:\n• Students looking for event updates and sponsorship opportunities.\n• Colleges & Event Organizers seeking brand sponsorships.\n• Brands that want to sponsor college events and connect with students."
        },
        {
          question: "Is Illuminatii free to use?",
          answer: "• For Students & Colleges: Yes, creating an account and browsing sponsorships is free.\n• For Brands: There may be premium sponsorship listing options for better visibility."
        },
        {
          question: "How do I sign up?",
          answer: "You can sign up using your email, Google account, or university email ID."
        }
      ]
    },
    {
      category: "For Students & Colleges",
      questions: [
        {
          question: "How can my college get sponsorships?",
          answer: "• Create a college profile and list your event details.\n• Browse sponsorship opportunities or wait for brands to contact you.\n• Submit sponsorship applications with event details and expected reach."
        },
        {
          question: "What details do I need to provide for sponsorship applications?",
          answer: "• Event Name & Type (Cultural Fest, Tech Fest, Sports Meet, etc.)\n• Expected Footfall & Audience Demographics\n• Sponsorship Type Required (Cash, Product, Promotion, etc.)"
        },
        {
          question: "How do we communicate with brands?",
          answer: "You can express interest in sponsorships through an application form. Direct messaging with brands may be introduced in future updates."
        }
      ]
    },
    {
      category: "For Brands & Sponsors",
      questions: [
        {
          question: "How can brands use Illuminatii?",
          answer: "• List sponsorship opportunities for colleges to apply.\n• Filter & discover colleges based on event size, audience, and branding potential.\n• Manage sponsorship applications through a dedicated dashboard."
        },
        {
          question: "What sponsorship options are available?",
          answer: "Brands can offer:\n✅ Monetary Sponsorships (Funding for events)\n✅ Product Sponsorships (Providing giveaways, merchandise, or tech gadgets)\n✅ Marketing Sponsorships (Social media promotions, brand booths, etc.)"
        },
        {
          question: "How does brand visibility work?",
          answer: "Brands can gain exposure through:\n• Event promotions (logos on banners, social media shoutouts, email marketing)\n• Student engagement campaigns (interactive contests, influencer collaborations)\n• Exclusive brand partnerships with colleges & student clubs"
        }
      ]
    },
    {
      category: "Security & Privacy",
      questions: [
        {
          question: "Is my data secure on Illuminatii?",
          answer: "Yes, we use secure encryption and follow data privacy best practices to protect your information."
        }
      ]
    },
    {
      category: "Support & Contact",
      questions: [
        {
          question: "How do I contact Illuminatii for help?",
          answer: "You can reach us through:\n• Email: originalilluminatii@gmail.com\n• Phone: +91 8660161824\n• Social Media: Instagram | LinkedIn | X (Twitter)"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen pt-16 bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00FF0015_1px,transparent_1px)] bg-[size:100px] bg-[position:center] animated-grid after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,#00FF0015_1px,transparent_1px)] after:bg-[size:100px] after:bg-[position:center]">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4 neon-glow">Partner With Us</h1>
          <p className="text-xl text-gray-300">Join our network of brands and make an impact in the college ecosystem</p>
        </motion.div>

        <div className="space-y-12">
          {/* Partnership Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-neon-green/20 max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">Get Started</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitStatus.type && (
                <div className={`p-4 rounded-lg ${submitStatus.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {submitStatus.message}
                </div>
              )}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-white/10 border-transparent focus:border-neon-green focus:bg-white/20 focus:ring-0 text-white"
                  placeholder="Your name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-white/10 border-transparent focus:border-neon-green focus:bg-white/20 focus:ring-0 text-white"
                  placeholder="you@company.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-300">Brand/University/Organization Name</label>
                <input
                  type="text"
                  id="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-white/10 border-transparent focus:border-neon-green focus:bg-white/20 focus:ring-0 text-white"
                  placeholder="Your brand/university/organization"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300">Message</label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md bg-white/10 border-transparent focus:border-neon-green focus:bg-white/20 focus:ring-0 text-white"
                  placeholder="Tell us about your sponsorship goals"
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-8 py-4 bg-neon-green text-black rounded-lg font-semibold hover:bg-[#00CC00] transition-all gap-2 shadow-[0_0_10px_rgba(0,255,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'} <Send size={20} />
              </button>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-neon-green/20 max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-neon-green" />
                <span>originalilluminatii@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-neon-green" />
                <span>+91 8660161824</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-neon-green" />
                <span>Bangalore, India</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-white font-medium mb-4">Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-neon-green transition-colors">
                  <Instagram size={24} />
                </a>
                <a href="#" className="text-gray-400 hover:text-neon-green transition-colors">
                  <Linkedin size={24} />
                </a>
                <a href="#" className="text-gray-400 hover:text-neon-green transition-colors">
                  <Twitter size={24} />
                </a>
                <a href="#" className="text-gray-400 hover:text-neon-green transition-colors">
                  <MessageSquare size={24} />
                </a>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-neon-green/20 max-w-4xl mx-auto"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-8">
              {faqs.map((category, categoryIndex) => (
                <div key={categoryIndex} className="space-y-4">
                  <h3 className="text-xl font-semibold text-neon-green mb-4">{category.category}</h3>
                  {category.questions.map((faq, faqIndex) => (
                    <div
                      key={`${categoryIndex}-${faqIndex}`}
                      className="border border-white/10 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === categoryIndex * 100 + faqIndex ? null : categoryIndex * 100 + faqIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between text-white hover:bg-white/5 transition-colors"
                      >
                        <span className="font-medium">{faq.question}</span>
                        {openFaq === categoryIndex * 100 + faqIndex ? (
                          <ChevronUp className="w-5 h-5 text-neon-green" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-neon-green" />
                        )}
                      </button>
                      {openFaq === categoryIndex * 100 + faqIndex && (
                        <div className="px-6 py-4 text-gray-300 bg-white/5 whitespace-pre-line">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Partner;
