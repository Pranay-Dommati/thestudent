import { useEffect, useState } from 'react'

const MESSAGES = [
  'Opening your notebook…',
  'Turning to your notes…',
  'Warming up the quizzes…',
  'Almost there…',
]

// Book-flip loader shown while InterviewPrepPage fetches a pack. Three page
// layers flip on a staggered loop (CSS in index.css, .book-loader*) so it
// reads as one book being riffled through, not three unrelated spinners.
const PrepLoadingScreen = () => {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 1500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#f8f7f3]">
      <div className="book-loader-wrap">
        <div className="book-loader">
          <div className="book-loader__shadow" />
          <div className="book-loader__cover" />
          <div className="book-loader__spine" />
          <div className="book-loader__page book-loader__page--1">
            <span /><span /><span />
          </div>
          <div className="book-loader__page book-loader__page--2">
            <span /><span /><span />
          </div>
          <div className="book-loader__page book-loader__page--3">
            <span /><span /><span />
          </div>
        </div>
      </div>
      <p key={msgIndex} className="book-loader__caption text-[13px] font-semibold text-[#7b756d]">
        {MESSAGES[msgIndex]}
      </p>
    </div>
  )
}

export default PrepLoadingScreen
