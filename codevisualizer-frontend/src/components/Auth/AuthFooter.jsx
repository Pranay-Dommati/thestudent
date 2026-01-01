import React from "react";
import { Link } from "react-router-dom";
import { FaLinkedin, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const AuthFooter = () => {
    return (
        <footer className="bg-white border-t border-slate-200 py-6 md:py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Top Row: Links and Socials */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8">

                    {/* Navigation Links */}
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-4 md:mb-0">
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
                    <div className="flex space-x-5">
                        <a
                            href="https://x.com/easylearnva"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-slate-800 text-lg transition-colors"
                            title="X (Twitter)"
                        >
                            <FaXTwitter />
                        </a>
                        <a
                            href="https://www.linkedin.com/company/easylearnova/?viewAsMember=true"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-blue-600 text-lg transition-colors"
                            title="LinkedIn"
                        >
                            <FaLinkedin />
                        </a>
                        <a
                            href="https://www.instagram.com/easylearnova"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-pink-600 text-lg transition-colors"
                            title="Instagram"
                        >
                            <FaInstagram />
                        </a>
                    </div>
                </div>

                {/* Bottom Row: Copyright */}
                <div className="border-t border-slate-200 pt-4 md:pt-8 flex flex-col items-center text-xs md:text-sm text-slate-500">
                    <p className="text-center">
                        © {new Date().getFullYear()} Code Visualizer. All rights reserved.
                        <span className="mx-2">|</span>
                        <a href="https://easylearnova.com" className="hover:text-blue-600 transition-colors">Powered by EasyLearnova</a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default AuthFooter;