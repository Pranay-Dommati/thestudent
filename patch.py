import sys
content = open('scrib-frontend/src/GeneratePage.jsx', 'r', encoding='utf-8').read()

import re

# 1. State hooks
content = content.replace(
'''  const [isOrganizing, setIsOrganizing] = useState(false)
  const [isOrganized, setIsOrganized] = useState(false)''',
'''  const [isOrganizing, setIsOrganizing] = useState(false)
  const [showAiWarning, setShowAiWarning] = useState(false)
  const [isOrganized, setIsOrganized] = useState(false)'''
)

content = content.replace(
'''  const [topics, setTopics] = useState(["Dijkstra's Algorithm"])''',
'''  const [topics, setTopics] = useState([])'''
)


# 2. Add handleOrganizeTopics
target_str = '''  const detectedTopics = useMemo(() => parseTopics(pasteText), [pasteText])

  useEffect(() => {'''
  
replacement = '''  const detectedTopics = useMemo(() => parseTopics(pasteText), [pasteText])

  const handleOrganizeTopics = async () => {
    const trimmed = pasteText.trim()
    if (!trimmed) {
      customToast.error('Please paste some syllabus text first.')
      return
    }

    setIsOrganizing(true)
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) throw new Error('Gemini API key not found in environment variables')

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract all specific study topics from the following syllabus. Rules:\\n1. Make each topic standalone and understandable out of context. If it is a sub-topic, prepend its parent category (e.g., 'Testing Strategies: Strategic issues', 'Testing: Testing Concepts').\\n2. Do NOT exclude sub-topics. For example, in 'Testing Strategies: A Strategic approach to software testing', the topic is 'Testing Strategies: A Strategic approach to software testing'.\\n3. Return ONLY a valid JSON array of strings, and nothing else. No markdown formatting.\\n\\nSyllabus:\\n${trimmed}`
            }]
          }]
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Gemini API Error Response:', response.status, errorData)
        throw new Error('Failed to parse syllabus with AI')
      }
      
      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      const jsonMatch = content.match(/\[.*\]/s)
      let parsedTopics = []
      
      try {
        parsedTopics = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
      } catch (err) {
        throw new Error('AI did not return valid JSON')
      }

      if (!Array.isArray(parsedTopics) || !parsedTopics.length) {
         throw new Error('AI returned an empty or invalid array')
      }

      setTopics(parsedTopics)
      setMode('manual')
      setPasteText('')
      setShowAiWarning(true)
      customToast.success('Topics organized successfully!')
    } catch (error) {
      console.error(error)
      customToast.error('Failed to organize topics using AI. Please try again.')
    } finally {
      setIsOrganizing(false)
    }
  }

  useEffect(() => {'''

content = content.replace(target_str, replacement)

# 3. Add AI Warning and handle manual mode
manual_render = '''            {mode === 'manual' ? (
              <div className="mt-4 rounded-xl border border-[#ded6cc]">'''
              
manual_replace = '''            {mode === 'manual' ? (
              <>
                {showAiWarning && (
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-[#fff8e6] px-4 py-3 text-xs text-[#8c6b22] border border-[#f2e6c9]">
                    <div className="flex items-start gap-2">
                       <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                       <span>AI makes mistakes. Please double-check the extracted topics before generating.</span>
                    </div>
                    <button onClick={() => setShowAiWarning(false)} className="pl-3 text-[#a38b54] hover:text-[#7a5a26]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><title>Dismiss</title><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                )}
                <div className="mt-4 rounded-xl border border-[#ded6cc]">'''

content = content.replace(manual_render, manual_replace)


# 4. Add the empty state button to 'Organize Topics'
examples_block = '''                {!pasteText ? (
                  <div className="mt-4 text-xs text-[#8a847c]">
                    <p className="font-semibold text-[#7b756d]">Examples:</p>
                    <ul className="mt-2 space-y-1">
                      <li>Unit 1: Cloud Computing, Virtualization, IaaS, PaaS</li>
                      <li>Chapter 3 - Sorting: Bubble Sort, Merge Sort, Quick Sort</li>
                      <li>Krebs Cycle, Photosynthesis, Cell Division</li>
                      <li>Or just a messy list - AI will figure it out</li>
                    </ul>
                  </div>
                ) : null}
              </div>
            )}'''
            
examples_replace = '''                {!pasteText ? (
                  <div className="mt-4 text-xs text-[#8a847c]">
                    <p className="font-semibold text-[#7b756d]">Examples:</p>
                    <ul className="mt-2 space-y-1">
                      <li>Unit 1: Cloud Computing, Virtualization, IaaS, PaaS</li>
                      <li>Chapter 3 - Sorting: Bubble Sort, Merge Sort, Quick Sort</li>
                      <li>Krebs Cycle, Photosynthesis, Cell Division</li>
                      <li>Or just a messy list - AI will figure it out</li>
                    </ul>
                  </div>
                ) : (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleOrganizeTopics}
                      disabled={isOrganizing}
                      className="rounded-full bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {isOrganizing ? 'Organizing...' : 'Organize topics'}
                    </button>
                  </div>
                )}
              </div>
            )}'''

content = content.replace(examples_block, examples_replace)

# 5. Disable generate button appropriately
btn_target = '''            <button
              onClick={handleGenerate}
              disabled={isGenerating || !isLoggedIn}
              className={`rounded-xl px-5 py-2 text-xs font-semibold ${
                isGenerating || !isLoggedIn
                  ? 'bg-[#e7e2db] text-[#b1aaa0]'
                  : 'bg-[#1b1b1b] text-white'
              }`}
            >
              {isGenerating
                  ? 'Generating...'
                  : isMultiTopic
                    ? 'Generate PDF'
                    : 'Generate note'}
            </button>'''

btn_replace = '''            <button
              onClick={handleGenerate}
              disabled={isGenerating || !isLoggedIn || mode === 'paste' || isOrganizing}
              className={`rounded-xl px-5 py-2 text-xs font-semibold ${
                isGenerating || !isLoggedIn || mode === 'paste' || isOrganizing
                  ? 'bg-[#e7e2db] text-[#b1aaa0]'
                  : 'bg-[#1b1b1b] text-white'
              }`}
            >
              {isGenerating
                  ? 'Generating...'
                  : mode === 'paste'
                    ? 'Organize topics first'
                    : isMultiTopic
                      ? 'Generate PDF'
                      : 'Generate note'}
            </button>'''

content = content.replace(btn_target, btn_replace)

# 6. Format the predictive logic properly output
predictive_target = '''            {mode === 'manual' ? (
              <>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-[#6f6a63]">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#6db05d]" />
                      Output:{' '}
                      <span className="font-semibold text-[#1f1f1f]">
                        {isMultiTopic ? `PDF - ${baseTopics.length} pages` : '1 image'}
                      </span>
                      {isMultiTopic ? null : ' - PNG - 1 credit'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-[#2b7a4b]">
                  {detectedTopics.length ? `${detectedTopics.length} topics detected` : 'Paste topics to see cost'}
                  {detectedTopics.length ? ' across units' : ''}
                </span>
              </div>
            )}'''
predictive_replace = '''            {mode === 'manual' ? (
              <>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-[#6f6a63]">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#6db05d]" />
                      Output:{' '}
                      <span className="font-semibold text-[#1f1f1f]">
                        {isMultiTopic ? `PDF - ${baseTopics.length} pages` : '1 image'}
                      </span>
                      {isMultiTopic ? null : ' - PNG - 1 credit'}
                    </span>
                  </div>
                </div>
              </>
            ) : null}'''

content = content.replace(predictive_target, predictive_replace)

# Write file
open('scrib-frontend/src/GeneratePage.jsx', 'w', encoding='utf-8').write(content)

print("Patch applied successfully.")
