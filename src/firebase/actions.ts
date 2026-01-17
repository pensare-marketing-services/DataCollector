'use client';
import { getAuth, signInAnonymously, type User } from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { type FormValues, type UserData } from "@/components/data-collection-form";
import { FirebaseApp } from "firebase/app";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";


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

    let photoURL = "";
    if (values.photo && values.photo.length > 0) {
        const photoFile = values.photo[0];
        const photoPath = `user-photos/${user.uid}/profile.jpg`;
        const storageRef = ref(storage, photoPath);

        try {
            await uploadBytes(storageRef, photoFile);
            photoURL = await getDownloadURL(storageRef);
        } catch (storageError) {
            console.error("Photo upload failed due to a network or permissions issue:", storageError);
            // We'll continue to save the rest of the data even if the photo upload fails.
        }
    }

    const dataToSave = {
        id: user.uid,
        name: values.name,
        phone: values.phone,
        age: values.age,
        mandalam: values.mandalam,
        mekhala: values.mekhala,
        unit: values.unit,
        photoURL: photoURL,
        submissionDate: new Date().toISOString(),
        acceptedDeclaration: true,
    };

    const userDocRef = doc(db, "users", user.uid);

    try {
        await setDoc(userDocRef, dataToSave);
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
        // Re-throw the original error to be caught by the calling component
        throw serverError;
    }
    
    const { photo, ...rest } = values;
    return { ...rest, photoURL: photoURL, id: user.uid };
}
