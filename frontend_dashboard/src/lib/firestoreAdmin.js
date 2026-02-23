import { Firestore } from "@google-cloud/firestore";
import { encryptToken, decryptToken } from './encryption';

let adminDb;

if (!adminDb) {
  adminDb = new Firestore({
    projectId: "research-playground-464015",
    databaseId: "instagram-influencer-database",
  });
}

// Save user data with encrypted tokens
export const saveUserData = async (userId, userData) => {
  try {
    const userRef = adminDb.collection('users').doc(userId);

    const dataToSave = {
      ...userData,
      useraccess_token: encryptToken(userData.useraccess_token),
      pageaccess_token: encryptToken(userData.pageaccess_token),
      last_login: new Date().toISOString(),
    };

    await userRef.set(dataToSave, { merge: true });

    console.log('Encrypted & saved');
    return { success: true };
  } catch (error) {
    console.error('Save error:', error);
    throw error;
  }
};

// Get user data with decrypted tokens
export const getUserData = async (userId) => {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    const docSnap = await userRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();

      return {
        ...data,
        useraccess_token: decryptToken(data.useraccess_token),
        pageaccess_token: decryptToken(data.pageaccess_token),
      };
    }

    return null;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export { adminDb };
