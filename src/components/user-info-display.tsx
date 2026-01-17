"use client"

import { useRef, useState } from "react";
import { Download, Share2, Undo2 } from "lucide-react"
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { UserData } from "./data-collection-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface UserInfoDisplayProps {
  userData: UserData;
  onGoBack: () => void;
}

export function UserInfoDisplay({ userData, onGoBack }: UserInfoDisplayProps) {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [isAccepted, setIsAccepted] = useState(false);

  const handleDownload = async () => {
    const element = printRef.current;
    if (!element) {
      toast({
        title: "Download Failed",
        description: "Could not generate PDF.",
        variant: "destructive"
      });
      return;
    }
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: null });
    const data = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${userData.name.replace(/\s+/g, '_').toLowerCase()}_profile.pdf`);

    toast({
      title: "Download Started",
      description: "Your profile is being downloaded as a PDF file.",
    });
  };

  const handleShare = async () => {
    const { name, age, phone, mandalam, mekhala, unit } = userData;
    const text = `CollectIT User Profile:\n\nName: ${name}\nAge: ${age}\nPhone: ${phone}\nMandalam: ${mandalam}\nMekhala: ${mekhala}\nUnit: ${unit}`;
    
    if (navigator.share) {
        try {
            await navigator.share({ title: 'User Profile', text });
            toast({ title: "Shared Successfully" });
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
              toast({
                title: "Sharing failed",
                description: "Could not share the information. Permission may have been denied.",
                variant: "destructive",
              });
            }
        }
    } else {
        try {
            await navigator.clipboard.writeText(text);
            toast({
              title: "Copied to Clipboard",
              description: "Web sharing is not available, so the details have been copied to your clipboard.",
            });
        } catch (err) {
            toast({
              title: "Failed to Copy",
              description: "Could not copy details to clipboard.",
              variant: "destructive",
            });
        }
    }
  };

  const handleAccept = () => {
    setIsAccepted(true);
    toast({
      title: "Declaration Accepted",
      description: "You can now download or share the profile.",
    });
  };

  return (
    <Card className="w-full">
      <div ref={printRef} className="bg-card p-6">
        <div className="flex flex-row items-center gap-6">
          <Avatar className="h-28 w-28 border-4 border-secondary">
            <AvatarImage src={userData.photoURL} alt={userData.name} />
            <AvatarFallback className="text-4xl">{userData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold font-headline">{userData.name}</h2>
            <p className="text-muted-foreground">Age: {userData.age}</p>
            <p className="text-muted-foreground">Phone: {userData.phone}</p>
          </div>
        </div>
        <div className="border rounded-lg p-4 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                <div className="sm:text-center">
                    <p className="text-sm text-muted-foreground">Mandalam</p>
                    <p className="font-semibold">{userData.mandalam}</p>
                </div>
                <div className="sm:text-center">
                    <p className="text-sm text-muted-foreground">Mekhala</p>
                    <p className="font-semibold">{userData.mekhala}</p>
                </div>
                <div className="sm:text-center">
                    <p className="text-sm text-muted-foreground">Unit</p>
                    <p className="font-semibold">{userData.unit}</p>
                </div>
            </div>
        </div>
      </div>

      <CardContent>
        <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Declaration</h3>
            <div className="p-4 bg-secondary/50 rounded-md border flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-secondary-foreground text-center flex-grow">
                I hereby declare that the information provided is true and correct to the best of my knowledge and belief.
                </p>
                {!isAccepted && (
                  <Button onClick={handleAccept}>Accept</Button>
                )}
            </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        <Button variant="outline" onClick={onGoBack}><Undo2 className="mr-2 h-4 w-4"/>New Entry</Button>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownload} disabled={!isAccepted}><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
            <Button onClick={handleShare} disabled={!isAccepted} className="bg-accent text-accent-foreground hover:bg-accent/90"><Share2 className="mr-2 h-4 w-4"/>Share</Button>
        </div>
      </CardFooter>
    </Card>
  )
}
