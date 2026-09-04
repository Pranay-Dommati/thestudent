import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getScribOrigin } from '../../utils/scribOrigin';

/**
 * The influencer referral program lives on the Scrib app (its own subdomain).
 * localStorage does not cross subdomains, so if someone lands on
 * easylearnova.com/invite/<code> we hand off to scrib.../invite/<code>, where
 * the code is actually stored and later read at signup. The Scrib InviteRedirect
 * records the click and stores the code.
 */
const InviteRedirect = () => {
  const { referralCode } = useParams();

  useEffect(() => {
    const scrib = getScribOrigin();
    window.location.replace(
      referralCode ? `${scrib}/invite/${encodeURIComponent(referralCode)}` : scrib
    );
  }, [referralCode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Redirecting…</p>
      </div>
    </div>
  );
};

export default InviteRedirect;
