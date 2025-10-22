import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * SEO Component for managing meta tags across the application
 * Follows professional SEO best practices with optimal character limits
 */
const SEO = ({
  title = 'EasyLearnova - AI-Powered Student Learning Hub',
  description = 'EasyLearnova — AI-powered student learning hub. Discover free, structured course playlists for school and college and learn faster with personalized paths.',
  keywords = 'EasyLearnova, AI learning, free courses, student learning hub, curated playlists, online courses',
  canonical = 'https://easylearnova.com/',
  ogImage = 'https://easylearnova.com/social-preview.png',
  ogType = 'website',
  noindex = false,
}) => {
  // Ensure title includes brand name if not already present
  const fullTitle = title.includes('EasyLearnova') ? title : `${title} | EasyLearnova`;
  
  // Truncate description to 155 characters if needed
  const truncatedDescription = description.length > 155 
    ? description.substring(0, 152) + '...' 
    : description;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={truncatedDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="EasyLearnova" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  canonical: PropTypes.string,
  ogImage: PropTypes.string,
  ogType: PropTypes.string,
  noindex: PropTypes.bool,
};

export default SEO;
