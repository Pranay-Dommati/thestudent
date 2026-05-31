import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-[#fcf9f4] text-[#1f1f1f]">
      <Helmet>
        <title>Privacy Policy - Scrib</title>
        <meta name="description" content="Privacy Policy for Scrib by EasyLearnova." />
        <link rel="canonical" href="https://scrib.easylearnova.com/privacy" />
      </Helmet>
      <header className="sticky top-0 z-50 border-b border-[#e2dbd2] bg-[#fcf9f4]/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img src="/scrib_favicon.svg" alt="Scrib" className="h-8 w-8 rounded-lg border border-[#e2dbd2] object-cover shadow-sm" />
            <span className="text-[15px] font-bold tracking-tight">Scrib</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-[#1f1f1f]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#7b756d]">Scrib by EasyLearnova</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-[#5f5a54]">
          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">1. Introduction</h2>
            <p className="mt-3">
              This Privacy Policy explains how Scrib by EasyLearnova collects, uses, and protects user information.
            </p>
            <p className="mt-2">
              By using Scrib, you consent to the practices described below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">2. Information We Collect</h2>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-medium text-[#1f1f1f]">Account Information</h3>
                <p className="mt-1">When creating an account, we may collect:</p>
                <ul className="mt-1 list-disc pl-5 space-y-1">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Authentication details</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-[#1f1f1f]">Usage Information</h3>
                <p className="mt-1">We may collect:</p>
                <ul className="mt-1 list-disc pl-5 space-y-1">
                  <li>Topics submitted for generation</li>
                  <li>Generated PDF metadata</li>
                  <li>Credits and payment activity</li>
                  <li>Device/browser information</li>
                  <li>IP address and usage analytics</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-[#1f1f1f]">Payment Information</h3>
                <p className="mt-1">Payments are processed securely through third-party providers such as Razorpay.</p>
                <p className="mt-2 font-medium">We do not store:</p>
                <ul className="mt-1 list-disc pl-5 space-y-1">
                  <li>Card numbers</li>
                  <li>CVV</li>
                  <li>Banking credentials</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">3. How We Use Information</h2>
            <p className="mt-3 font-medium">We use collected information to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Provide PDF generation services</li>
              <li>Manage credits and payments</li>
              <li>Improve platform performance</li>
              <li>Prevent abuse and fraud</li>
              <li>Provide customer support</li>
              <li>Send important service-related notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">4. AI & Generated Content</h2>
            <p className="mt-3">
              Topics submitted by users may be processed using AI systems and cloud infrastructure to generate handwritten notes.
            </p>
            <p className="mt-2 font-medium">Users should avoid submitting:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Highly sensitive personal data</li>
              <li>Confidential information</li>
              <li>Private credentials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">5. Cookies & Analytics</h2>
            <p className="mt-3 font-medium">We may use cookies and analytics tools to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Maintain sessions</li>
              <li>Improve user experience</li>
              <li>Analyze platform usage</li>
              <li>Monitor performance and errors</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">6. Data Sharing</h2>
            <p className="mt-3">We do not sell personal data.</p>
            <p className="mt-2 font-medium">We may share limited information with trusted third-party providers involved in:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Payment processing</li>
              <li>Cloud hosting</li>
              <li>AI generation</li>
              <li>Analytics and infrastructure services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">7. Data Security</h2>
            <p className="mt-3">
              We implement reasonable technical and organizational measures to protect user data. However, no internet-based service can guarantee absolute security.
            </p>
            <p className="mt-3 font-medium">Users can:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Delete their account directly from the platform</li>
              <li>Access their stored information</li>
            </ul>
            <p className="mt-3">
              For additional privacy or account-related requests, contact: <a href="mailto:info@easylearnova.com" className="text-[#1f1f1f] underline">info@easylearnova.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">8. Children’s Privacy</h2>
            <p className="mt-3">Scrib is not intended for children under 13 without parental supervision.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">9. Policy Updates</h2>
            <p className="mt-3">
              We may update this Privacy Policy periodically. Continued use of the platform after updates indicates acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">10. Contact</h2>
            <p className="mt-3">For privacy-related questions:</p>
            <ul className="mt-2">
              <li>Email: <a href="mailto:info@easylearnova.com" className="text-[#1f1f1f] underline">info@easylearnova.com</a></li>
              <li>Website: <a href="https://easylearnova.com" target="_blank" rel="noopener noreferrer" className="text-[#1f1f1f] underline">https://easylearnova.com</a></li>
            </ul>
          </section>
        </div>
      </main>
      
      <footer className="border-t border-[#e2dbd2] py-8 text-center text-sm text-[#7b756d]">
        <div className="mx-auto max-w-5xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} EasyLearnova. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4 md:mt-0">
            <Link to="/support" className="hover:text-[#1f1f1f] transition-colors">Support</Link>
            <Link to="/terms" className="hover:text-[#1f1f1f] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#1f1f1f] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PrivacyPage
