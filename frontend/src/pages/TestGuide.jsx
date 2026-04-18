import { Link } from 'react-router-dom'

export default function TestGuide() {
  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center space-y-6">
        <h1 className="text-2xl sm:text-3xl font-black" style={{ color: '#002D5F' }}>
          Welcome to the Brilliant Banker user test
        </h1>
        <div className="text-left text-pnc-gray-700 text-sm leading-relaxed space-y-4">
          <p>
            Thank you for helping us test PNC&apos;s AI-powered SMB banking advisor. This prototype was built by a team
            at Carnegie Mellon University in partnership with PNC.
          </p>
          <p>
            You will be testing a working prototype, not a finished product. Some features use simulated data, but the
            AI responses are real, powered by Claude.
          </p>
          <p className="font-semibold text-pnc-navy">What you will do:</p>
          <ul className="list-decimal pl-5 space-y-2">
            <li>Pick your role: Business Owner or PNC Banker</li>
            <li>Explore the app through guided tasks, about 10 minutes</li>
            <li>Rate each feature as you go</li>
            <li>Share your overall impression at the end</li>
          </ul>
          <p className="text-pnc-gray-600">
            Your feedback is anonymous and will be shared with PNC to help shape the real product.
          </p>
          <p className="font-semibold text-pnc-navy pt-2">Ready?</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            to="/test/smb"
            className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl font-semibold text-white shadow-md"
            style={{ backgroundColor: '#002D5F' }}
          >
            I am a Business Owner
          </Link>
          <Link
            to="/test/banker"
            className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl font-semibold border-2 border-pnc-navy text-pnc-navy"
          >
            I am a PNC Banker
          </Link>
        </div>
        <Link to="/" className="inline-block text-sm text-pnc-gray-500 hover:text-pnc-orange mt-6">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
