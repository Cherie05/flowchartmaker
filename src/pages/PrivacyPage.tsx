import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CustomCursor } from '../components/CustomCursor';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#efe8dc] text-slate-900 font-sans cursor-none py-20 px-8">
      <CustomCursor />
      <div className="max-w-3xl mx-auto bg-white p-12 rounded-3xl shadow-sm border border-slate-200">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl font-black mb-8 uppercase tracking-tighter">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We only collect the information you choose to give us, such as your name and email address when you join our waitlist or authenticate to use the editor.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">
            We use the information we collect in various ways, including to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide, operate, and maintain our website</li>
            <li>Improve, personalize, and expand our website</li>
            <li>Understand and analyze how you use our website</li>
            <li>Develop new products, services, features, and functionality</li>
            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Log Files</h2>
          <p className="mb-4">
            Wizzleflow follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Cookies and Web Beacons</h2>
          <p className="mb-4">
            Like any other website, Wizzleflow uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Consent</h2>
          <p className="mb-4">
            By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
