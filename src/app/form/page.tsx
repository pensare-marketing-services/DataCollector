"use client";

import { useState } from 'react';
import { getAuth, signOut } from "firebase/auth";
import { DataCollectionForm, type UserData, type FormValues } from '@/components/data-collection-form';
import { UserInfoDisplay } from '@/components/user-info-display';
import { useFirebaseApp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { submitUserData } from '@/firebase/actions';

export default function FormPage() {
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
      const newUserData = await submitUserData(app, values);
      setUserData(newUserData);
      toast({
        title: "Success!",
        description: "Your data has been submitted successfully.",
      });
      
      const auth = getAuth(app);
      await signOut(auth);
    } catch (error) {
      console.error("Submission Failed:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    setUserData(null);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background dark:bg-black">
      <main className="container mx-auto flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              Collect
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
