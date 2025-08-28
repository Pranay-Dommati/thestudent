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
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [courseTitle, setCourseTitle] = useState(location.state?.courseTitle || '');
  const [progressPct, setProgressPct] = useState(0);
  const [pdfError, setPdfError] = useState(false);

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

        // 1) Get progress summary (includes certificate if already issued)
        const progressRes = await axiosInstance.get(`/courses/${courseId}/progress/`);
        const pct = progressRes.data?.progress?.percentage ?? 0;
        setProgressPct(pct);
        if (progressRes.data?.course?.title && !courseTitle) {
          setCourseTitle(progressRes.data.course.title);
        }

        // Always (re)issue when eligible to ensure we use the latest template
        if (pct >= 100) {
          setIssuing(true);
          const issueRes = await axiosInstance.post(`/courses/${courseId}/certificate/`);
          setCertificate(issueRes.data);
          toast.success('Certificate updated');
        } else {
          setError('Complete the course to generate your certificate.');
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            {certificate?.download_url && (
              <a
                href={`${certificate.download_url}?v=${encodeURIComponent(certificate.certificate_id || Date.now())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </a>
            )}
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
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h1 className="text-2xl font-bold text-white">Certificate of Completion</h1>
              </div>

              {/* Certificate Content */}
              <div className="p-8">
                {certificate?.download_url ? (
                  <div className="space-y-6">
                    {/* PDF Preview */}
                    <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Certificate is Ready!</h3>
                        <p className="text-gray-600 mb-4">Click the download button to save your certificate as a PDF</p>
                        
                        {/* PDF Preview with improved reliability */}
                        <div className="relative">
                          {!pdfError ? (
                            <iframe
                              src={`${certificate.download_url}?v=${encodeURIComponent(certificate.certificate_id || Date.now())}`}
                              className="w-full h-96 border border-gray-300 rounded-lg"
                              title="Certificate Preview"
                              onError={() => {
                                console.log('PDF iframe error detected');
                                setPdfError(true);
                              }}
                              onLoad={(e) => {
                                console.log('PDF iframe loaded successfully');
                                // Remove the timeout check that was causing false positives
                                // The iframe loaded event is sufficient indication of success
                              }}
                            />
                          ) : (
                            /* Fallback: Direct link with PDF icon */
                            <div className="flex flex-col items-center justify-center h-96 bg-gray-50 border border-gray-300 rounded-lg">
                              <svg className="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-gray-600 mb-4">Certificate preview unavailable</p>
                              <p className="text-gray-500 text-sm mb-4">Click below to view your certificate</p>
                              <a
                                href={`${certificate.download_url}?v=${encodeURIComponent(certificate.certificate_id || Date.now())}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Open Certificate in New Tab
                              </a>
                              <button
                                onClick={() => setPdfError(false)}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                              >
                                Try again
                              </button>
                            </div>
                          )}
                        </div>
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

            {/* Action Buttons */}
            {certificate?.download_url && (
              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back to course
                </button>
                <a
                  href={`${certificate.download_url}?v=${encodeURIComponent(certificate.certificate_id || Date.now())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </a>
              </div>
            )}
          </div>

          {/* Right: Course Details */}
          <div className="space-y-6">
            {/* Certificate Details Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Certificate Details</h2>
              </div>
              <div className="p-6">
                <InfoRow label="Name" value={learnerName} />
                <InfoRow label="Course" value={courseTitle || '—'} />
                <InfoRow label="Progress" value={`${progressPct}%`} />
                <InfoRow label="Issued" value={issuedDate || '—'} />
                <InfoRow label="ID" value={certificate?.certificate_id || '—'} />
              </div>
            </div>

            {/* About the Course Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">About the Course:</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{courseTitle || 'Course Title'}</h3>
                    <p className="text-gray-600 mt-1">Instructor: EasyLearnova Team</p>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="text-yellow-400">★★★★★</span>
                      <span className="ml-1">(4.8)</span>
                    </div>
                    <span>•</span>
                    <span>Completion: {progressPct}%</span>
                  </div>

                  <div className="pt-4 space-y-3">
                    <a
                      href={`${certificate?.download_url}?v=${encodeURIComponent(certificate?.certificate_id || Date.now())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </a>
                    <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share
                    </button>
                  </div>
                  
                  <div className="pt-2 text-sm text-blue-600">
                    <p>Update your certificate with your correct name or preferred language</p>
                  </div>
                </div>
              </div>
            </div>

            {!certificate && !loading && progressPct >= 100 && !issuing && (
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
            )}

            {(loading || issuing) && (
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-600">{issuing ? 'Issuing certificate...' : 'Loading...'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
