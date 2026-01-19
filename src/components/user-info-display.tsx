
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

  const generatePdfDocument = async (): Promise<jsPDF> => {
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
        // This error is handled gracefully, so we let the PDF generation continue.
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

    return pdf;
  };

  const handleDownload = async () => {
    try {
      const pdf = await generatePdfDocument();
      pdf.save(`${userData.name.replace(/\s+/g, '_').toLowerCase()}_aiyf_profile.pdf`);

      toast({
        title: "Download Started",
        description: "Your profile is being downloaded as a PDF file.",
      });
    } catch (e) {
        console.error("PDF Download Error:", e);
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: "Could not generate the PDF for download.",
        });
    }
  };

  const handleShare = async () => {
    try {
        const pdf = await generatePdfDocument();
        const pdfBlob = pdf.output('blob');
        const fileName = `${userData.name.replace(/\s+/g, '_').toLowerCase()}_aiyf_profile.pdf`;
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

        const shareData = {
            files: [pdfFile],
            title: `${userData.name}'s AIYF Profile`,
            text: `AIYF Profile for ${userData.name}`,
        };
        
        // Check if sharing is supported and if the file can be shared
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            // No toast on success, as the share sheet provides its own feedback.
        } else {
            // If sharing files is not supported, fallback to downloading the PDF.
            toast({
              title: "File sharing not supported",
              description: "Your browser doesn't support sharing files. The PDF will be downloaded instead.",
            });
            pdf.save(fileName);
        }

    } catch (error) {
        // Ignore AbortError which happens when the user closes the share dialog
        if ((error as Error).name !== 'AbortError') {
          console.error("PDF Share Error:", error);
          toast({
            variant: "destructive",
            title: "Share Failed",
            description: "An error occurred while trying to share the PDF.",
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
