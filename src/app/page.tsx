"use client";

import { useState } from 'react';
import { getAuth, signOut } from "firebase/auth";
import { DataCollectionForm, type UserData, type FormValues } from '@/components/data-collection-form';
import { UserInfoDisplay } from '@/components/user-info-display';
import { useFirebaseApp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { submitUserData } from '@/firebase/actions';

export default function Home() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const app = useFirebaseApp();
  const { toast } = useToast();

  const handleFormSubmit = async (values: FormValues) => {
    if (!app) {
      toast({
        variant: "destructive",
        title: "Firebase not initialized",
        description: "The application is not connected to the database.",
      });
      return;
    }

    setIsSubmitting(true);

    const { photo, ...rest } = values;
    const photoFile = photo?.[0];

    // Create a temporary object URL for the image to show it immediately, if it exists
    const photoPreviewUrl = photoFile ? URL.createObjectURL(photoFile) : "";

    // Immediately update the UI to show the user info page
    setUserData({
      ...rest,
      photoURL: photoPreviewUrl, 
    });

    // Perform the actual submission in the background
    try {
      const submittedData = await submitUserData(app, values);
      // Once submission is successful, update the state with the permanent photo URL
      setUserData(submittedData);
      toast({
          title: "Success!",
          description: "Your data has been saved successfully.",
      });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
            variant: "destructive",
            title: "Background Submission Failed",
            description: `Your details were displayed, but saving to the database failed: ${errorMessage}`,
        });
        console.error("Submission Error:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (app) {
        const auth = getAuth(app);
        signOut(auth).catch((error) => {
            console.error("Sign out error:", error);
            toast({
                variant: "destructive",
                title: "Failed to start new session",
                description: "Could not sign out the previous user. Please refresh the page.",
            });
        });
    }
    setUserData(null);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background dark:bg-black">
      <main className="container mx-auto flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              CollectIT
            </h1>
            <p className="text-muted-foreground mt-2">
              {userData ? "" : "Please fill in your details below."}
            </p>
          </div>
          
          {
            !userData ? (
              <DataCollectionForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
            ) : (
              <UserInfoDisplay userData={userData} onAccept={handleReset} />
            )
          }
        </div>
      </main>
    </div>
  );
}
