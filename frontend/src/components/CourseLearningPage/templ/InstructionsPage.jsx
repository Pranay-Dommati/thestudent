import React from 'react';
import { FaInfo, FaCheck, FaLaptopCode, FaDownload, FaTasks } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

const InstructionsPage = ({ lessonContent }) => {
  // If lesson content is provided, render it using ReactMarkdown
  if (lessonContent && lessonContent.aboutLesson) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="prose prose-lg max-w-none markdown-body">
          <ReactMarkdown
            components={{
              ul: ({node, ...props}) => <ul className="list-disc pl-5 my-4 space-y-2" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-4 space-y-2" {...props} />,
              li: ({node, children, ...props}) => {
                // Skip rendering empty list items
                if (!children || (Array.isArray(children) && children.length === 0) || 
                    (typeof children === 'string' && children.trim() === '')) {
                  return null;
                }
                return <li className="ml-2 my-1" {...props}>{children}</li>;
              },
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-bold my-3" {...props} />,
              p: ({node, children, ...props}) => {
                // Skip rendering empty paragraphs
                if (!children || (Array.isArray(children) && children.length === 0) || 
                    (typeof children === 'string' && children.trim() === '')) {
                  return null;
                }
                return <p className="my-4" {...props}>{children}</p>;
              },
              code: ({node, inline, className, children, ...props}) => {
                if (inline) {
                  return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                }
                return (
                  <div className="bg-gray-800 rounded-md my-4">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                      <span className="text-xs text-gray-400">code</span>
                    </div>
                    <pre className="p-4 overflow-x-auto">
                      <code className="text-white text-sm">{children}</code>
                    </pre>
                  </div>
                )
              }
            }}
          >
            {lessonContent.aboutLesson}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // Fallback to sample instructions data if no content is provided
  const instructions = {
    title: "Project: Building Your First Next.js Application",
    description: "Follow these step-by-step instructions to complete the project for this lesson.",
    prerequisites: [
      "Node.js installed on your computer",
      "Basic knowledge of React",
      "Code editor (VS Code recommended)",
      "Command line/terminal basics"
    ],
    steps: [
      {
        title: "Set up your development environment",
        description: "Make sure you have Node.js installed and set up your code editor with recommended extensions.",
        tasks: [
          "Install Node.js v14 or higher",
          "Install VS Code if you haven't already",
          "Install the ESLint and Prettier extensions for VS Code"
        ]
      },
      {
        title: "Create a new Next.js project",
        description: "Use the create-next-app command to set up a new project with the recommended configuration.",
        tasks: [
          "Open your terminal and navigate to your projects folder",
          "Run: npx create-next-app my-first-nextjs-app",
          "Navigate into the project: cd my-first-nextjs-app"
        ],
        codeBlock: {
          language: "bash",
          code: "npx create-next-app my-first-nextjs-app\ncd my-first-nextjs-app\nnpm run dev"
        }
      },
      {
        title: "Explore the project structure",
        description: "Familiarize yourself with the default project structure and key files.",
        tasks: [
          "Examine the pages folder and understand the file-based routing",
          "Look at the public folder for static assets",
          "Check out the styles folder for CSS files"
        ],
        codeBlock: {
          language: "text",
          code: "my-first-nextjs-app/\n├── pages/          # Routes are based on file names\n│   ├── _app.js     # Custom App component\n│   ├── index.js    # Home page\n├── public/         # Static files\n├── styles/         # CSS modules\n└── package.json    # Dependencies"
        }
      },
      {
        title: "Create a new page",
        description: "Create a simple About page to understand how routing works in Next.js.",
        tasks: [
          "Create a new file called about.js in the pages folder",
          "Add a simple component to display some information"
        ],
        codeBlock: {
          language: "jsx",
          code: "// pages/about.js\nexport default function About() {\n  return (\n    <div>\n      <h1>About Us</h1>\n      <p>Welcome to our Next.js application!</p>\n    </div>\n  )\n}"
        }
      },
      {
        title: "Build and deploy",
        description: "Learn how to build your project for production and deploy it.",
        tasks: [
          "Run the build command: npm run build",
          "Test the production build locally: npm start",
          "Deploy to Vercel or your preferred hosting provider"
        ]
      }
    ],
    deliverables: [
      "Complete Next.js application with at least 3 pages",
      "Custom styling using CSS modules",
      "Basic navigation between pages",
      "Deployment link to your live application"
    ]
  };

  // Helper function to render code blocks
  const renderCodeBlock = (codeBlock) => {
    if (!codeBlock) return null;
    
    return (
      <div className="bg-gray-800 rounded-md my-4">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <span className="text-xs text-gray-400">{codeBlock.language}</span>
        </div>
        <pre className="p-4 overflow-x-auto">
          <code className="text-white text-sm">{codeBlock.code}</code>
        </pre>
      </div>
    );
  };

  // Render sample data as fallback
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{instructions.title}</h1>
        <p className="text-gray-600">{instructions.description}</p>
      </header>

      {/* Prerequisites */}
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-5 rounded-r-lg mb-8">
        <div className="flex items-center mb-3">
          <FaInfo className="text-indigo-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Prerequisites</h2>
        </div>
        <ul className="space-y-2 ml-6">
          {instructions.prerequisites.map((prereq, index) => (
            <li key={index} className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span className="text-gray-700">{prereq}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div className="space-y-8 mb-8">
        {instructions.steps.map((step, index) => (
          <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-4 flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
                
                <div className="space-y-3 mb-4">
                  {step.tasks.map((task, taskIndex) => (
                    <div key={taskIndex} className="flex items-start">
                      <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{task}</span>
                    </div>
                  ))}
                </div>
                
                {renderCodeBlock(step.codeBlock)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deliverables */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center mb-4">
          <FaTasks className="text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Deliverables</h2>
        </div>
        <ul className="space-y-3 ml-6">
          {instructions.deliverables.map((deliverable, index) => (
            <li key={index} className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span className="text-gray-700">{deliverable}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InstructionsPage;