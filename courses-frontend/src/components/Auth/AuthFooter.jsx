import React from "react";
import { Link } from "react-router-dom";
import { FaLinkedin, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const AuthFooter = () => {
    return (
        <footer className="bg-white border-t border-gray-100 pt-8 pb-6 mt-12 pb-24 lg:pb-6">
            <div className="max-w-6xl mx-auto px-4">

                {/* Simplified Layout: Links & Social */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">

                    {/* Navigation Links */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-2 text-sm font-medium text-gray-500">
                        <Link to="/feedback" className="hover:text-indigo-600 transition-colors">Feedback</Link>
                        <Link to="/terms-and-conditions" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
                        <Link to="/privacy-policy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
                    </div>

                    {/* Social Media Icons */}
                    <div className="flex justify-center space-x-6 text-xl">
                        <a
                            href="https://x.com/easylearnova"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-900 transition-colors"
                            title="X (Twitter)"
                            aria-label="Visit us on X (Twitter)"
                        >
                            <FaXTwitter />
                        </a>
                        <a
                            href="https://www.linkedin.com/company/easylearnova/?viewAsMember=true"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-[#0077b5] transition-colors"
                            title="LinkedIn"
                            aria-label="Visit us on LinkedIn"
                        >
                            <FaLinkedin />
                        </a>
                        <a
                            href="https://www.instagram.com/easylearnova"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-[#E4405F] transition-colors"
                            title="Instagram"
                            aria-label="Visit us on Instagram"
                        >
                            <FaInstagram />
                        </a>
                    </div>
                </div>

                {/* Divider & Copyright */}
                <div className="border-t border-gray-100 pt-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
                    <p>
                        © {new Date().getFullYear()} EasyLearnova. All rights reserved.
                        <span className="mx-2">|</span>
                        <a href="https://easylearnova.com" className="hover:text-indigo-600 transition-colors">Powered by EasyLearnova</a>
                    </p>
                    <p className="mt-2 md:mt-0">Empowering learners worldwide.</p>
                </div>
            </div>
        </footer>
    );
};

export default AuthFooter;