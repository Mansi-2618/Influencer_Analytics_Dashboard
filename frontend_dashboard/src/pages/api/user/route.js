import { adminDb } from "@/lib/firestoreAdmin";
import { encryptToken, decryptToken } from "@/lib/encryption";

export async function POST(req) {
  const { userId, userData } = await req.json();

  const dataToSave = {
    ...userData,
    useraccess_token: encryptToken(userData.useraccess_token),
    pageaccess_token: encryptToken(userData.pageaccess_token),
    last_login: new Date().toISOString(),
  };

  await adminDb.collection("users").doc(userId).set(dataToSave, { merge: true });

  return Response.json({ success: true });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const docSnap = await adminDb.collection("users").doc(userId).get();

  if (!docSnap.exists) {
    return Response.json(null);
  }

  const data = docSnap.data();

  return Response.json({
    ...data,
    useraccess_token: decryptToken(data.useraccess_token),
    pageaccess_token: decryptToken(data.pageaccess_token),
  });
}
