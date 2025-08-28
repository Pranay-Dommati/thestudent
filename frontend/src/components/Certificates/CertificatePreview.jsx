import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900 break-all">{value || '—'}</span>
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

  const issuedDate = useMemo(() => {
    if (!certificate?.issued_at) return '';
    try {
      return new Date(certificate.issued_at).toLocaleString();
    } catch {
      return certificate.issued_at;
    }
  }, [certificate]);

  return (
    <div className="min-h-[70vh] px-4 md:px-8 py-10 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          >
            ← Back
          </button>
      {certificate?.download_url && (
            <a
        href={`${certificate.download_url}?v=${encodeURIComponent(certificate.certificate_id || Date.now())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Download PDF
            </a>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Certificate preview */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-wide text-gray-900">Certificate of Completion</h1>
                <p className="text-gray-500 mt-1">This certifies that</p>
              </div>

              <div className="text-center mt-2">
                <div className="text-3xl font-semibold text-indigo-700">{learnerName}</div>
                <div className="mt-3 text-gray-700">
                  has successfully completed the course
                </div>
                <div className="mt-1 text-xl font-medium text-gray-900">{courseTitle || 'Course'}</div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-gray-500">Issued</div>
                  <div className="font-medium text-gray-900">{issuedDate || (loading ? 'Loading…' : '—')}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-gray-500">Certificate ID</div>
                  <div className="font-mono text-gray-900 break-all">{certificate?.certificate_id || '—'}</div>
                </div>
              </div>

              {error && (
                <div className="mt-6 p-3 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                >
                  Back to course
                </button>
        {certificate?.download_url && (
                  <a
          href={`${certificate.download_url}?v=${encodeURIComponent(certificate.certificate_id || Date.now())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div>
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900">Certificate details</h3>
              <div className="mt-4">
                <InfoRow label="Name" value={learnerName} />
                <InfoRow label="Course" value={courseTitle || '—'} />
                <InfoRow label="Progress" value={`${progressPct}%`} />
                <InfoRow label="Issued" value={issuedDate || '—'} />
                <InfoRow label="ID" value={certificate?.certificate_id || '—'} />
              </div>

              {!certificate && !loading && progressPct >= 100 && !issuing && (
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
                  className="mt-4 w-full px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Generate certificate
                </button>
              )}

              {(loading || issuing) && (
                <div className="mt-4 text-sm text-gray-500">{issuing ? 'Issuing…' : 'Loading…'}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
