import React, { useState } from 'react';
import { FaFileAlt, FaExternalLinkAlt, FaDownload, FaFilePdf, FaFileWord, FaFileCode, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ResourcesPage = ({ lessonResources }) => {
  const [downloadableOpen, setDownloadableOpen] = useState(false);
  const [internetOpen, setInternetOpen] = useState(false);
  
  const toggleDownloadable = () => setDownloadableOpen(!downloadableOpen);
  const toggleInternet = () => setInternetOpen(!internetOpen);

  // Process resources only if they exist, no mock data
  const downloadableResources = lessonResources?.downloadable?.map((resource, index) => ({
    id: `download-${index}`,
    title: resource.name || 'Downloadable Resource',
    description: resource.description || 'Resource for this lesson',
    type: resource.link?.includes('.pdf') ? 'pdf' : 
          resource.link?.includes('.doc') ? 'doc' : 'file',
    downloadUrl: resource.link || '#',
    isDownloadable: true
  })) || [];

  const internetResources = lessonResources?.internet?.map((resource, index) => ({
    id: `internet-${index}`,
    title: resource.name || 'Internet Resource',
    description: resource.description || 'External resource for this lesson',
    type: 'link',
    downloadUrl: resource.link || '#',
    isDownloadable: false
  })) || [];

  const hasAnyResources = downloadableResources.length > 0 || internetResources.length > 0;

  const getResourceIcon = (type) => {
    switch(type) {
      case 'pdf': return <FaFilePdf className="text-red-500" />;
      case 'doc': return <FaFileWord className="text-blue-500" />;
      case 'zip': return <FaFileAlt className="text-yellow-500" />;
      case 'code': return <FaFileCode className="text-green-500" />;
      case 'link': return <FaExternalLinkAlt className="text-indigo-500" />;
      default: return <FaFileAlt className="text-gray-500" />;
    }
  };
  
  // Display a specific message when no resources are available
  const noResourcesMessage = (
    <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-gray-500">No resources available for this lesson.</p>
    </div>
  );

  // Render a resource item
  const renderResourceItem = (resource) => (
    <div 
      className="p-4 bg-white hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2.5 bg-gray-100 rounded-lg mr-4">
            {getResourceIcon(resource.type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{resource.title}</h3>
            <p className="text-gray-600 text-sm">{resource.description}</p>
          </div>
        </div>
        {resource.isDownloadable === false || resource.type === 'link' ? (
          <a 
            href={resource.downloadUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center whitespace-nowrap"
          >
            <FaExternalLinkAlt className="mr-2" /> Visit Resource
          </a>
        ) : (
          <a 
            href={resource.downloadUrl}
            className="ml-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center whitespace-nowrap"
            download
          >
            <FaDownload className="mr-2" /> Download
          </a>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Resources</h1>
        <p className="text-gray-600">
          Supplementary materials to enhance your learning experience
        </p>
      </header>

      {!hasAnyResources ? (
        noResourcesMessage
      ) : (
        <div className="space-y-6">
          {/* Downloadable Resources Section - only show if lesson has this type */}
          {downloadableResources.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={toggleDownloadable}
                className="w-full flex items-center justify-between p-4 bg-gray-50 transition-colors hover:bg-gray-100"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  Downloadable Resources
                </h2>
                {downloadableOpen ? 
                  <FaChevronUp className="text-gray-600" /> : 
                  <FaChevronDown className="text-gray-600" />
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
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={toggleInternet}
                className="w-full flex items-center justify-between p-4 bg-gray-50 transition-colors hover:bg-gray-100"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  Internet Resources
                </h2>
                {internetOpen ? 
                  <FaChevronUp className="text-gray-600" /> : 
                  <FaChevronDown className="text-gray-600" />
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