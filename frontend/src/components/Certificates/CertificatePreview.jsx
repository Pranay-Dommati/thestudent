import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
    <span className="text-gray-600 font-medium">{label}</span>
    <span className="font-semibold text-gray-900 break-all text-right max-w-[60%]">{value || '—'}</span>
  </div>
);

const CertificatePreview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Debug logging
  console.log('CertificatePreview - courseId:', courseId);
  console.log('CertificatePreview - navigate function:', typeof navigate);
  console.log('CertificatePreview - user:', user);
  
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [courseTitle, setCourseTitle] = useState(location.state?.courseTitle || '');
  const [progressPct, setProgressPct] = useState(0);
  const [pdfError, setPdfError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfRetryCount, setPdfRetryCount] = useState(0);

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
      try {
        setLoading(true);
        setPdfError(false); // Reset PDF error state on reload
        setPdfLoading(true); // Reset PDF loading state
        setPdfRetryCount(0); // Reset retry count

        // 1) Get progress summary (includes certificate if already issued)
        const progressRes = await axiosInstance.get(`/courses/${courseId}/progress/`);
        console.log('Progress API response:', progressRes.data);
        const pct = progressRes.data?.progress?.percentage ?? 0;
        setProgressPct(pct);
        if (progressRes.data?.course?.title && !courseTitle) {
          console.log('Setting course title:', progressRes.data.course.title);
          setCourseTitle(progressRes.data.course.title);
        }

        // Always (re)issue when eligible to ensure we use the latest template
        if (pct >= 100) {
          setIssuing(true);
          const issueRes = await axiosInstance.post(`/courses/${courseId}/certificate/`);
          console.log('Certificate API response:', issueRes.data);
          setCertificate(issueRes.data);
          
          // Try to get course title from certificate response if not already set
          if (issueRes.data?.course?.title && !courseTitle) {
            console.log('Setting course title from certificate:', issueRes.data.course.title);
            setCourseTitle(issueRes.data.course.title);
          }
          
          // Remove the duplicate toast - only show on manual actions, not on page load
        } else {
          setError('Complete the course to generate your certificate.');
        }

        // If we still don't have a course title, try fetching course details directly
        if (!courseTitle) {
          try {
            console.log('Fetching course details directly...');
            const courseRes = await axiosInstance.get(`/courses/${courseId}/`);
            console.log('Course details API response:', courseRes.data);
            if (courseRes.data?.title) {
              console.log('Setting course title from course details:', courseRes.data.title);
              setCourseTitle(courseRes.data.title);
            }
          } catch (courseError) {
            console.log('Failed to fetch course details:', courseError);
          }
        }
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
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Back to Course clicked, courseId:', courseId);
                try {
                  // Try to navigate to the specific course page first
                  if (courseId) {
                    console.log('Navigating to course:', `/courses/${courseId}`);
                    navigate(`/courses/${courseId}`);
                  } else {
                    console.log('Navigating back in history');
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
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Course</span>
            </button>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3 relative z-10">
              {/* Share button - always available */}
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Share button clicked');
                  try {
                    const shareData = {
                      title: 'My Certificate of Completion',
                      text: `I've completed the ${courseTitle || 'course'} course!`,
                      url: window.location.href
                    };
                    
                    console.log('Attempting to share:', shareData);
                    
                    if (navigator.share) {
                      console.log('Using Web Share API');
                      await navigator.share(shareData);
                      // Removed automatic toast - let the system handle share feedback
                    } else {
                      console.log('Web Share not available, using clipboard');
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success('Certificate link copied to clipboard!');
                    }
                  } catch (error) {
                    console.log('Share/clipboard failed:', error);
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
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="hidden sm:inline">Share</span>
              </button>
              
              {/* Download button - only show when certificate is available */}
              {certificate?.download_url ? (
                <a
                  href={`${certificate.download_url}?v=${encodeURIComponent(certificate.certificate_id || Date.now())}`}
                  download={`certificate-${learnerName.replace(/\s+/g, '-').toLowerCase()}.pdf`}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Download button clicked');
                    console.log('Download URL:', certificate.download_url);
                    toast.success('Certificate download started!');
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 font-medium shadow-lg cursor-pointer relative z-10"
                  style={{ pointerEvents: 'auto' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium shadow-lg opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Certificate Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Certificate Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h1 className="text-2xl font-bold text-white">Certificate of Completion</h1>
              </div>

              {/* Certificate Content */}
              <div className="p-8">
                {certificate?.download_url ? (
                  <div className="space-y-6">
                    {/* PDF Preview */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {/* PDF Preview with enhanced UX */}
                      <div className="relative">
                          {/* Loading overlay */}
                          {pdfLoading && !pdfError && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white bg-opacity-90 rounded-lg">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                              <p className="text-gray-600 font-medium">Loading your certificate...</p>
                              <p className="text-gray-500 text-sm mt-1">Please wait while we prepare your PDF</p>
                            </div>
                          )}
                          
                          {!pdfError ? (
                            <iframe
                              key={pdfRetryCount} // Force re-render on retry
                              src={`${certificate.download_url}?v=${encodeURIComponent(certificate.certificate_id || Date.now())}&retry=${pdfRetryCount}`}
                              className={`w-full h-[600px] border-0 transition-opacity duration-300 ${
                                pdfLoading ? 'opacity-50' : 'opacity-100'
                              }`}
                              title="Certificate Preview"
                              onError={() => {
                                console.log('PDF iframe error detected, retry count:', pdfRetryCount);
                                if (pdfRetryCount < 2) {
                                  // Retry up to 2 times
                                  setTimeout(() => {
                                    setPdfRetryCount(prev => prev + 1);
                                    setPdfLoading(true);
                                  }, 1000);
                                } else {
                                  setPdfError(true);
                                  setPdfLoading(false);
                                }
                              }}
                              onLoad={(e) => {
                                console.log('PDF iframe loaded successfully');
                                setPdfLoading(false);
                                setPdfError(false);
                              }}
                            />
                          ) : (
                            /* Enhanced Fallback with better styling */
                            <div className="flex flex-col items-center justify-center h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-lg">
                              <div className="text-center max-w-md px-6">
                                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                                  <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Certificate Preview Unavailable</h3>
                                <p className="text-gray-600 mb-6">Your certificate is ready, but we can't display it inline. Don't worry - you can still view and download it!</p>
                                <div className="space-y-3">
                                  <a
                                    href={`${certificate.download_url}?v=${encodeURIComponent(certificate.certificate_id || Date.now())}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 font-medium shadow-lg"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Open Certificate in New Tab
                                  </a>
                                  <button
                                    onClick={() => {
                                      setPdfError(false);
                                      setPdfLoading(true);
                                      setPdfRetryCount(0); // Reset retry count
                                    }}
                                    className="block mx-auto text-sm text-blue-600 hover:text-blue-800 underline transition-colors"
                                  >
                                    Try loading preview again
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                    </div>

                    {/* Certificate Info Preview */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="text-center space-y-4">
                        <h2 className="text-xl font-bold text-gray-900">Certificate of Completion</h2>
                        <p className="text-gray-600">This certifies that</p>
                        <div className="text-2xl font-bold text-blue-600">{learnerName}</div>
                        <p className="text-gray-600">has successfully completed the course</p>
                        <div className="text-lg font-semibold text-gray-900">{courseTitle || 'Course'}</div>
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Certificate Not Available</h3>
                    <p className="text-gray-600">{error}</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">{issuing ? 'Generating certificate...' : 'Loading...'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Course Details */}
          <div className="space-y-6">
            {/* Enhanced Certificate Details Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex items-center">
                  <h2 className="text-lg font-semibold text-white">Certificate Details</h2>
                </div>
              </div>
              <div className="p-6">
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
              <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                <div className="flex items-center">
                  <h2 className="text-lg font-semibold text-white">About the Course</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{courseTitle || 'Course Title'}</h3>
                    <p className="text-gray-600 mt-1">Instructor: EasyLearnova Team</p>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-1">(4.8)</span>
                    </div>
                    <span>•</span>
                    <span>Completion: {progressPct}%</span>
                  </div>

                  <div className="pt-4 space-y-3">
                    <a
                      href={`${certificate?.download_url}?v=${encodeURIComponent(certificate?.certificate_id || Date.now())}`}
                      download={`certificate-${learnerName.replace(/\s+/g, '-').toLowerCase()}.pdf`}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Sidebar Download button clicked');
                        toast.success('Certificate download started!');
                      }}
                      className="w-full bg-yellow-400 text-gray-900 px-4 py-3 rounded-lg font-medium hover:bg-yellow-500 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg cursor-pointer relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Certificate
                    </a>
                    <button 
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Sidebar Share button clicked');
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
                          console.log('Sidebar share failed:', error);
                          toast.error('Unable to share. Please try again.');
                        }
                      }}
                      className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share Achievement
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Badge */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="text-emerald-800 font-medium mb-1">🎉 Congratulations!</p>
                  <p className="text-emerald-700">You've successfully completed this course. Your certificate is ready to download, print, or share with potential employers and your professional network.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Generation Button for Edge Case */}
      {!certificate && !loading && progressPct >= 100 && !issuing && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
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
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Generate certificate
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {(loading || issuing) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">{issuing ? 'Issuing certificate...' : 'Loading...'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatePreview;
