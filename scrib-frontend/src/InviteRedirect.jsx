import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from './utils/axios';
import { setReferralCode, getVisitorId } from './utils/referral';

const InviteRedirect = () => {
  const { referralCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!referralCode) {
      navigate('/', { replace: true });
      return;
    }

    // Persist the referral code (30-day expiry) so signup can attribute it.
    setReferralCode(referralCode);

    // Track the click in the background — never block the redirect.
    axios
      .post('/scrib/influencers/click/', {
        referral_code: referralCode,
        visitor_id: getVisitorId(),
      })
      .catch((error) => {
        console.error('Failed to track influencer click:', error);
      });

    // Redirect to homepage immediately, without showing an interstitial
    navigate('/', { replace: true });
  }, [referralCode, navigate]);

  return null;
};

export default InviteRedirect;
