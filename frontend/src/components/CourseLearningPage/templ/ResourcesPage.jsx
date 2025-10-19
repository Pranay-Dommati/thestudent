import React, { useState } from 'react';
import { 
  FaFileAlt, FaExternalLinkAlt, FaDownload, FaFilePdf, FaFileWord, 
  FaFileCode, FaChevronDown, FaChevronUp, FaFileImage, FaFileVideo, 
  FaFileAudio, FaFileArchive 
} from 'react-icons/fa';

const ResourcesPage = ({ lessonResources }) => {
  const [downloadableOpen, setDownloadableOpen] = useState(false);
  const [internetOpen, setInternetOpen] = useState(false);
  
  const toggleDownloadable = () => setDownloadableOpen(!downloadableOpen);
  const toggleInternet = () => setInternetOpen(!internetOpen);

  // Simple debug log to verify resources are received
  console.log('📋 ResourcesPage - Received resources:', lessonResources);

  // Helper function to detect file type from URL or filename
  const detectFileType = (url) => {
    if (!url) return 'file';
    
    const urlLower = url.toLowerCase();
    if (urlLower.includes('.pdf')) return 'pdf';
    if (urlLower.includes('.doc') || urlLower.includes('.docx')) return 'doc';
    if (urlLower.includes('.zip') || urlLower.includes('.rar')) return 'zip';
    if (urlLower.includes('.js') || urlLower.includes('.py') || urlLower.includes('.html') || urlLower.includes('.css')) return 'code';
    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('.png') || urlLower.includes('.gif')) return 'image';
    if (urlLower.includes('.mp4') || urlLower.includes('.avi') || urlLower.includes('.mov')) return 'video';
    if (urlLower.includes('.mp3') || urlLower.includes('.wav') || urlLower.includes('.flac')) return 'audio';
    return 'file';
  };

  // Process resources only if they exist, no mock data
  const downloadableResources = lessonResources?.downloadable?.map((resource, index) => ({
    id: resource.id || `download-${index}`,
    title: resource.name || 'Downloadable Resource',
    description: resource.description || 'Resource for this lesson',
    type: detectFileType(resource.link),
    downloadUrl: resource.link || '#',
    download_url: resource.download_url, // Include the backend download endpoint
    isDownloadable: true
  })) || [];

  const internetResources = lessonResources?.internet?.map((resource, index) => ({
    id: resource.id || `internet-${index}`,
    title: resource.name || 'Internet Resource',
    description: resource.description || 'External resource for this lesson',
    type: 'link',
    downloadUrl: resource.link || '#',
    download_url: resource.download_url,
    isDownloadable: false
  })) || [];

  const hasAnyResources = downloadableResources.length > 0 || internetResources.length > 0;

  // Function to handle download with proper file handling
  const handleDownload = async (resource) => {
    try {
      // Use the dedicated download endpoint if available
      const downloadUrl = resource.download_url || resource.downloadUrl;
      
      // For resources with download_url (backend files), use the API endpoint
      if (resource.download_url && resource.download_url.startsWith('/api/resources/download/')) {
        // Use relative URL so Vite proxy handles it in dev
        const response = await fetch(resource.download_url);
        
        if (!response.ok) {
          throw new Error('Failed to download file');
        }
        
        // Get the file content as blob
        const blob = await response.blob();
        
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element for download
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Extract filename from Content-Disposition header or use resource title
        let filename = resource.title || 'download';
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        } else {
          // Add appropriate extension based on content type
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('pdf') && !filename.endsWith('.pdf')) {
            filename += '.pdf';
          } else if (contentType.includes('image/jpeg') && !filename.endsWith('.jpg')) {
            filename += '.jpg';
          } else if (contentType.includes('image/png') && !filename.endsWith('.png')) {
            filename += '.png';
          } else if (contentType.includes('word') && !filename.endsWith('.docx')) {
            filename += '.docx';
          }
        }
        
        a.download = filename;
        
        // Append to body, click, and remove
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the URL
        window.URL.revokeObjectURL(url);
        
      } else {
        // For direct URLs, try fetch first, then fallback to window.open
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
          throw new Error('Failed to download file');
        }
        
        // Get the file content as blob
        const blob = await response.blob();
        
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element for download
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Extract filename from URL or use resource title
        let filename = resource.title;
        const urlPath = downloadUrl.split('/').pop();
        if (urlPath && urlPath.includes('.')) {
          filename = urlPath;
        } else {
          // Add appropriate extension based on content type
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('pdf')) {
            filename += '.pdf';
          } else if (contentType.includes('image/jpeg')) {
            filename += '.jpg';
          } else if (contentType.includes('image/png')) {
            filename += '.png';
          } else if (contentType.includes('word')) {
            filename += '.docx';
          }
        }
        
        a.download = filename;
        
        // Append to body, click, and remove
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the URL
        window.URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      const fallbackUrl = resource.download_url || resource.downloadUrl;
      if (fallbackUrl.startsWith('/api/')) {
        window.open(fallbackUrl, '_blank');
      } else {
        window.open(fallbackUrl, '_blank');
      }
    }
  };

  const getResourceIcon = (type) => {
    switch(type) {
      case 'pdf': return <FaFilePdf className="text-red-500" />;
      case 'doc': return <FaFileWord className="text-blue-500" />;
      case 'zip': return <FaFileArchive className="text-yellow-500" />;
      case 'code': return <FaFileCode className="text-green-500" />;
      case 'image': return <FaFileImage className="text-purple-500" />;
      case 'video': return <FaFileVideo className="text-red-400" />;
      case 'audio': return <FaFileAudio className="text-green-400" />;
      case 'link': return <FaExternalLinkAlt className="text-indigo-500" />;
      default: return <FaFileAlt className="text-gray-500" />;
    }
  };
  
  // Display a specific message when no resources are available
  const noResourcesMessage = (
    <div className="text-center p-4 md:p-6 bg-gray-50 rounded-lg border border-gray-200">
      <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 bg-white rounded-full flex items-center justify-center shadow-sm">
        <FaFileAlt className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
      </div>
      <p className="text-gray-600 font-medium text-sm md:text-base mb-1">No Resources Available</p>
      <p className="text-gray-500 text-xs md:text-sm">Check back later for supplementary materials.</p>
    </div>
  );

  // Render a resource item
  const renderResourceItem = (resource) => (
    <div 
      className="p-3 md:p-4 bg-white hover:bg-gray-50 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start sm:items-center flex-1 min-w-0">
          <div className="p-2 md:p-2.5 bg-gray-100 rounded-lg mr-3 flex-shrink-0">
            {getResourceIcon(resource.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-sm md:text-base truncate">{resource.title}</h3>
            <p className="text-gray-600 text-xs md:text-sm line-clamp-2">{resource.description}</p>
          </div>
        </div>
        {resource.isDownloadable === false || resource.type === 'link' ? (
          <a 
            href={resource.downloadUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-3 py-2 md:px-4 bg-indigo-50 text-indigo-600 rounded-lg text-xs md:text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center whitespace-nowrap"
          >
            <FaExternalLinkAlt className="mr-2 text-xs md:text-sm" /> Visit Resource
          </a>
        ) : (
          <button 
            onClick={() => handleDownload(resource)}
            className="w-full sm:w-auto px-3 py-2 md:px-4 bg-indigo-50 text-indigo-600 rounded-lg text-xs md:text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer"
          >
            <FaDownload className="mr-2 text-xs md:text-sm" /> Download
          </button>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="p-3 md:p-6">
      <header className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1 md:mb-2">Resources</h1>
        <p className="text-gray-600 text-sm md:text-base">
          Supplementary materials to enhance your learning experience
        </p>
      </header>

      {!hasAnyResources ? (
        noResourcesMessage
      ) : (
        <div className="space-y-4 md:space-y-6">
          {/* Downloadable Resources Section - only show if lesson has this type */}
          {downloadableResources.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button 
                onClick={toggleDownloadable}
                className="w-full flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-gray-50 to-gray-100 transition-colors hover:from-gray-100 hover:to-gray-200 active:scale-[0.99]"
              >
                <div className="flex items-center">
                  <FaDownload className="text-indigo-600 mr-2 md:mr-3 text-sm md:text-base" />
                  <h2 className="text-base md:text-xl font-semibold text-gray-800">
                    Downloadable Resources
                  </h2>
                </div>
                {downloadableOpen ? 
                  <FaChevronUp className="text-gray-600 text-sm md:text-base" /> : 
                  <FaChevronDown className="text-gray-600 text-sm md:text-base" />
                }
              </button>
              
              {downloadableOpen && (
                <div className="divide-y divide-gray-200">
                  {downloadableResources.map((resource) => (
                    <div key={resource.id}>{renderResourceItem(resource)}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Internet Resources Section - only show if lesson has this type */}
          {internetResources.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button 
                onClick={toggleInternet}
                className="w-full flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-gray-50 to-gray-100 transition-colors hover:from-gray-100 hover:to-gray-200 active:scale-[0.99]"
              >
                <div className="flex items-center">
                  <FaExternalLinkAlt className="text-indigo-600 mr-2 md:mr-3 text-sm md:text-base" />
                  <h2 className="text-base md:text-xl font-semibold text-gray-800">
                    Internet Resources
                  </h2>
                </div>
                {internetOpen ? 
                  <FaChevronUp className="text-gray-600 text-sm md:text-base" /> : 
                  <FaChevronDown className="text-gray-600 text-sm md:text-base" />
                }
              </button>
              
              {internetOpen && (
                <div className="divide-y divide-gray-200">
                  {internetResources.map((resource) => (
                    <div key={resource.id}>{renderResourceItem(resource)}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;