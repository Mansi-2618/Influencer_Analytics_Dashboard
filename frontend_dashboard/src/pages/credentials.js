import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function CredentialsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    userId: '',
    pageId:'',
    useraccessToken: '',
    pageaccessToken: '',
  });
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showuserToken, setShowUserToken] = useState(false);
  const [showpageToken, setShowPageToken] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
    
    // Check if user already has credentials
    if (status === 'authenticated') {
      checkExistingCredentials();
    }
  }, [status, router]);

  const checkExistingCredentials = async () => {
    try {
      const res = await fetch('/api/instagram/check-credentials');
      const data = await res.json();
      
      if (data.hasCredentials) {
        // User already has credentials, redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking credentials:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.username.trim() || !formData.userId.trim() || !formData.userId.trim() || !formData.useraccessToken.trim() || !formData.pageaccessToken.trim()) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/instagram/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instagram: formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save credentials');
      }

      // Success - redirect to dashboard
      console.log('Credentials saved successfully');
      router.push(`/generating-dashboard`);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const maskToken = (value) => {
  if (!value) return '';
  return '•'.repeat(Math.min(value.length, 120));
};

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Connect Instagram - Influencer Dashboard</title>
      </Head>

      {/* ================== BACKGROUND ================== */}
      <div className="h-screen relative overflow-hidden px-4">

        {/* BACKGROUND IMAGE */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(/bg_pic.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#015581',
              filter: 'brightness(0.95)'
            }}
          />
          {/* Overlay for better contrast */}
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#015581]/60 via-[#017a9b]/50 to-[#0d9488]/40" />

          <div className="relative z-10 top-4 flex flex-col h-full">
          {/* Header with Logout and Logo */}
              <div className="flex justify-end items-center mb-4 flex-shrink-0">
                {/* Logo - Left side */}
                <div className="absolute top-3 left-8">
                  <img 
                    src="/ca-logo.png" 
                    alt="Logo" 
                    className="h-12 w-auto"
                  />
                </div>
                {/* Logout Button */}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-white font-md top-2 px-10 py-2 rounded-lg hover:bg-white/30 transition-all"
                >
                  ← Logout
                </button>
              </div>
           <div className="max-w-[600px] mx-auto flex flex-col h-full pb-6">
          {/* Welcome Header */}
          <div className="text-center mb-4 flex-shrink-0">
            <h1 className="text-4xl font-bold text-white mb-2">
              Connect Your Instagram
            </h1>
            <p className="text-gray-50 text-lg">
              Hi <span className="font-semibold">{session?.user?.name}</span>! Let's connect your Instagram account
            </p>
          </div>

          {/* Main Card */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-[#14b8a6]/25 via-[#0d9488]/20 to-[#0891b2]/25 backdrop-blur-xl border-2 border-[#5eead4]/40 shadow-2xl flex flex-col max-h-[75vh]">
             {/* Scrollable Form Container */}
            <div className="overflow-y-auto flex-1 px-2 custom-scrollbar">
            
            {/* Guide Toggle Button */}
            <button
              onClick={() => setShowGuide(!showGuide)}
              type="button"
              className="mb-6 w-full text-left p-4 bg-[#14b8a6]/30 hover:bg-[#14b8a6]/50 border border-[#5eead4]/30 text-white rounded-lg transition-all duration-200 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📖</span>
                <span className="font-semibold text-white">
                  How to get Access Token & User ID?
                </span>
              </div>
              <svg 
                className={`w-5 h-5 text-white transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Guide Content */}
            {showGuide && (
              <div className="mb-6 p-6 bg-[#0d9488]/30 border-2 border-[#5eead4]/40 rounded-xl animate-fadeIn">
                <h3 className="font-bold text-lg mb-4 text-white">Need Help?</h3>
                <p className="text-gray-100 mb-4">
                  We have created a detailed step-by-step guide to help you generate your Instagram Access Tokens and User ID.
                </p>
                <a
                  href="https://drive.google.com/file/d/1ZG9owQk4YnYj9w8rTKfAEAC-YQUv89Ca/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Click Here to View Guide
                </a>
                <p className="text-xs text-gray-200 mt-3">
                  💡 <strong>Tip:</strong> Keep the guide open in another tab while filling this form
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-m font-semibold text-white mb-2">
                  Instagram Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-50 text-lg">@</span>
                  <input
                    id="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border-2 border-gray-50 text-white rounded-xl focus:ring-2 focus:ring-blue-900 focus: border-transparent transition-all duration-200 outline-none"
                    placeholder="your_username"
                    disabled={loading}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-50">
                  Your Instagram handle without the @ symbol
                </p>
              </div>

              {/* User ID Field */}
              <div>
                <label htmlFor="userId" className="block text-m font-semibold text-white mb-2">
                  Instagram User ID <span className="text-red-500">*</span>
                </label>
                <input
                  id="userId"
                  type="text"
                  required
                  value={formData.userId}
                  onChange={(e) => handleInputChange('userId', e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border-2 border-gray-50 text-white rounded-xl focus:ring-2 focus:ring-blue-900 focus: border-transparent transition-all duration-200 outline-none"
                  placeholder="1234567890"
                  disabled={loading}
                />
                <p className="mt-2 text-sm text-gray-50">
                  Your numeric Instagram user ID
                </p>
              </div>

              {/* Page ID Field */}
              <div>
                <label htmlFor="pageId" className="block text-m font-semibold text-white mb-2">
                  Instagram Page ID <span className="text-red-500">*</span>
                </label>
                <input
                  id="pageId"
                  type="text"
                  required
                  value={formData.pageId}
                  onChange={(e) => handleInputChange('pageId', e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border-2 border-gray-50 text-white rounded-xl focus:ring-2 focus:ring-blue-900 focus: border-transparent transition-all duration-200 outline-none"
                  placeholder="1234567890"
                  disabled={loading}
                />
                <p className="mt-2 text-sm text-gray-50">
                  Your numeric Instagram page ID
                </p>
              </div>

              {/* Access Token Field */}
              <div className='relative'>
                <label htmlFor="useraccessToken" className="block text-m font-semibold text-white mb-2">
                  User Access Token <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="useraccessToken"
                  required
                  value={showuserToken ? formData.useraccessToken : maskToken(formData.useraccessToken)}
                  onChange={(e) =>
                    handleInputChange('useraccessToken', e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white/20 border-2 border-gray-50 text-white rounded-xl focus:ring-2 focus:ring-blue-900 focus: border-transparent transition-all duration-200 outline-none font-mono text-sm resize-none"
                  rows={5}
                  placeholder="Paste your user access token here..."
                  disabled={loading}
                />
                <span
                  onClick={() => setShowUserToken(!showuserToken)}
                  className="absolute right-4 top-30 cursor-pointer text-gray-50 hover:text-blue-600"
                >
                  {!showuserToken ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </span>
                <p className="mt-2 text-sm text-gray-50 flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  This token will be encrypted and stored securely
                </p>
              </div>

              <div className='relative'>
                <label htmlFor="userpageToken" className="block text-m font-semibold text-white mb-2">
                  Page Access Token <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="pageaccessToken"
                  required
                  value={showpageToken ? formData.pageaccessToken : maskToken(formData.pageaccessToken)}
                  onChange={(e) =>
                    handleInputChange('pageaccessToken', e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white/20 border-2 border-gray-50 text-white rounded-xl focus:ring-2 focus:ring-blue-900 focus: border-transparent transition-all duration-200 outline-none font-mono text-sm resize-none"
                  rows={5}
                  placeholder="Paste your page access token here..."
                  disabled={loading}
                />
                <span
                  onClick={() => setShowPageToken(!showpageToken)}
                  className="absolute right-4 top-30 cursor-pointer text-gray-50 hover:text-blue-600"
                >
                  {!showpageToken ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </span>
                <p className="mt-2 text-sm text-gray-50 flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  This token will be encrypted and stored securely
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 animate-shake">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                    <p className="text-red-600 text-xs mt-1">Please check your credentials and try again</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-900 to-blue-900 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-800 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Saving credentials...
                  </>
                ) : (
                  <>
                    Generate Dashboard
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                  </>
                )}
              </button>
            </form>     
            {/* Security Note */}
            <div className="mt-6 p-4 flex items-start gap-3 rounded-lg bg-transparent backdrop-blur-md border-transparent">
              <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <div className="text-m text-gray-50">
                <span className="font-semibold text-gray-50">Secure Storage:</span> Your access token is encrypted before storing in our database. We never store tokens in plain text.
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>          
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-shake {
          animation: shake 0.3s ease-out;
        }

        /* Glassmorphism Scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.35) transparent;
        }

        /* Chrome / Edge / Safari */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.45),
            rgba(255, 255, 255, 0.15)
          );
          border-radius: 12px;
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.55);
        }
      `}</style>
      </div>
  </>
  );
}