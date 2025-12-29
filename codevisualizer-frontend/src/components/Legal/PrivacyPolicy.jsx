import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaShieldAlt, FaUserShield, FaLock, FaServer, FaUsers, FaGavel, FaChevronUp } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = location.state?.returnTo || '/';

    const handleBack = () => {
        // Ensure navigation works by checking if returnTo exists
        console.log("Navigating back to:", returnTo);
        navigate(returnTo);
    };
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Fixed Header for Mobile */}
            <div className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 pointer-events-auto">
                <div className="max-w-4xl mx-auto px-4 py-3 md:py-4">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                        <button
                            onClick={handleBack}
                            className="flex items-center text-slate-500 hover:text-slate-900 transition-colors relative z-50 px-3 py-2 -ml-2 rounded-md hover:bg-slate-100 active:bg-slate-200"
                            aria-label="Go back"
                        >
                            <FaArrowLeft className="mr-1 md:mr-2 flex-shrink-0" />
                            <span className="text-sm md:text-base font-medium">Back</span>
                        </button>
                        <FaShieldAlt className="text-slate-900 text-2xl md:text-4xl" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mr-4 truncate">Privacy Policy</h1>
                        <p className="text-xs md:text-sm text-slate-500 mt-1 sm:mt-0 whitespace-nowrap flex-shrink-0">Last updated: June 14, 2025</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 sm:p-8 md:p-10"
                >
                    {/* Summary Section */}
                    <section className="mb-8 md:mb-10 bg-slate-50 p-6 md:p-8 rounded-xl border border-slate-100">
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Key Points Summary</h2>
                        <ul className="list-disc pl-5 text-sm md:text-base text-slate-600 space-y-2">
                            <li><strong>Data Collection:</strong> We collect basic account info, educational preferences, and usage data</li>
                            <li><strong>Data Usage:</strong> To personalize learning, improve our services, and communicate with you</li>
                            <li><strong>Data Protection:</strong> We implement industry-standard security measures</li>
                            <li><strong>Your Control:</strong> You can access, update, or delete your data anytime</li>
                        </ul>
                    </section>

                    {/* Collapsible Sections */}
                    <div className="space-y-4">
                        <details className="bg-white border border-slate-200 rounded-xl group overflow-hidden">
                            <summary className="px-5 py-4 cursor-pointer font-medium flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                                    <FaUserShield className="text-slate-700 text-base md:text-lg mr-3 flex-shrink-0" />
                                    <span className="text-sm md:text-base text-slate-900 font-semibold truncate">Information We Collect</span>
                                </div>
                                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2 text-slate-400">
                                    <FaChevronUp />
                                </div>
                            </summary>
                            <div className="px-5 py-4 border-t border-slate-100 text-sm md:text-base bg-slate-50/50">
                                <ul className="list-disc pl-5 text-slate-600 space-y-2">
                                    <li>Account information (name, email, password)</li>
                                    <li>Educational information (class level, subjects of interest)</li>
                                    <li>Usage data (courses viewed, lessons completed, quiz scores)</li>
                                    <li>Technical data (device type, browser, IP address)</li>
                                </ul>
                            </div>
                        </details>

                        <details className="bg-white border border-slate-200 rounded-xl group overflow-hidden">
                            <summary className="px-5 py-4 cursor-pointer font-medium flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                                    <FaLock className="text-slate-700 text-base md:text-lg mr-3 flex-shrink-0" />
                                    <span className="text-sm md:text-base text-slate-900 font-semibold truncate">How We Use Your Information</span>
                                </div>
                                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2 text-slate-400">
                                    <FaChevronUp />
                                </div>
                            </summary>
                            <div className="px-5 py-4 border-t border-slate-100 text-sm md:text-base bg-slate-50/50">
                                <ul className="list-disc pl-5 text-slate-600 space-y-2">
                                    <li>Provide personalized learning experiences</li>
                                    <li>Process transactions and send notifications</li>
                                    <li>Improve our platform and services</li>
                                    <li>Send updates on new courses and features</li>
                                </ul>
                            </div>
                        </details>

                        <details className="bg-white border border-slate-200 rounded-xl group overflow-hidden">
                            <summary className="px-5 py-4 cursor-pointer font-medium flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                                    <FaShieldAlt className="text-slate-700 text-base md:text-lg mr-3 flex-shrink-0" />
                                    <span className="text-sm md:text-base text-slate-900 font-semibold truncate">Data Security</span>
                                </div>
                                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2 text-slate-400">
                                    <FaChevronUp />
                                </div>
                            </summary>
                            <div className="px-5 py-4 border-t border-slate-100 text-sm md:text-base bg-slate-50/50">
                                <p className="text-slate-600 leading-relaxed">
                                    We use encryption, secure servers, and regular security audits to protect your personal information.
                                    While no online service is 100% secure, we follow industry best practices to safeguard your data.
                                </p>
                            </div>
                        </details>

                        <details className="bg-white border border-slate-200 rounded-xl group overflow-hidden">
                            <summary className="px-5 py-4 cursor-pointer font-medium flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                                    <FaUsers className="text-slate-700 text-base md:text-lg mr-3 flex-shrink-0" />
                                    <span className="text-sm md:text-base text-slate-900 font-semibold truncate">Third-Party Sharing</span>
                                </div>
                                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2 text-slate-400">
                                    <FaChevronUp />
                                </div>
                            </summary>
                            <div className="px-5 py-4 border-t border-slate-100 text-sm md:text-base bg-slate-50/50">
                                <p className="text-slate-600 leading-relaxed">
                                    We don't sell your personal data. We only share information with service providers who help us
                                    operate our platform, and they're contractually obligated to protect your data.
                                </p>
                            </div>
                        </details>

                        <details className="bg-white border border-slate-200 rounded-xl group overflow-hidden">
                            <summary className="px-5 py-4 cursor-pointer font-medium flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                                    <FaGavel className="text-slate-700 text-base md:text-lg mr-3 flex-shrink-0" />
                                    <span className="text-sm md:text-base text-slate-900 font-semibold truncate">Your Rights</span>
                                </div>
                                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2 text-slate-400">
                                    <FaChevronUp />
                                </div>
                            </summary>
                            <div className="px-5 py-4 border-t border-slate-100 text-sm md:text-base bg-slate-50/50">
                                <p className="text-slate-600 mb-2">
                                    You have the right to:
                                </p>
                                <ul className="list-disc pl-5 text-slate-600 space-y-1">
                                    <li>Access your personal data</li>
                                    <li>Correct inaccurate information</li>
                                    <li>Delete your account and associated data</li>
                                    <li>Opt out of marketing communications</li>
                                </ul>
                            </div>
                        </details>
                    </div>

                    {/* Contact Section */}
                    <section className="mt-8 md:mt-12 bg-slate-50 p-6 rounded-xl text-center border border-slate-100">
                        <h2 className="text-base md:text-lg font-bold text-slate-900 mb-2">Questions About Your Privacy?</h2>
                        <p className="text-slate-600 mb-2 md:mb-3">
                            Contact us at <strong className="text-slate-900">easylearnova@gmail.com</strong>
                        </p>
                        <p className="text-xs md:text-sm text-slate-400">
                            EasyLearnova, Hyderabad, Telangana, India
                        </p>
                    </section>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
