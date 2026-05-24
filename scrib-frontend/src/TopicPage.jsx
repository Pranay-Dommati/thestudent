import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import axiosInstance from './utils/axios'
import { getTopicContent } from './utils/topicContentGenerator'
import NotFoundPage from './NotFoundPage'

const TopicPage = () => {
  const { slug } = useParams()
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [content, setContent] = useState(null)

  useEffect(() => {
    let isMounted = true
    const fetchTopic = async () => {
      try {
        setLoading(true)
        const response = await axiosInstance.get(`/scrib/previews/${slug}/`)
        if (isMounted) {
          setTopic(response.data)
          setContent(getTopicContent(response.data.title))
        }
      } catch (err) {
        if (isMounted) {
          setError(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchTopic()
    return () => { isMounted = false }
  }, [slug])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fcf9f4]">Loading...</div>
  }

  if (error || !topic) {
    return <NotFoundPage />
  }

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": `${topic.title} Handwritten Notes`,
    "description": content?.overview || `AI-generated handwritten exam notes for ${topic.title}.`,
    "author": {
      "@type": "Organization",
      "name": "Scrib by EasyLearnova"
    }
  }

  // Generate breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://scrib.easylearnova.com"
    },{
      "@type": "ListItem",
      "position": 2,
      "name": "Topics",
      "item": "https://scrib.easylearnova.com/previews"
    },{
      "@type": "ListItem",
      "position": 3,
      "name": topic.title
    }]
  }

  return (
    <div className="min-h-screen bg-[#fcf9f4] text-[#1f1f1f]">
      <Helmet>
        <title>{topic.title} Handwritten Notes - Scrib</title>
        <meta name="description" content={content?.overview} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <link rel="canonical" href={`https://scrib.easylearnova.com/topic/${slug}`} />
        
        {/* Open Graph Tags */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${topic.title} Handwritten Notes`} />
        <meta property="og:description" content={content?.overview} />
        <meta property="og:url" content={`https://scrib.easylearnova.com/topic/${slug}`} />
        
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbData)}</script>
      </Helmet>

      <header className="border-b border-[#e2dbd2] bg-[#fcf9f4]/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img src="/scrib_favicon.svg" alt="Scrib" className="h-8 w-8 rounded-lg border border-[#e2dbd2] object-cover shadow-sm" />
            <span className="text-[15px] font-bold tracking-tight">Scrib</span>
          </Link>
          <Link to="/generate" className="rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white">
            Generate Yours
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        <div className="flex items-center gap-2 text-sm text-[#7b756d] mb-6">
          <Link to="/" className="hover:text-[#1f1f1f]">Home</Link>
          <span>/</span>
          <Link to="/previews" className="hover:text-[#1f1f1f]">Topics</Link>
          <span>/</span>
          <span className="text-[#1f1f1f] font-medium">{topic.title}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <span className="inline-block px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#1a1a1a] bg-[#efe7dd] rounded mb-4">
              {content?.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1f1f1f] leading-tight">
              {topic.title} Handwritten Notes
            </h1>
            
            <p className="mt-6 text-[15px] leading-relaxed text-[#5f5a54]">
              {content?.overview}
            </p>

            <div className="mt-8 border-t border-[#e2dbd2] pt-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#9a9289] mb-4">Key Concepts</h3>
              <ul className="space-y-2">
                {content?.concepts.map((concept, i) => (
                  <li key={i} className="flex items-center gap-2 text-[15px] text-[#1f1f1f]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#c05c5c]"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {concept}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex flex-col gap-4">
              <a href={topic.pdf_url} target="_blank" rel="noopener noreferrer" className="w-full rounded-lg bg-[#c05c5c] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#a84d4d] transition-colors shadow-sm">
                Download PDF Notes
              </a>
              <Link to="/generate" className="w-full rounded-lg border border-[#e2dbd2] bg-white px-6 py-3 text-center text-sm font-semibold text-[#1f1f1f] hover:bg-[#f7f4ee] transition-colors">
                Generate Custom Notes
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e2dbd2]">
            <div className="aspect-[1/1.4] w-full rounded-xl overflow-hidden bg-[#f0eadd] relative group">
              <iframe 
                src={`${topic.pdf_url}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0 object-cover pointer-events-none"
                title={`${topic.title} Preview`}
              />
              <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={topic.pdf_url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/90 backdrop-blur px-6 py-2 text-sm font-bold shadow-sm hover:scale-105 transition-transform">
                  View Full PDF
                </a>
              </div>
            </div>
            <p className="text-center text-xs text-[#9a9289] mt-3 uppercase tracking-widest font-semibold">
              Preview Page 1 of {topic.page_count}
            </p>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-[#e2dbd2] py-8 text-center text-sm text-[#7b756d]">
        <div className="mx-auto max-w-5xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} EasyLearnova. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-[#1f1f1f] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#1f1f1f] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TopicPage
