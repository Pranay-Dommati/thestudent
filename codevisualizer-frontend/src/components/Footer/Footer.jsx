import React from "react";
import { Link } from "react-router-dom";
import { FaLinkedin, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";


const Footer = () => {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Top Row: Links and Socials */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">

                    {/* Navigation Links */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-8 mb-6 md:mb-0">
                        <Link to="/feedback" className="text-slate-600 hover:text-blue-600 text-sm transition-colors">
                            Feedback
                        </Link>
                        <Link to="/terms-and-conditions" className="text-slate-600 hover:text-blue-600 text-sm transition-colors">
                            Terms of Service
                        </Link>
                        <Link to="/privacy-policy" className="text-slate-600 hover:text-blue-600 text-sm transition-colors">
                            Privacy Policy
                        </Link>
                    </div>

                    {/* Social Media Icons */}
                    <div className="flex space-x-6">
                        <a
                            href="https://x.com/easylearnva"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-800 text-xl transition-colors"
                            title="X (Twitter)"
                        >
                            <FaXTwitter />
                        </a>
                        <a
                            href="https://www.linkedin.com/company/easylearnova/?viewAsMember=true"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-blue-600 text-xl transition-colors"
                            title="LinkedIn"
                        >
                            <FaLinkedin />
                        </a>
                        <a
                            href="https://www.instagram.com/easylearnova"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-pink-600 text-xl transition-colors"
                            title="Instagram"
                        >
                            <FaInstagram />
                        </a>
                    </div>
                </div>

                {/* Bottom Row: Copyright and Slogan */}
                <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                    <p>
                        © {new Date().getFullYear()} Code Visualizer. All rights reserved.
                        <span className="mx-2">|</span>
                        <a href="https://easylearnova.com" className="hover:text-blue-600 transition-colors">Powered by EasyLearnova</a>
                    </p>
                    <p>
                        Empowering learners worldwide.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;