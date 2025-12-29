import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCertificate, FaDownload, FaEye, FaCalendarAlt, 
  FaAward, FaTrophy, FaSpinner, FaExternalLinkAlt 
} from 'react-icons/fa';
import universalToast from '../../../utils/universalToast';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../utils/axios';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      
      setLoading(true);
      setError('');
      
      const response = await axiosInstance.get('/courses/certificates/');
      
      
      if (response.data.success) {
        setCertificates(response.data.certificates);
        
      } else {
  const errorMsg = response.data.error || 'Failed to fetch certificates';
        setError(errorMsg);
      }
    } catch (err) {
      setError('Failed to fetch certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificate) => {
    if (!certificate.download_url) {
  universalToast.error('Certificate file not available for download');
      return;
    }
    
    try {
  universalToast.loading('Downloading certificate...');
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = certificate.download_url;
      link.download = `certificate-${certificate.course.title.replace(/\s+/g, '-')}.pdf`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
  universalToast.dismiss();
  universalToast.success('Certificate download started!');
    } catch (error) {
  universalToast.dismiss();
  universalToast.error('Failed to download certificate');
    }
  };

  const handlePreview = (certificate) => {
    
    
    try {
  const url = `/courses/${certificate.course.id}/certificate`;
      navigate(url, { state: { courseTitle: certificate.course.title } });
    } catch (error) {
      
      window.location.href = `/courses/${certificate.course.id}/certificate`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGradientColor = (index) => {
    const gradients = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-teal-500',
      'from-purple-500 to-indigo-500',
      'from-red-500 to-pink-500',
      'from-yellow-500 to-orange-500',
      'from-indigo-500 to-purple-500'
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <FaSpinner className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600">Loading your certificates...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <FaCertificate className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Certificates</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={(e) => {
            
            e.preventDefault();
            e.stopPropagation();
            fetchCertificates();
          }}
          className="relative z-10 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer active:scale-95 transform focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  if (certificates.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <FaTrophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
        <p className="text-gray-600 mb-6">
          Complete courses to earn certificates and showcase your achievements!
        </p>
        <button
          onClick={() => navigate('/courses')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <FaAward className="w-5 h-5" />
          Browse Courses
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Certificates</h2>
          <p className="text-gray-600 mt-1">
            {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FaTrophy className="w-6 h-6 text-yellow-500" />
          <span className="text-sm font-medium text-gray-700">
            {certificates.length} Achievement{certificates.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certificates.map((certificate, index) => (
          <div
            key={certificate.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
            style={{ pointerEvents: 'auto', position: 'relative' }}
          >
              {/* Simple Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FaCertificate className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate text-sm">
                    {certificate.course.title}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {certificate.course.category || certificate.course.subject || 'Course'} • {certificate.course.proficiency || 'Beginner'}
                  </p>
                </div>
              </div>

              {/* Certificate Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <FaCalendarAlt className="w-3 h-3" />
                  <span>{formatDate(certificate.issued_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <FaAward className="w-3 h-3" />
                  <span>ID: {certificate.certificate_id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex relative z-50" style={{ pointerEvents: 'auto' }}>
                <div
                  onClick={(e) => {
                    handlePreview(certificate);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium shadow-lg cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto', 
                    position: 'relative', 
                    zIndex: 99999,
                    userSelect: 'none',
                    touchAction: 'manipulation'
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <FaEye className="w-4 h-4" />
                  View Certificate
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Simple Achievement Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 rounded-lg p-4 border border-blue-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaTrophy className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">
              {certificates.length} Certificate{certificates.length !== 1 ? 's' : ''} Earned
            </span>
          </div>
          <span className="text-sm text-blue-600 font-medium">Keep Learning!</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Certificates;
