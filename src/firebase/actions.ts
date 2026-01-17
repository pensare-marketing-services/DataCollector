'use client';
import { getAuth, signInAnonymously, type User } from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { type FormValues } from "@/components/data-collection-form";
import { FirebaseApp } from "firebase/app";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { toast } from "@/hooks/use-toast";

async function getAnonymousUser(app: FirebaseApp): Promise<User> {
    const auth = getAuth(app);
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
}

export async function submitUserData(app: FirebaseApp, values: FormValues): Promise<void> {
  try {
    const user = await getAnonymousUser(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    let photoURL = "";
    if (values.photo && values.photo.length > 0 && values.photo[0]) {
      const photoFile = values.photo[0];
      const photoPath = `user-photos/${user.uid}/profile.jpg`;
      const storageRef = ref(storage, photoPath);
      
      await uploadBytes(storageRef, photoFile);
      photoURL = await getDownloadURL(storageRef);
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

    await setDoc(userDocRef, dataToSave).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'create',
          requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });

  } catch (error) {
    console.error("Background submission failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    toast({
        variant: "destructive",
        title: "Background Save Failed",
        description: `Your data could not be saved: ${errorMessage}`,
    });
  }
}
