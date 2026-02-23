import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // In development, clear session cookies on home page
  if (process.env.NODE_ENV === 'development' && pathname === '/') {
    const response = NextResponse.next();
    
    // Clear all NextAuth cookies
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('__Host-next-auth.csrf-token');
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/',  // Only run on home page
};