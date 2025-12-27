import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from '../../utils/axios';
import { FaLinkedin, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const Footer = () => {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); // "success" or "error"
    const messageTimeoutRef = useRef(null);

    // Email validation function
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);

        // Clear messages when user starts typing
        if (message) {
            setMessage("");
            setMessageType("");
        }
    };

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();

        // Validation - show messages when clicked
        if (!email.trim()) {
            setMessage("⚠️ Please enter your email address");
            setMessageType("error");
            return;
        }

        if (!isValidEmail(email.trim())) {
            setMessage("⚠️ Please enter a valid email address");
            setMessageType("error");
            return;
        }

        setIsSubmitting(true);
        setMessage("");

        try {
            const response = await axios.post('/newsletter/', { email: email.trim() });
            const data = response?.data || {};

            // Treat 201 or explicit success flag as success
            if (response.status === 201 || data.success) {
                setMessage(data.message || "🎉 Successfully subscribed to newsletter!");
                setMessageType("success");
                setEmail("");
            } else {
                setMessage(data.message || "Failed to subscribe. Please try again.");
                setMessageType("error");
                // Clear input even on error if desired by UX
                setEmail("");
            }
            // Start/refresh auto-hide timer for messages
            if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
            messageTimeoutRef.current = setTimeout(() => {
                setMessage("");
                setMessageType("");
            }, 5000);
        } catch (error) {
            console.error("Error subscribing to newsletter:", error);
            // If the server returned a JSON error message (e.g., 400 duplicate), show it
            const serverMessage = error?.response?.data?.message || error?.response?.data?.detail || error?.response?.data?.error;
            if (serverMessage) {
                setMessage(serverMessage);
            } else if (error?.response) {
                // Non-JSON response from server (status present)
                setMessage(error.response.statusText || "Failed to subscribe. Please try again.");
            } else {
                // Network / CORS / client error
                setMessage("Network error. Please check your connection and try again.");
            }
            setMessageType("error");
            // Clear input on error as requested
            setEmail("");
            // Auto-hide the message after a short delay
            if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
            messageTimeoutRef.current = setTimeout(() => {
                setMessage("");
                setMessageType("");
            }, 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        return () => {
            if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        };
    }, []);

    // Button is always enabled and looks good
    const isButtonDisabled = isSubmitting;

    return (
        <footer className="bg-white border-t border-gray-100 pt-8 pb-6 mt-12">
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
                    <p>© {new Date().getFullYear()} EasyLearnova. All rights reserved.</p>
                    <p className="mt-2 md:mt-0">Empowering learners worldwide.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;