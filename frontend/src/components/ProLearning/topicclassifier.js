// topicclassifier.js
// Gemini-based topic classifier for ProLearningPage

// Get Gemini API key from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Gemini-based topic classifier
export async function classifyTopicsWithGemini(userInput, apiKey = GEMINI_API_KEY) {
  console.log('[Gemini] classifyTopicsWithGemini called with:', userInput, apiKey ? 'API KEY PRESENT' : 'NO API KEY');
  // Prevent API calls for empty or very short input
  if (!userInput || userInput.trim().length < 3) {
    return [];
  }
  // Validate API key (like getGeminiApiKey)
  if (!apiKey || apiKey.length < 10) {
    throw new Error('Invalid or missing Gemini API key. Please check your environment variables.');
  }

  const models = ['gemini-1.5-flash','gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
  let lastError;

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const prompt = `
You are a smart educational topic classifier AI integrated into a student learning platform.

Your task is:
- Given any user input, extract only the *meaningful and realistic learning topics*.
- Return the final result as a *JSON array of strings* (no explanations, just the array).
- Avoid extracting generic or non-informative words like "I", "want", "learn", "something", etc.
- If the user input contains fake, irrelevant, or gibberish content, return an empty array.
- Each topic in the array should be a concise, standardized topic name (e.g., "HTML", "CSS", "Python", "React.js").
- Do not include duplicate or highly similar topics.
- Return between 1 to 5 *actual learning topics* only if they exist in the input.

Examples:

Input: "I want to learn HTML and CSS"  
Output: ["HTML", "CSS"]

Input: "Please help me with machine learning and data science basics"  
Output: ["Machine Learning", "Data Science"]

Input: "I wanna be a hacker and learn something"  
Output: []

Input: "Teach me React.js, TypeScript, and Node.js"  
Output: ["React.js", "TypeScript", "Node.js"]

Input: "I need Java and DSA"  
Output: ["Java", "Data Structures and Algorithms"]

Now classify the user input below accordingly.

User input: "${userInput}"

Topics (JSON array only):
`;

    // Add timeout (AbortController)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${JSON.stringify(errorData)}`;
        } catch {}
        if (response.status === 429 || response.status === 403) {
          lastError = new Error(errorMessage);
          continue; // Try next model
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Extract the JSON array from the model's response
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      try {
        const topics = JSON.parse(text);
        if (Array.isArray(topics)) {
          return topics.map((name, idx) => ({ id: idx + 1, name: name.trim(), isActive: idx === 0 }));
        }
      } catch (e) {
        lastError = new Error('Failed to parse Gemini response as JSON array.');
        continue;
      }
    } catch (error) {
      lastError = error;
      continue;
    }
  }
  // If all models fail, use regex-based fallback to extract meaningful words/phrases
  const stopWords = [
    'i', 'want', 'all', 'those', 'something', 'to', 'learn', 'me', 'please', 'help', 'be', 'a', 'the', 'and', 'with', 'need', 'teach', 'become', 'like', 'in', 'on', 'for', 'of', 'about', 'my', 'some', 'any', 'that', 'this', 'these', 'those', 'it', 'is', 'an', 'as', 'at', 'by', 'do', 'so', 'from', 'just', 'can', 'could', 'would', 'should', 'will', 'may', 'might', 'must', 'shall', 'if', 'or', 'but', 'not', 'no', 'yes', 'you', 'your', 'we', 'our', 'us', 'they', 'their', 'them', 'he', 'his', 'she', 'her', 'him', 'its', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'having', 'get', 'got', 'getting', 'gotten', 'make', 'made', 'making', 'see', 'saw', 'seen', 'seeing', 'go', 'went', 'gone', 'going', 'come', 'came', 'coming', 'know', 'knew', 'known', 'knowing', 'think', 'thought', 'thinking', 'say', 'said', 'saying', 'tell', 'told', 'telling', 'ask', 'asked', 'asking', 'give', 'gave', 'given', 'giving', 'find', 'found', 'finding', 'take', 'took', 'taken', 'taking', 'use', 'used', 'using', 'work', 'worked', 'working', 'try', 'tried', 'trying', 'start', 'started', 'starting', 'stop', 'stopped', 'stopping', 'continue', 'continued', 'continuing', 'begin', 'began', 'begun', 'beginning', 'end', 'ended', 'ending', 'show', 'showed', 'shown', 'showing', 'let', 'lets', "let's", 'see', 'look', 'looked', 'looking', 'watch', 'watched', 'watching', 'read', 'reading', 'write', 'wrote', 'written', 'writing', 'study', 'studied', 'studying', 'practice', 'practiced', 'practicing', 'learned', 'learning', 'teach', 'taught', 'teaching', 'understand', 'understood', 'understanding', 'explain', 'explained', 'explaining', 'helped', 'helping', 'showed', 'showing', 'told', 'telling', 'taught', 'teaching', 'explained', 'explaining'
  ];
  // Extract words/phrases, filter out stop words, return unique capitalized topics
  const words = userInput.match(/\b([a-zA-Z][a-zA-Z0-9\-\.#\+]+)\b/g) || [];
  const filtered = words.filter(w => !stopWords.includes(w.toLowerCase()));
  // Remove duplicates, capitalize, and return as topic objects
  const unique = [...new Set(filtered.map(w => w.trim()))];
  if (unique.length === 0) throw lastError || new Error('All Gemini models failed and no topics found');
  return unique.slice(0, 5).map((name, idx) => ({ id: idx + 1, name: name.charAt(0).toUpperCase() + name.slice(1), isActive: idx === 0 }));
} 