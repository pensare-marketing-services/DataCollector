"use client";

import { useState } from 'react';
import { DataCollectionForm, type UserData } from '@/components/data-collection-form';
import { UserInfoDisplay } from '@/components/user-info-display';

export default function Home() {
  const [userData, setUserData] = useState<UserData | null>(null);

  const handleFormSubmit = (data: UserData) => {
    setUserData(data);
  };

  const handleReset = () => {
    setUserData(null);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background dark:bg-black">
      <main className="container mx-auto flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              GatherWise
            </h1>
            <p className="text-muted-foreground mt-2">
              {userData ? "Review your submitted details." : "Please fill in your details below."}
            </p>
          </div>
          
          {
            !userData ? (
              <DataCollectionForm onSubmit={handleFormSubmit} />
            ) : (
              <UserInfoDisplay userData={userData} onAccept={handleReset} />
            )
          }
        </div>
      </main>
    </div>
  );
}
