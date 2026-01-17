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

    try {
      // The submitUserData function now handles the entire DB operation.
      const submittedData = await submitUserData(app, values);
      // On success, we set the user data, which triggers navigation to the info page.
      setUserData(submittedData);
      toast({
          title: "Success!",
          description: "Your data has been saved successfully.",
      });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: `Saving to the database failed: ${errorMessage}`,
        });
        console.error("Submission Error:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  // This function now handles signing out the previous user and resetting the UI.
  const handleGoBack = async () => {
    if (app) {
        const auth = getAuth(app);
        try {
            // Signing out ensures the next submission gets a new anonymous user ID.
            await signOut(auth);
        } catch (error) {
            console.error("Sign out error:", error);
            toast({
                variant: "destructive",
                title: "Failed to start new session",
                description: "Could not sign out the previous user. Please refresh the page.",
            });
        }
    }
    // Setting userData to null navigates back to the form.
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
              {userData ? "Review the details below." : "Please fill in your details below."}
            </p>
          </div>
          
          {
            !userData ? (
              <DataCollectionForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
            ) : (
              // The "Go Back" button will now trigger the signOut and reset logic.
              <UserInfoDisplay userData={userData} onGoBack={handleGoBack} />
            )
          }
        </div>
      </main>
    </div>
  );
}
