import React from 'react';
import { FaFileAlt, FaExternalLinkAlt, FaDownload, FaFilePdf, FaFileWord, FaFileCode } from 'react-icons/fa';

const ResourcesPage = () => {
  // Sample resources data - would come from API in real implementation
  const resources = [
    {
      id: 1,
      title: "Course Syllabus",
      description: "Complete overview of the curriculum and learning objectives",
      type: "pdf",
      size: "1.2 MB",
      downloadUrl: "#",
    },
    {
      id: 2,
      title: "Practice Exercises",
      description: "Additional exercises to reinforce concepts from the lesson",
      type: "zip",
      size: "3.5 MB",
      downloadUrl: "#",
    },
    {
      id: 3,
      title: "Code Examples",
      description: "Sample code demonstrating key concepts",
      type: "code",
      size: "850 KB",
      downloadUrl: "#",
    },
    {
      id: 4,
      title: "Reference Guide",
      description: "Quick reference for important commands and syntax",
      type: "doc",
      size: "750 KB",
      downloadUrl: "#",
    },
    {
      id: 5,
      title: "Additional Reading",
      description: "Recommended articles and documentation",
      type: "link",
      url: "https://example.com/resources",
    }
  ];

  // Helper function to render appropriate icon
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
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Lesson Resources</h1>
        <p className="text-gray-600">
          Supplementary materials to enhance your learning experience
        </p>
      </header>

      <div className="space-y-4">
        {resources.map(resource => (
          <div 
            key={resource.id} 
            className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-start">
              <div className="p-3 bg-gray-100 rounded-lg mr-4">
                {getResourceIcon(resource.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">{resource.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
                
                <div className="flex justify-between items-center">
                  {resource.size && (
                    <span className="text-xs text-gray-500">{resource.size}</span>
                  )}
                  {resource.type === 'link' ? (
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center"
                    >
                      <FaExternalLinkAlt className="mr-2" /> Visit Resource
                    </a>
                  ) : (
                    <a 
                      href={resource.downloadUrl} 
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center"
                    >
                      <FaDownload className="mr-2" /> Download
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourcesPage;