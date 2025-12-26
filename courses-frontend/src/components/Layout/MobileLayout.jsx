import React from 'react';

const MobileLayout = ({ children, className = '' }) => {
  return (
    <div className={`
      /* Mobile padding for top and bottom navigation */
      pt-16 pb-20 
      /* Desktop padding (only top for navbar) */
      md:pt-20 md:pb-0 
      /* Additional custom classes */
      ${className}
    `}>
      {children}
    </div>
  );
};

export default MobileLayout;
