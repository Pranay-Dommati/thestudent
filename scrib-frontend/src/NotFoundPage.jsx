import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | Scrib</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcf9f4] text-[#1f1f1f]">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-4 text-lg text-[#5f5a54]">Oops! The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-8 rounded-lg bg-[#1a1a1a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#333333] transition-colors">
          Return Home
        </Link>
      </div>
    </>
  )
}

export default NotFoundPage
