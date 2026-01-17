'use client';
import { getAuth, signInAnonymously, type User } from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { type FormValues, type UserData } from "@/components/data-collection-form";
import { FirebaseApp } from "firebase/app";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";


async function getAnonymousUser(app: FirebaseApp): Promise<User> {
    const auth = getAuth(app);
    // Always sign in a new anonymous user for each submission
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
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
            // Re-throw the error so the UI can catch it and display a message.
            throw storageError;
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
    
    // Return all data including the final photoURL for the UI
    return { 
      name: values.name,
      phone: values.phone,
      age: values.age,
      mandalam: values.mandalam,
      mekhala: values.mekhala,
      unit: values.unit,
      photoURL: photoURL, 
      id: user.uid 
    };
}