import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import axiosInstance from './utils/axios'
import { getTopicContent } from './utils/topicContentGenerator'
import NotFoundPage from './NotFoundPage'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const TopicPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [content, setContent] = useState(null)
  
  const containerRef = useRef(null)
  const [pdfWidth, setPdfWidth] = useState(null)

  useEffect(() => {
    let currentW = null
    const measure = () => {
      if (containerRef.current) {
        const w = Math.floor(containerRef.current.clientWidth)
        if (w > 0 && (!currentW || Math.abs(w - currentW) > 4)) {
          currentW = w
          setPdfWidth(w)
        }
      }
    }
    measure()
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const w = Math.floor(entry.contentRect ? entry.contentRect.width : (containerRef.current ? containerRef.current.clientWidth : 0))
        if (w > 0 && (!currentW || Math.abs(w - currentW) > 4)) {
          currentW = w
          setPdfWidth(w)
        }
      }
    })
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [topic])


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
    <div className="flex flex-col min-h-screen bg-[#fcf9f4] text-[#1f1f1f]">
      <Helmet>
        <title>{topic.title} Handwritten Notes - Scrib</title>
        <meta name="description" content={content?.overview} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <link rel="canonical" href={`https://scrib.easylearnova.com/topic/${slug}`} />
        
        {/* Open Graph Tags */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${topic.title} Handwritten Notes`} />
        <meta property="og:description" content={content?.overview} />
        <meta property="og:image" content={topic.image_url || 'https://scrib.easylearnova.com/og-image.png'} />
        <meta property="og:url" content={`https://scrib.easylearnova.com/topic/${slug}`} />
        <meta property="og:site_name" content="Scrib by EasyLearnova" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${topic.title} Handwritten Notes`} />
        <meta name="twitter:description" content={content?.overview} />
        <meta name="twitter:image" content={topic.image_url || 'https://scrib.easylearnova.com/og-image.png'} />
        
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

      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-12 md:py-20">
        <div className="flex items-center gap-2 text-sm text-[#7b756d] mb-6">
          <Link to="/" className="hover:text-[#1f1f1f]">Home</Link>
          <span>/</span>
          <Link to="/library" className="hover:text-[#1f1f1f]">Library</Link>
          <span>/</span>
          <span className="text-[#1f1f1f] truncate">{topic.title}</span>
        </div>

        {/* Note paper illustration */}
        <div className="bg-white rounded-2xl border border-[#e2dbd2] shadow-sm overflow-hidden mb-12">
          <div className="p-8 md:p-12 border-b border-[#e2dbd2] bg-[#faf8f3]">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#eef7df] text-[#557a3f] border border-[#dbe8c3] mb-4">
              AI Handwritten Study Notes
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#1f1f1f] mb-4">
              {topic.title}
            </h1>

            <div className="mt-10 flex flex-col gap-4">
              <button 
                onClick={() => navigate(`/view/${slug}`, { state: { pdfUrl: topic.pdf_url, title: topic.title, topics: [content?.category || topic.title], totalPages: topic.page_count, isPack: true, returnUrl: window.location.pathname } })}
                className="w-full rounded-lg bg-[#c05c5c] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#a84d4d] transition-colors shadow-sm"
              >
                View Full PDF Notes
              </button>
              <Link to="/generate" className="w-full rounded-lg border border-[#e2dbd2] bg-white px-6 py-3 text-center text-sm font-semibold text-[#1f1f1f] hover:bg-[#f7f4ee] transition-colors">
                Generate Custom Notes
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e2dbd2]">
            <div 
              ref={containerRef}
              className="aspect-[1/1.4] w-full rounded-xl overflow-hidden bg-[#f0eadd] relative group flex items-center justify-center cursor-pointer"
              onClick={() => navigate(`/view/${slug}`, { state: { pdfUrl: topic.pdf_url, title: topic.title, topics: [content?.category || topic.title], totalPages: topic.page_count, isPack: true, returnUrl: window.location.pathname } })}
            >
              <Document
                file={topic.pdf_url}
                loading={<span className="text-sm font-semibold text-[#9a9289]">Loading Preview...</span>}
                className="flex items-center justify-center w-full h-full"
              >
                {pdfWidth && (
                  <Page
                    pageNumber={1}
                    width={pdfWidth}
                    devicePixelRatio={Math.max(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 3)}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    className="shadow-md"
                  />
                )}
              </Document>
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="rounded-full bg-white/95 backdrop-blur px-6 py-2 text-sm font-bold shadow-md transform group-hover:scale-105 transition-all">
                  Open in Viewer
                </span>
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
          <div className="flex justify-center gap-4">
            <Link to="/support" className="hover:text-[#1f1f1f] transition-colors">Support</Link>
            <Link to="/terms" className="hover:text-[#1f1f1f] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#1f1f1f] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TopicPage
