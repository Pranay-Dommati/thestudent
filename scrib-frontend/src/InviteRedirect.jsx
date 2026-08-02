import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from './utils/axios';

const InviteRedirect = () => {
  const { referralCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const processReferral = async () => {
      if (!referralCode) {
        navigate('/');
        return;
      }

      // Store the referral code in localStorage (valid for 30 days theoretically, we just store it)
      localStorage.setItem('influencer_ref', referralCode);

      // Generate or retrieve visitor_id for tracking
      let visitorId = localStorage.getItem('visitor_id');
      if (!visitorId) {
        visitorId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        localStorage.setItem('visitor_id', visitorId);
      }

      try {
        // Track the click on the backend
        await axios.post('/scrib/influencers/click/', {
          referral_code: referralCode,
          visitor_id: visitorId
        });
      } catch (error) {
        console.error('Failed to track influencer click:', error);
        // We still redirect even if tracking fails
      }

      // Redirect to homepage where they can explore or signup
      navigate('/', { replace: true });
    };

    processReferral();
  }, [referralCode, navigate]);

  // Show a simple loading state while processing the redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Applying referral code...</p>
      </div>
    </div>
  );
};

export default InviteRedirect;
