import { db } from "./config";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const backupToCloudDelta = async () => {};

export const syncFullStateToCloud = async (userId: string, data: any) => {
  // Save locally first as a fast fallback cache
  try {
    localStorage.setItem(`virtual_cloud_backup_${userId}`, JSON.stringify(data));
  } catch (err) {
    console.warn("Could not save fallback local backup cache:", err);
  }

  // Save to the actual Firestore database!
  try {
    const backupDocRef = doc(db, "users", userId, "backups", "archive");
    await setDoc(backupDocRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    console.log("Successfully uploaded complete legal archive to Firestore!");
  } catch (err) {
    console.error("Failed to upload archive to Firestore:", err);
    throw err;
  }
};

export const restoreFromCloud = async (userId: string) => {
  // First, try loading from Firestore!
  try {
    const backupDocRef = doc(db, "users", userId, "backups", "archive");
    const snapshot = await getDoc(backupDocRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      // Update local storage cache
      try {
        localStorage.setItem(`virtual_cloud_backup_${userId}`, JSON.stringify(data));
      } catch (err) {}
      return data;
    }
  } catch (err) {
    console.error("Failed to restore from Firestore, trying local fallback:", err);
  }

  // Local storage fallback
  try {
    const localData = localStorage.getItem(`virtual_cloud_backup_${userId}`);
    if (localData) {
      return JSON.parse(localData);
    }
  } catch (err) {}

  return null;
};
