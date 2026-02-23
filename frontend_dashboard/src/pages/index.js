import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto logout in development on page load
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && session) {
      console.log('DEV] Auto logout on dev restart');
      signOut({ redirect: false });
    }
  }, []); 

  useEffect(() => {
    if (status === 'authenticated') {
      checkAndRedirect();
    }
  }, [status]);

  const checkAndRedirect = async () => {
    try {
      const res = await fetch('/api/instagram/check-credentials');
      const data = await res.json();

      if (data.hasCredentials) {
        router.push('/dashboard');
      } else {
        router.push('/credentials');
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/credentials');
    }
  };

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      name,
      email,
      password,
    });

    setLoading(false);

    if (!res?.error) {
      router.push('/credentials');
    } else {
      alert('Invalid email or password');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
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
        <title>Influencer Dashboard - Login</title>
        <meta name="description" content="Track your Instagram analytics" />
      </Head>
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">

      {/* 🎥 VIDEO BACKGROUND */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>
        
        {/* Logo */}
        <div className="absolute top-8 left-8">
          <img src="/ca-logo.png" alt="Logo" className="h-12 w-auto" />
        </div>

        <div className="bg-transparent backdrop-blur-xl p-4 rounded-2xl border border-white/20 max-w-[600px] w-full mx-4">
          
          {/* Header */}
          <div className="text-center mb-4">
            {/* Animated Analytics Bars */}
            <div className="flex justify-center mb-2">
              <div className="w-20 h-20 flex items-end justify-center gap-1.5">
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Influencer Dashboard
            </h1>
            <p className="text-gray-50 text-lg">
              Track your Instagram analytics and insights
            </p>
          </div>

          {/* Email / Password Login */}
          <form onSubmit={handleCredentialsLogin} className="space-y-5">

            <input
              type="text"
              placeholder="Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-white w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
            
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-white w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-white w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-50"
              >
                {!showPassword ? (
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-gray-50 text-m">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Google Login */}
          <button
            onClick={() => signIn('google', { callbackUrl: '/credentials' })}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-blue-300 transition-all duration-300 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          {/* Terms */}
          <div className="mt-8 text-center text-m text-gray-50">
            <p>By continuing, you agree to our</p>
            <p className="mt-1">
              <a href="#" className="text-blue-400 hover:underline">Terms of Service</a>
              {' '} & {' '}
              <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
