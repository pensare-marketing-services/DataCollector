"use client";

import { useState } from 'react';
import { getAuth, signOut } from "firebase/auth";
import { DataCollectionForm, type UserData, type FormValues } from '@/components/data-collection-form';
import { UserInfoDisplay } from '@/components/user-info-display';
import { useFirebaseApp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { submitUserData } from '@/firebase/actions';
import placeholderImages from '@/app/lib/placeholder-images.json';

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
    <div className="min-h-screen bg-background">
        <main className="container mx-auto flex flex-col items-center justify-center p-4 min-h-screen">
            <div className="w-full max-w-2xl">
              <div className="border rounded-lg overflow-hidden relative bg-card shadow-sm">
                  <div
                      className="absolute inset-0 bg-contain bg-no-repeat bg-center opacity-10 pointer-events-none"
                      style={{
                          backgroundImage: `url(${placeholderImages.logo.src})`,
                      }}
                  />
                  <div className="relative">
                      {
                          !userData ? (
                          <DataCollectionForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
                          ) : (
                          <UserInfoDisplay userData={userData} onGoBack={handleGoBack} />
                          )
                      }
                  </div>
              </div>
            </div>
        </main>
    </div>
  );
}
