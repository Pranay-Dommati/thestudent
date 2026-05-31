import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-[#fcf9f4] text-[#1f1f1f]">
      <Helmet>
        <title>Terms & Conditions - Scrib</title>
        <meta name="description" content="Terms and Conditions for Scrib by EasyLearnova." />
        <link rel="canonical" href="https://scrib.easylearnova.com/terms" />
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
        <h1 className="text-3xl font-bold tracking-tight text-[#1f1f1f]">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-[#7b756d]">Scrib by EasyLearnova</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-[#5f5a54]">
          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">1. Acceptance of Terms</h2>
            <p className="mt-3">
              By accessing or using Scrib by EasyLearnova (“Scrib”, “we”, “our”, or “us”), you agree to comply with these Terms & Conditions. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">2. Service Description</h2>
            <p className="mt-3">
              Scrib is an AI-powered platform that generates handwritten-style PDF notes based on topics provided by users.
            </p>
            <p className="mt-2 font-medium">Features may include:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>AI-generated handwritten notes</li>
              <li>PDF generation and downloads</li>
              <li>Free previews</li>
              <li>Credit-based purchases</li>
              <li>Multi-page note generation</li>
            </ul>
            <p className="mt-3">We may improve, modify, or discontinue features at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">3. User Accounts</h2>
            <p className="mt-3">To access certain features, users may be required to create an account.</p>
            <p className="mt-2 font-medium">You are responsible for:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Maintaining account security</li>
              <li>Keeping login credentials confidential</li>
              <li>All activity under your account</li>
            </ul>
            <p className="mt-3">We reserve the right to suspend accounts involved in abuse, fraud, or misuse.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">4. Credits & Payments</h2>
            <p className="mt-3">Scrib operates on a credit-based system.</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>1 generated PDF page typically consumes 1 credit</li>
              <li>Credits are non-refundable once used for successful generation</li>
              <li>Purchased credits do not expire unless stated otherwise</li>
              <li>Pricing may change in the future</li>
            </ul>
            <p className="mt-3">
              Payments are securely processed through third-party payment providers such as Razorpay. We do not store card or banking information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">5. Generated Content</h2>
            <p className="mt-3">Generated notes are created using AI systems and automated formatting tools.</p>
            <p className="mt-2 font-medium">Users understand that:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>AI-generated content may occasionally contain inaccuracies</li>
              <li>Users should verify important academic or factual information</li>
              <li>Scrib is intended as a study aid, not an official educational authority</li>
            </ul>
            <p className="mt-3">We are not responsible for academic outcomes resulting from the use of generated notes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">6. Acceptable Use</h2>
            <p className="mt-3 font-medium">You agree not to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Use Scrib for illegal activities</li>
              <li>Attempt to exploit, reverse engineer, or abuse the platform</li>
              <li>Upload harmful, malicious, or abusive content</li>
              <li>Use automated systems to overload the service</li>
              <li>Resell generated content at scale without permission</li>
            </ul>
            <p className="mt-3">We may restrict or terminate access for violations.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">7. Intellectual Property</h2>
            <p className="mt-3">The Scrib platform, branding, UI, software, and generated formatting systems remain the property of EasyLearnova.</p>
            <p className="mt-2">Users retain ownership of the topics they submit.</p>
            <p className="mt-2">Generated PDFs are provided for personal educational use unless otherwise permitted.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">8. Availability & Infrastructure</h2>
            <p className="mt-3">We aim to provide reliable service, but uninterrupted availability is not guaranteed.</p>
            <p className="mt-2 font-medium">Temporary downtime may occur due to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Infrastructure maintenance</li>
              <li>Third-party outages</li>
              <li>AI provider limitations</li>
              <li>Cloud service interruptions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">9. Limitation of Liability</h2>
            <p className="mt-3">To the maximum extent permitted by law, EasyLearnova shall not be liable for:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Data loss</li>
              <li>Academic losses</li>
              <li>Service interruptions</li>
              <li>AI inaccuracies</li>
              <li>Indirect or consequential damages</li>
            </ul>
            <p className="mt-3">Use of the platform is at your own risk.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">10. Privacy</h2>
            <p className="mt-3">Your use of Scrib is also governed by our <Link to="/privacy" className="text-[#1f1f1f] underline font-medium">Privacy Policy</Link>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">11. Changes to Terms</h2>
            <p className="mt-3">We may update these Terms & Conditions from time to time. Continued use of the platform after updates constitutes acceptance of the revised terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1f1f1f]">12. Contact</h2>
            <p className="mt-3">For support or legal inquiries:</p>
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

export default TermsPage
