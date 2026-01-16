'use client';
import { getAuth, signInAnonymously, type User } from "firebase/auth";
import { collection, addDoc, serverTimestamp, getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { type FormValues, type UserData } from "@/components/data-collection-form";
import { FirebaseApp } from "firebase/app";

// Caches the anonymous user to avoid re-authenticating on every action.
let anonymousUser: User | null = null;

async function getAnonymousUser(app: FirebaseApp): Promise<User> {
    const auth = getAuth(app);
    if (auth.currentUser) {
        anonymousUser = auth.currentUser;
        return anonymousUser;
    }
    if (anonymousUser) {
        return anonymousUser;
    }
    const userCredential = await signInAnonymously(auth);
    anonymousUser = userCredential.user;
    return anonymousUser;
}

export async function submitUserData(app: FirebaseApp, values: FormValues): Promise<UserData> {
    const user = await getAnonymousUser(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    if (values.photo && values.photo.length > 0) {
        const photoFile = values.photo[0];
        
        // Use a consistent filename. This will overwrite previous uploads for the same user.
        const photoPath = `user-photos/${user.uid}/profile.jpg`;
        const storageRef = ref(storage, photoPath);
        
        await uploadBytes(storageRef, photoFile);
        const photoURL = await getDownloadURL(storageRef);

        const dataToSave = {
            userId: user.uid,
            name: values.name,
            phone: values.phone,
            age: values.age,
            mandalam: values.mandalam,
            mekhala: values.mekhala,
            unit: values.unit,
            photoURL,
            createdAt: serverTimestamp(),
        };
        
        // Use the user's UID as the document ID for easy retrieval.
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, dataToSave);

        const { photo, ...rest } = values;
        
        return { ...rest, photoURL: photoURL, id: user.uid };
    }

    throw new Error("Photo is required.");
}
