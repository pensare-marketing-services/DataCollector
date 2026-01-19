
'use client';
import { getAuth, signInAnonymously, type User } from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { type FormValues, type UserData } from "@/components/data-collection-form";
import { FirebaseApp } from "firebase/app";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

async function getAnonymousUser(app: FirebaseApp): Promise<User> {
    const auth = getAuth(app);
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
}

export async function submitUserData(app: FirebaseApp, values: FormValues): Promise<UserData> {
  const user = await getAnonymousUser(app);
  const db = getFirestore(app);

  // The 'photo' value from the form is already a Base64 data URL because of the resizing logic.
  const photoURL = values.photo || "";

  const dataToSave = {
    id: user.uid,
    name: values.name,
    phone: values.phone,
    age: values.age,
    mandalam: values.mandalam,
    mekhala: values.mekhala,
    unit: values.unit,
    photoURL: photoURL, // Save the Base64 data URL directly to Firestore
    submissionDate: new Date().toISOString(),
    acceptedDeclaration: values.acceptedDeclaration,
  };

  const userDocRef = doc(db, "users", user.uid);

  // Save the entire document, including the image data URL, to Firestore.
  await setDoc(userDocRef, dataToSave).catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'create',
        requestResourceData: dataToSave,
      });
      errorEmitter.emit('permission-error', permissionError);
      // Re-throw the original error to be caught by the form handler
      throw serverError;
  });

  const result: UserData = {
    id: user.uid,
    name: values.name,
    phone: values.phone,
    age: values.age,
    mandalam: values.mandalam,
    mekhala: values.mekhala,
    unit: values.unit,
    photoURL,
    submissionDate: dataToSave.submissionDate,
  };

  return result;
}
