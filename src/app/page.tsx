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

  const handleFormSubmit = (values: FormValues) => {
    if (!app) {
      toast({
        variant: "destructive",
        title: "Firebase not initialized",
        description: "The application is not connected to the database.",
      });
      return;
    }
    
    setIsSubmitting(true);

    // Optimistically create user data for immediate UI update.
    // The photoURL will be a temporary local URL.
    const optimisticUserData: UserData = {
      ...values,
      photoURL: values.photo?.[0] ? URL.createObjectURL(values.photo[0]) : '',
    };

    // Immediately update the UI.
    setUserData(optimisticUserData);
    setIsSubmitting(false);
    toast({
        title: "Success!",
        description: "Your data has been submitted and is saving in the background.",
    });

    // Perform the actual submission in the background.
    // This function will now handle its own errors and toasts.
    submitUserData(app, values);
  };

  const handleGoBack = async () => {
    if (app) {
        const auth = getAuth(app);
        try {
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
              <UserInfoDisplay userData={userData} onGoBack={handleGoBack} />
            )
          }
        </div>
      </main>
    </div>
  );
}
