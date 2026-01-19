
"use client"

import { Download, Share2, Undo2 } from "lucide-react"
import jsPDF from "jspdf";
import type { UserData } from "./data-collection-form"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface UserInfoDisplayProps {
  userData: UserData;
  onGoBack: () => void;
}

export function UserInfoDisplay({ userData, onGoBack }: UserInfoDisplayProps) {
  const { toast } = useToast();

  const handleDownload = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin; // Start with top margin

    // --- 1. Header Image ---
    try {
        const headerImg = new Image();
        headerImg.src = '/header.jpg'; // Assumes header.jpg is in the public folder
        await new Promise((resolve, reject) => {
            headerImg.onload = resolve;
            headerImg.onerror = (err) => {
                console.error("PDF Header Image Error: Could not load /header.jpg.", err);
                // Resolve to continue without the image, preventing PDF generation from failing
                resolve(null); 
            };
        });

        if (headerImg.width > 0) {
            const imgProps = pdf.getImageProperties(headerImg);
            // Calculate width and height with padding
            const imageWidth = pdfWidth - (margin * 2);
            const imgHeight = (imgProps.height * imageWidth) / imgProps.width;
            // Limit header to a max of 20% of the page height
            const finalImageHeight = Math.min(imgHeight, pdfHeight * 0.2); 
            
            pdf.addImage(headerImg, 'PNG', margin, yPos, imageWidth, finalImageHeight);
            yPos += finalImageHeight; // Set current Y position to the bottom of the header
        }
    } catch (e) {
        console.error("An error occurred while adding the header image to the PDF.", e);
        toast({
            variant: "destructive",
            title: "PDF Error",
            description: "Could not add header image to the PDF.",
        });
    }
    
    // Add some space after the header
    yPos += 10;

    // --- 2. Member Info & User Photo ---
    const topContentY = yPos;
    const submissionDate = new Date(userData.submissionDate).toLocaleDateString('en-GB');

    // Add Member Details
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Member ID: ${userData.memberId}`, margin, topContentY + 5);
    pdf.text(`Date: ${submissionDate}`, margin, topContentY + 10);

    let topSectionHeight = 15; // Minimum height for the text block

    // Add User Photo
    if (userData.photoURL) {
        try {
            const userImg = new Image();
            userImg.src = userData.photoURL;
            await new Promise((resolve, reject) => {
                userImg.onload = resolve;
                userImg.onerror = reject;
            });
            
            const imgSize = 30; // 30mm x 30mm square
            const xPosImg = pdfWidth - margin - imgSize;
            pdf.addImage(userImg, 'PNG', xPosImg, topContentY, imgSize, imgSize);
            // The section's total height is the larger of the text block or the user photo
            topSectionHeight = Math.max(topSectionHeight, imgSize); 
        } catch (e) {
            console.error("Could not add user photo to PDF", e);
        }
    }

    yPos = topContentY + topSectionHeight + 5; // Add space below this section

    // --- 3. Separator Line ---
    pdf.setDrawColor(200); // light grey
    pdf.line(margin, yPos, pdfWidth - margin, yPos);
    yPos += 10;

    // --- 4. User Details ---
    pdf.setFontSize(12);
    const col1X = margin;
    const col2X = margin + 50; 
    
    const details = [
        { label: "Name", value: userData.name },
        { label: "Age", value: userData.age.toString() },
        { label: "Phone Number", value: userData.phone },
        { label: "Mandalam", value: userData.mandalam },
        { label: "Mekhala", value: userData.mekhala },
        { label: "Unit", value: userData.unit },
    ];
    
    details.forEach(detail => {
        if (yPos > pdfHeight - margin) { // Check for page break
            pdf.addPage();
            yPos = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.text(`${detail.label}:`, col1X, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(detail.value, col2X, yPos);
        yPos += 10;
    });

    // --- 5. Save PDF ---
    pdf.save(`${userData.name.replace(/\s+/g, '_').toLowerCase()}_aiyf_profile.pdf`);

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

  return (
    <>
      <Card className="w-full bg-transparent border-0 shadow-none">
        <CardHeader>
          <CardTitle className="font-malayalam text-center text-xs ">
            <p>പ്രിയ സുഹൃത്തേ,</p>
            <p className="pt-4">അഖിലേന്ത്യാ യൂത്ത് ഫെഡറേഷൻ (AIYF) അംഗത്വ ക്യാമ്പയിന്റെ ഭാഗമായതിന് നന്ദി. ജനാധിപത്യത്തിൻ്റെയും മതേതരത്വത്തിൻ്റെയും കാവലാളാകാനുള്ള താങ്കളുടെ ഈ തീരുമാനം അഭിനന്ദനാർഹമാണ്. താങ്കളുടെ അംഗത്വ അപേക്ഷ വിജയകരമായി പൂർത്തിയായിരിക്കുന്നു.</p>
          </CardTitle>
        </CardHeader>
        
        <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <Button variant="outline" onClick={onGoBack}><Undo2 className="mr-2 h-4 w-4"/>New Entry</Button>
          <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDownload}><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
              <Button onClick={handleShare} className="bg-accent text-accent-foreground hover:bg-accent/90"><Share2 className="mr-2 h-4 w-4"/>Share</Button>
          </div>
        </CardFooter>
      </Card>
    </>
  )
}
