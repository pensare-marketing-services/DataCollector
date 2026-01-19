"use client"

import { useState } from "react";
import { Download, Share2, Undo2 } from "lucide-react"
import jsPDF from "jspdf";
import type { UserData } from "./data-collection-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface UserInfoDisplayProps {
  userData: UserData;
  onGoBack: () => void;
}

export function UserInfoDisplay({ userData, onGoBack }: UserInfoDisplayProps) {
  const { toast } = useToast();
  const [isAccepted, setIsAccepted] = useState(false);

  const handleDownload = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = margin;

    // --- PDF Title ---
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("AIYF", pdfWidth / 2, yPos, { align: "center" });
    yPos += 15;
    
    // --- User Image ---
    if (userData.photoURL) {
        try {
            const img = new Image();
            img.src = userData.photoURL;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            
            // Define a max width and height for the image in the PDF
            const maxImgWidth = 60;
            const maxImgHeight = 60;
            
            // Calculate the best fit for the image, preserving aspect ratio
            const ratio = Math.min(maxImgWidth / img.width, maxImgHeight / img.height);
            const imgWidth = img.width * ratio;
            const imgHeight = img.height * ratio;

            const xPosImg = (pdfWidth - imgWidth) / 2; // Center the image
            pdf.addImage(userData.photoURL, 'PNG', xPosImg, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 15;
        } catch (e) {
            console.error("Could not add image to PDF", e);
            toast({
              title: "PDF Generation Error",
              description: "The user photo could not be added to the PDF.",
              variant: "destructive"
            });
        }
    }
    
    // --- User Details ---
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(userData.name, pdfWidth / 2, yPos, { align: "center" });
    yPos += 15;

    pdf.setFontSize(12);
    const col1X = margin;
    const col2X = margin + 50;
    
    const details = [
        { label: "Age", value: userData.age.toString() },
        { label: "Phone Number", value: userData.phone },
        { label: "Mandalam", value: userData.mandalam },
        { label: "Mekhala", value: userData.mekhala },
        { label: "Unit", value: userData.unit },
    ];
    
    details.forEach(detail => {
        if (yPos > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            yPos = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.text(`${detail.label}:`, col1X, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(detail.value, col2X, yPos);
        yPos += 10;
    });

    // --- Save PDF ---
    pdf.save(`${userData.name.replace(/\s+/g, '_').toLowerCase()}_profile.pdf`);

    toast({
      title: "Download Started",
      description: "Your profile is being downloaded as a PDF file.",
    });
  };

  const handleShare = async () => {
    const { name, age, phone, mandalam, mekhala, unit } = userData;
    const text = `Collect User Profile:\n\nName: ${name}\nAge: ${age}\nPhone: ${phone}\nMandalam: ${mandalam}\nMekhala: ${mekhala}\nUnit: ${unit}`;
    
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
    <Card className="w-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">Member Slip</CardTitle>
      </CardHeader>
      <div className="p-6 pt-0">
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
