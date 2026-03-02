import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "./firebase";

const PROFILES_COLLECTION = "profiles";

export interface UserProfile {
  displayName: string;
  selfieUrl: string | null;
  updatedAt: number;
}

const defaultProfile: UserProfile = {
  displayName: "",
  selfieUrl: null,
  updatedAt: 0,
};

export async function getProfile(): Promise<UserProfile> {
  const user = auth().currentUser;
  if (!user) return defaultProfile;

  const profileRef = doc(db(), PROFILES_COLLECTION, user.uid);
  const snap = await getDoc(profileRef);
  if (!snap.exists()) return defaultProfile;

  const data = snap.data();
  return {
    displayName: data.displayName ?? defaultProfile.displayName,
    selfieUrl: data.selfieUrl ?? null,
    updatedAt: data.updatedAt ?? 0,
  };
}

export async function updateProfile(updates: {
  displayName?: string;
  selfieFile?: File | Blob;
}): Promise<UserProfile> {
  const user = auth().currentUser;
  if (!user) throw new Error("Not authenticated");

  const profileRef = doc(db(), PROFILES_COLLECTION, user.uid);
  const current = await getProfile();

  let selfieUrl: string | null = current.selfieUrl;

  if (updates.selfieFile) {
    const file = updates.selfieFile;
    const ext = file instanceof File && file.name ? file.name.split(".").pop() || "jpg" : "jpg";
    const path = `profiles/${user.uid}/selfie.${ext}`;
    const storageRef = ref(storage(), path);
    await uploadBytes(storageRef, file, {
      contentType: file instanceof File ? file.type : (file.type || "image/jpeg"),
    });
    selfieUrl = await getDownloadURL(storageRef);
  }

  const next: UserProfile = {
    displayName: updates.displayName ?? current.displayName,
    selfieUrl,
    updatedAt: Date.now(),
  };

  await setDoc(profileRef, next);
  return next;
}
