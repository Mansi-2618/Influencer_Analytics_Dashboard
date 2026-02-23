// lib/auth.js
import jwt from "jsonwebtoken";
import cookie from "cookie";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "influencer_session";

// Create session cookie
export function setSession(res, user) {
  const token = jwt.sign(
    {
      uid: user.google_id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  );
}

// Read session from request
export function getSession(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Protect API routes
export function requireAuth(handler) {
  return async (req, res) => {
    const session = getSession(req);

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = session;
    return handler(req, res);
  };
}

// Logout
export function clearSession(res) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
    })
  );
}
