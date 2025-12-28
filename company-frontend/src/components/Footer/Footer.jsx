import { Link } from 'react-router-dom';

/**
 * Footer - V3
 * Minimal, Adult.
 * Links only: Courses, Code Visualizer, Privacy, Terms.
 * Removed: About, Contact (per user request).
 */
const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-100 py-12">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                    {/* Brand */}
                    <div className="text-sm font-semibold text-slate-400">
                        © {new Date().getFullYear()} EasyLearnova
                    </div>

                    {/* Minimal Links */}
                    <nav className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-600">
                        <a href="https://courses.easylearnova.com" className="hover:text-slate-900 transition-colors">Courses</a>
                        <a href="https://codevisualizer.easylearnova.com" className="hover:text-slate-900 transition-colors">Code Visualizer</a>
                        <Link to="/privacy-policy" className="hover:text-slate-900 transition-colors">Privacy</Link>
                        <Link to="/terms-and-conditions" className="hover:text-slate-900 transition-colors">Terms</Link>
                    </nav>

                </div>
            </div>
        </footer>
    );
};

export default Footer;