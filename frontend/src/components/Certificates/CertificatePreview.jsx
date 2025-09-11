import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import PDFCanvasViewer from './PDFCanvasViewer';

// Simple and reliable PDF viewer component
// Internal debug helper (stripped/minimized in production builds by tree-shaking if unused)
const __debug = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[Certificate]', ...args);
  }
};
const PDFViewer = ({ url, onError, onLoad, loading, retryCount }) => {
  const [displayMethod, setDisplayMethod] = useState('iframe'); // 'iframe', 'object', 'link'
  
  const pdfUrl = url;
  
  const handleError = () => {
  __debug('PDF display failed with method', displayMethod);
    if (displayMethod === 'iframe') {
      setDisplayMethod('object');
      return;
    }
    if (displayMethod === 'object') {
      setDisplayMethod('link');
      if (onError) onError();
      return;
    }
  };

  const handleLoad = () => {
  __debug('PDF loaded successfully with method', displayMethod);
    if (onLoad) onLoad();
  };

  if (displayMethod === 'link') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg">
        <div className="text-center max-w-sm px-6">
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Certificate Ready!</h3>
          <p className="text-gray-600 mb-6 text-sm">Your certificate is ready for viewing. Click below to open it.</p>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 font-medium shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Certificate
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-white rounded border">
      {displayMethod === 'iframe' ? (
        <iframe
          key={`iframe-${retryCount}`}
          src={pdfUrl}
          className="w-full h-full border-0"
          title="Certificate Preview"
          style={{ 
            background: 'white',
            display: 'block',
            width: '100%',
            height: '100%'
          }}
          onError={handleError}
          onLoad={handleLoad}
        />
      ) : (
        <object
          key={`object-${retryCount}`}
          data={pdfUrl}
          type="application/pdf"
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
          onError={handleError}
        >
          <p className="p-4 text-center">
            Unable to display PDF. 
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">
              Click here to view
            </a>
          </p>
        </object>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-b-0 gap-1 sm:gap-0">
    <span className="text-gray-600 font-medium text-sm sm:text-base">{label}</span>
    <span className="font-semibold text-gray-900 break-all text-left sm:text-right max-w-full sm:max-w-[60%] text-sm sm:text-base">{value || '—'}</span>
  </div>
);

const CertificatePreview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [courseTitle, setCourseTitle] = useState(location.state?.courseTitle || '');
  const [progressPct, setProgressPct] = useState(0);
  const [pdfError, setPdfError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfRetryCount, setPdfRetryCount] = useState(0);
  
  // Debug logging moved to useEffect
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
  __debug('Init courseId', courseId, 'user', user?.id);
    }
  }, [courseId, user]);

  const learnerName = useMemo(() => {
    return (
      user?.full_name ||
      user?.name ||
      user?.username ||
      user?.email?.split('@')[0] ||
      'Learner'
    );
  }, [user]);

  useEffect(() => {
    const init = async () => {
      if (!courseId) {
        setError('Invalid course ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPdfError(false);
        setPdfLoading(true);
        setPdfRetryCount(0);

        // First get course details to check eligibility
        const courseRes = await axiosInstance.get(`/courses/${courseId}/`);
        const course = courseRes.data;
        
        if (!course) {
          setError('Course not found');
          return;
        }
        
        setCourseTitle(course.title);

        // Then get progress data
        const progressRes = await axiosInstance.get(`/courses/${courseId}/progress/`);
        const progress = progressRes.data?.progress;
        const pct = progress?.percentage ?? 0;
        setProgressPct(pct);

        // Check if user has completed required modules/lessons
        const hasCompletedCourse = pct >= 100;
        if (!hasCompletedCourse) {
          setError('Complete the course to generate your certificate.');
          return;
        }

        // Check if certificate already exists
        try {
          const existingCertRes = await axiosInstance.get(`/courses/${courseId}/certificate/`);
          if (existingCertRes.data) {
            setCertificate(existingCertRes.data);
            return;
          }
        } catch (certError) {
          // No existing certificate, continue to issue new one
          __debug('No existing certificate present; issuing new');
        }

        // Issue new certificate
        setIssuing(true);
        const issueRes = await axiosInstance.post(`/courses/${courseId}/certificate/`);
        if (!issueRes.data) {
          throw new Error('Failed to generate certificate');
        }
        setCertificate(issueRes.data);
      } catch (e) {
        const msg = e.response?.data?.error || e.response?.data?.detail || 'Failed to load certificate info';
        setError(msg);
      } finally {
        setIssuing(false);
        setLoading(false);
      }
    };
    init();
  }, [courseId]);

  // Reset PDF error when certificate changes
  useEffect(() => {
    if (certificate?.download_url) {
      setPdfError(false);
      setPdfLoading(true);
    }
  }, [certificate?.download_url]);

  const issuedDate = useMemo(() => {
    if (!certificate?.issued_at) return '';
    try {
      return new Date(certificate.issued_at).toLocaleString();
    } catch {
      return certificate.issued_at;
    }
  }, [certificate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Mobile-First Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Back Button - Mobile Optimized */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                __debug('Back clicked', courseId);
                try {
                  // Try to navigate to the specific course page first
                  if (courseId) {
                    __debug('Navigate explicit course page');
                    navigate(`/courses/${courseId}`);
                  } else {
                    __debug('Navigate history back');
                    navigate(-1);
                  }
                } catch (error) {
                  console.error('Navigation error:', error);
                  // Fallback to window navigation
                  if (courseId) {
                    window.location.href = `/courses/${courseId}`;
                  } else {
                    window.history.back();
                  }
                }
              }}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer relative z-10 min-w-0"
              style={{ pointerEvents: 'auto' }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-sm sm:text-base truncate">Back to Course</span>
            </button>
            
            {/* Mobile Action buttons */}
            <div className="flex items-center gap-1 sm:gap-3 relative z-10">
              {/* Share button - Mobile optimized */}
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  __debug('Top share attempt');
                  try {
                    const shareData = {
                      title: 'My Certificate of Completion',
                      text: `I've completed the ${courseTitle || 'course'} course!`,
                      url: window.location.href
                    };
                    
                    __debug('Share data', shareData);
                    
                    if (navigator.share) {
                      __debug('Using Web Share API');
                      await navigator.share(shareData);
                      // Removed automatic toast - let the system handle share feedback
                    } else {
                      __debug('Web Share unavailable; clipboard fallback');
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success('Certificate link copied to clipboard!');
                    }
                  } catch (error) {
                    __debug('Share failed', error);
                    // Manual fallback
                    const textArea = document.createElement('textarea');
                    textArea.value = window.location.href;
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                      document.execCommand('copy');
                      toast.success('Certificate link copied to clipboard!');
                    } catch (copyError) {
                      console.error('Manual copy failed:', copyError);
                      toast.error('Unable to copy link. Please copy the URL manually.');
                    }
                    document.body.removeChild(textArea);
                  }
                }}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="hidden sm:inline text-sm sm:text-base">Share</span>
              </button>
              
              {/* Download button - Mobile optimized */}
              {certificate?.download_url ? (
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    try {
                      toast.loading('Starting download...');
                      
                      // Fetch the PDF
                      const response = await fetch(certificate.download_url);
                      const blob = await response.blob();
                      
                      // Create a download link
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.style.display = 'none';
                      a.href = url;
                      a.download = `certificate-${learnerName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
                      
                      // Trigger download
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      
                      toast.dismiss();
                      toast.success('Download started!');
                    } catch (error) {
                      console.error('Download error:', error);
                      toast.dismiss();
                      toast.error('Download failed. Please try again.');
                    }
                  }}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 font-medium shadow-lg cursor-pointer relative z-10 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden xs:inline">Download</span>
                  <span className="hidden sm:inline">PDF</span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium shadow-lg opacity-50 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden xs:inline">Download</span>
                  <span className="hidden sm:inline">PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-First Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Mobile: Certificate Details First (Reordered for mobile) */}
          <div className="order-2 lg:order-2 lg:col-span-1 space-y-4 lg:space-y-6">
            {/* Enhanced Certificate Details Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center">
                  <h2 className="text-base sm:text-lg font-semibold text-white">Certificate Details</h2>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <InfoRow label="Name" value={learnerName} />
                <InfoRow label="Course" value={courseTitle || '—'} />
                <InfoRow 
                  label="Progress" 
                  value={
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-600">{progressPct}%</span>
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>
                  } 
                />
                <InfoRow label="Issued" value={issuedDate || '—'} />
                <InfoRow 
                  label="ID" 
                  value={
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {certificate?.certificate_id || '—'}
                    </span>
                  } 
                />
              </div>
            </div>

            {/* Enhanced About the Course Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center">
                  <h2 className="text-base sm:text-lg font-semibold text-white">About the Course</h2>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                    {courseTitle || 'Course Title'}
                  </h3>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Instructor: EasyLearnova Team</p>
                  {progressPct < 100 && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Complete all course requirements to unlock your certificate.
                        Current progress: {progressPct}%
                      </p>
                    </div>
                  )}
                  </div>
                  
                  <div className="flex items-center flex-wrap gap-2 sm:space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-1">(4.8)</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <span>Completion: {progressPct}%</span>
                  </div>

                  <div className="pt-4 space-y-3">
                    {certificate?.download_url && (
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            toast.loading('Preparing download...');
                            const res = await fetch(certificate.download_url);
                            if (!res.ok) throw new Error('Network response was not ok');
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `certificate-${learnerName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                            toast.dismiss();
                            toast.success('Download started');
                          } catch (err) {
                            console.error('Sidebar download failed:', err);
                            toast.dismiss();
                            toast.error('Download failed');
                          }
                        }}
                        className="w-full bg-yellow-400 text-gray-900 px-4 py-3 rounded-lg font-medium hover:bg-yellow-500 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg cursor-pointer relative z-10 text-sm sm:text-base"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Certificate
                      </button>
                    )}
                    <button 
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        __debug('Sidebar share clicked');
                        try {
                          if (navigator.share) {
                            await navigator.share({
                              title: 'Certificate of Completion',
                              text: `I've completed the ${courseTitle || 'course'} course and earned my certificate!`,
                              url: window.location.href
                            });
                            // Removed automatic toast - let the system handle share feedback
                          } else {
                            await navigator.clipboard.writeText(window.location.href);
                            toast.success('Certificate link copied to clipboard!');
                          }
                        } catch (error) {
                          __debug('Sidebar share failed', error);
                          toast.error('Unable to share. Please try again.');
                        }
                      }}
                      className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer relative z-10 text-sm sm:text-base"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share Achievement
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Badge */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="text-xs sm:text-sm min-w-0">
                  <p className="text-emerald-800 font-medium mb-1">🎉 Congratulations!</p>
                  <p className="text-emerald-700">You've successfully completed this course. Your certificate is ready to download, print, or share with potential employers and your professional network.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Display - Mobile optimized */}
          <div className="order-1 lg:order-1 lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Certificate Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-3 sm:py-4">
                <h1 className="text-lg sm:text-2xl font-bold text-white">Certificate of Completion</h1>
              </div>

              {/* Mobile-Optimized Certificate Content */}
              <div className="p-4 sm:p-6 lg:p-8">
                {certificate?.download_url ? (
                  <div className="space-y-4 lg:space-y-6">
                    {/* Canvas-based PDF Preview (fast & fills frame) */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                      <div className="relative w-full bg-gray-50 rounded">
                        <PDFCanvasViewer url={certificate.download_url} className="h-auto" />
                        {/* Action Overlay */}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <a
                            href={certificate.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg backdrop-blur-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Full View
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Certificate Info Preview */}
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                      <div className="text-center space-y-3 sm:space-y-4">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Certificate of Completion</h2>
                        <p className="text-gray-600 text-sm sm:text-base">This certifies that</p>
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">{learnerName}</div>
                        <p className="text-gray-600 text-sm sm:text-base">has successfully completed the course</p>
                        <div className="text-base sm:text-lg font-semibold text-gray-900 px-2">{courseTitle || 'Course'}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] sm:h-[400px] lg:h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-lg">
                    <div className="text-center max-w-xs sm:max-w-md px-4 sm:px-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Certificate not available</h3>
                      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Complete the course to generate your certificate.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile-Optimized Certificate Generation Button for Edge Case */}
      {!certificate && !loading && progressPct >= 100 && !issuing && location.pathname.includes('/courses/engineering/') && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <button
              onClick={async () => {
                try {
                  setIssuing(true);
                  const res = await axiosInstance.post(`/courses/${courseId}/certificate/`);
                  setCertificate(res.data);
                  toast.success('Certificate issued');
                } catch (e) {
                  toast.error(e.response?.data?.error || 'Issue failed');
                } finally {
                  setIssuing(false);
                }
              }}
              className="w-full px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
            >
              Generate certificate
            </button>
          </div>
        </div>
      )}

      {/* Mobile-Optimized Loading State */}
      {(loading || issuing) && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center">
            <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm sm:text-base">{issuing ? 'Issuing certificate...' : 'Loading...'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatePreview;
