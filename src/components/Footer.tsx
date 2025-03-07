import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="flex flex-col items-start">
            <div className="mb-4 flex items-center justify-center">
              <img 
                src="/illuminatii-logo.png" 
                alt="Illuminatii Logo" 
                className="h-24 w-auto object-contain"
              />
            </div>
            <p className="text-gray-400 text-sm">
              Bridging the gap between college fests and brand sponsorships.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/sponsorships" className="text-gray-400 hover:text-white transition-colors">
                  Sponsorships
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/partner" className="text-gray-400 hover:text-white transition-colors">
                  Partner With Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/PrivacyPolicy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Connect With Us</h4>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/official.illuminatii?igsh=MWtscDhsZjVtaHM5eQ%3D%3D&utm_source=qr" 
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://www.youtube.com/@Illuminatii-c4e" 
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
            <p>originalilluminatii@gmail.com</p>
           <p>+91 8660161824 </p> 
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Illuminatii. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
