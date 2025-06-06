import React from 'react';
import { FaFileAlt, FaExternalLinkAlt, FaDownload, FaFilePdf, FaFileWord, FaFileCode } from 'react-icons/fa';

const ResourcesPage = ({ lessonResources }) => {
  // Use lesson resources if available, otherwise fall back to mock data
  const hasResources = lessonResources && (
    (lessonResources.downloadable && lessonResources.downloadable.length > 0) ||
    (lessonResources.internet && lessonResources.internet.length > 0)
  );

  const resources = hasResources ? [
    // Map downloadable resources
    ...(lessonResources.downloadable || []).map((resource, index) => ({
      id: `download-${index}`,
      title: resource.name || 'Downloadable Resource',
      description: resource.description || 'Resource for this lesson',
      type: resource.link?.includes('.pdf') ? 'pdf' : 
            resource.link?.includes('.doc') ? 'doc' : 'file',
      downloadUrl: resource.link || '#',
      isDownloadable: true
    })),
    // Map internet resources
    ...(lessonResources.internet || []).map((resource, index) => ({
      id: `internet-${index}`,
      title: resource.name || 'Internet Resource',
      description: resource.description || 'External resource for this lesson',
      type: 'link',
      downloadUrl: resource.link || '#',
      isDownloadable: false
    }))
  ] : [
    // Fallback mock data
    {
      id: 1,
      title: "Course Syllabus",
      description: "Complete overview of the curriculum and learning objectives",
      type: "pdf",
      downloadUrl: "#",
      isDownloadable: true
    },    {
      id: 2,
      title: "Practice Exercises",
      description: "Additional exercises to reinforce concepts from the lesson",
      type: "zip",
      downloadUrl: "#",
      isDownloadable: true
    },
    {
      id: 3,
      title: "Code Examples",
      description: "Sample code demonstrating key concepts",
      type: "code",
      downloadUrl: "#",
      isDownloadable: true
    },
    {
      id: 4,
      title: "Reference Guide",
      description: "Quick reference for important commands and syntax",
      type: "doc",
      downloadUrl: "#",
      isDownloadable: true
    },
    {
      id: 5,
      title: "Additional Reading",
      description: "Recommended articles and documentation",
      type: "link",
      url: "https://example.com/resources",
    }
  ];

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

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Resources</h1>
        <p className="text-gray-600">
          Supplementary materials to enhance your learning experience
        </p>
      </header>

      <div className="space-y-3">
        {resources.map(resource => (
          <div 
            key={resource.id} 
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300"
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
                >
                  <FaDownload className="mr-2" /> Download
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourcesPage;