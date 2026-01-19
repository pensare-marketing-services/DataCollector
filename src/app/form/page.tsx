
"use client";

import { useState } from 'react';
import Image from 'next/image';
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
              {userData && <h1 className="font-malayalam text-xl font-bold text-center p-4">ഒരുമിച്ച് പോരാടാം,<br/> നല്ലൊരു നാളേക്കായ്!</h1>}
              <div className="border rounded-lg overflow-hidden relative bg-card shadow-sm">
                  <div className="relative">
                      {
                          !userData ? (
                            <>
                              <Image
                                src={placeholderImages.logo.src}
                                alt={placeholderImages.logo.alt}
                                width={placeholderImages.logo.width}
                                height={placeholderImages.logo.height}
                                className="w-full h-auto"
                              />
                              <DataCollectionForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
                            </>
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
