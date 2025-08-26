import React, { useState } from "react";

const ChatbotPage = () => {
  const [userQuery, setUserQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [learningResources, setLearningResources] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!userQuery.trim()) {
      setError("Please enter a topic to search.");
      return;
    }

    setError("");
    setLoading(true);
    setLearningResources(null);

    try {
      // Placeholder for the removed getLearningResources function
      // Replace with actual implementation if needed
    } catch (err) {
      console.error("Error fetching learning resources:", err);
      setError("Failed to fetch learning resources. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Chatbot Learning Assistant</h1>
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter a topic (e.g., JavaScript, Python)"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          style={{
            padding: "10px",
            width: "300px",
            marginRight: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007BFF",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </div>

      {loading && <p>Loading resources...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {learningResources && (
        <div>
          <h2>Structured Learning Path</h2>
          <pre
            style={{
              backgroundColor: "#f8f9fa",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              whiteSpace: "pre-wrap",
            }}
          >
            {learningResources.structuredPath}
          </pre>

          <h2>Video Resources</h2>
          {learningResources.videoResults.map((section, index) => (
            <div key={index} style={{ marginBottom: "20px" }}>
              <h3>{section.section}</h3>
              {section.videos.length > 0 ? (
                <ul>
                  {section.videos.map((video, idx) => (
                    <li key={idx} style={{ marginBottom: "10px" }}>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#007BFF", textDecoration: "none" }}
                      >
                        {video.title}
                      </a>
                      <p style={{ margin: "5px 0", fontSize: "14px" }}>
                        Channel: {video.channelTitle}
                      </p>
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        style={{ width: "120px", height: "90px" }}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No videos found for this section.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatbotPage;