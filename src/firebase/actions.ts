'use client';
import { getAuth, signInAnonymously, type User } from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { type FormValues, type UserData } from "@/components/data-collection-form";
import { FirebaseApp } from "firebase/app";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

async function getAnonymousUser(app: FirebaseApp): Promise<User> {
    const auth = getAuth(app);
    // This will create a new anonymous user if one doesn't exist, or return the existing one.
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
}

export async function submitUserData(app: FirebaseApp, values: FormValues): Promise<UserData> {
  const user = await getAnonymousUser(app);
  const db = getFirestore(app);

  const photoURL = values.photo || "";

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

  const result: UserData = {
    id: user.uid,
    name: values.name,
    phone: values.phone,
    age: values.age,
    mandalam: values.mandalam,
    mekhala: values.mekhala,
    unit: values.unit,
    photoURL,
  };

  return result;
}
