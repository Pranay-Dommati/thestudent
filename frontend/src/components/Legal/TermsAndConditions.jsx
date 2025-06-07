import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaFileContract, FaShieldAlt, FaUsers, FaGavel } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <div className="flex items-center">
            <FaFileContract className="text-blue-600 text-3xl mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
              <p className="text-gray-600">Last updated: June 6, 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FaShieldAlt className="text-blue-600 mr-3" />
              Welcome to Students Hub
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms and Conditions ("Terms", "Terms and Conditions") govern your relationship with 
              Students Hub platform (the "Service") operated by Students Hub ("us", "we", or "our"). 
              Please read these Terms and Conditions carefully before using our Service.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Your access to and use of the Service is conditioned on your acceptance of and compliance 
              with these Terms. These Terms apply to all visitors, users and others who access or use 
              the Service.
            </p>
          </section>

          {/* User Accounts */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FaUsers className="text-blue-600 mr-3" />
              User Accounts
            </h3>
            <div className="space-y-4 text-gray-700">
              <p>
                When you create an account with us, you must provide information that is accurate, 
                complete, and current at all times. You are responsible for safeguarding the password 
                that you use to access the Service.
              </p>
              <p>
                You agree not to disclose your password to any third party. You must notify us 
                immediately upon becoming aware of any breach of security or unauthorized use of your account.
              </p>
              <p>
                You may not use as a username the name of another person or entity or that is not 
                lawfully available for use, a name or trademark that is subject to any rights of 
                another person or entity other than you.
              </p>
            </div>
          </section>

          {/* Educational Content */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Educational Content and Usage</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                Our Service provides educational content including courses, learning materials, 
                assessments, and related resources. This content is intended for personal, 
                non-commercial educational use only.
              </p>
              <p>
                You may not reproduce, distribute, modify, create derivative works of, publicly 
                display, publicly perform, republish, download, store, or transmit any of the 
                material on our Service without prior written consent.
              </p>
              <p>
                We strive to provide accurate and up-to-date educational content. However, we do 
                not warrant the accuracy, completeness, or usefulness of this information.
              </p>
            </div>
          </section>

          {/* User Conduct */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">User Conduct</h3>
            <div className="space-y-4 text-gray-700">
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload, post, or transmit any content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable</li>
                <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                <li>Attempt to gain unauthorized access to any portion of the Service</li>
                <li>Use the Service for any commercial purpose without our express written permission</li>
              </ul>
            </div>
          </section>

          {/* Privacy and Data */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Privacy and Data Protection</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                Your privacy is important to us. We collect and use your information in accordance 
                with our Privacy Policy. By using our Service, you consent to the collection and 
                use of your information as outlined in our Privacy Policy.
              </p>
              <p>
                We implement appropriate security measures to protect your personal information. 
                However, no method of transmission over the Internet or electronic storage is 
                100% secure, and we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Intellectual Property Rights</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                The Service and its original content, features, and functionality are and will 
                remain the exclusive property of Students Hub and its licensors. The Service is 
                protected by copyright, trademark, and other laws.
              </p>
              <p>
                Our trademarks and trade dress may not be used in connection with any product or 
                service without our prior written consent.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FaGavel className="text-blue-600 mr-3" />
              Termination
            </h3>
            <div className="space-y-4 text-gray-700">
              <p>
                We may terminate or suspend your account and bar access to the Service immediately, 
                without prior notice or liability, under our sole discretion, for any reason 
                whatsoever and without limitation.
              </p>
              <p>
                If you wish to terminate your account, you may simply discontinue using the Service 
                or contact us directly to request account deletion.
              </p>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Disclaimer</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                The information on this Service is provided on an "as is" basis. To the fullest 
                extent permitted by law, this Company excludes all representations, warranties, 
                conditions and terms.
              </p>
              <p>
                We do not guarantee that the Service will be available at all times or that it 
                will be free from errors, viruses, or other harmful components.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Limitation of Liability</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                In no event shall Students Hub, nor its directors, employees, partners, agents, 
                suppliers, or affiliates, be liable for any indirect, incidental, special, 
                consequential, or punitive damages.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Governing Law</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                These Terms shall be interpreted and governed by the laws of India, without regard 
                to its conflict of law provisions. Our failure to enforce any right or provision 
                of these Terms will not be considered a waiver of those rights.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Changes to Terms</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at 
                any time. If a revision is material, we will provide at least 30 days notice prior 
                to any new terms taking effect.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Email:</strong> support@studentshub.com</p>
                <p><strong>Phone:</strong> +91 12345 67890</p>
                <p><strong>Address:</strong> Students Hub, Educational District, India</p>
              </div>
            </div>
          </section>

          {/* Acceptance */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">Acceptance of Terms</h4>
            <p className="text-blue-800">
              By accessing and using our Service, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms and Conditions. If you do not agree to these 
              terms, please do not use our Service.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
