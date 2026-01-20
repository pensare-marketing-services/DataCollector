
"use client"

import { Download, Share2, Undo2 } from "lucide-react"
import jsPDF from "jspdf";
import type { UserData } from "./data-collection-form"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import placeholderImages from "@/app/lib/placeholder-images.json";

interface UserInfoDisplayProps {
  userData: UserData;
  onGoBack: () => void;
}

/**
 * Fetches an image from a given URL and returns it as a base64 data URL.
 * This is a reliable way to load images for client-side libraries like jsPDF.
 */
const getImageAsDataUrl = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error(`Could not load image from ${url}:`, error);
        return null;
    }
};


export function UserInfoDisplay({ userData, onGoBack }: UserInfoDisplayProps) {
  const { toast } = useToast();

  const generatePdfDocument = async (): Promise<jsPDF> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // --- 1. Header Image ---
    const headerImageSrc = new URL(placeholderImages.pdfHeader.src, window.location.origin).href;
    const headerImageDataUrl = await getImageAsDataUrl(headerImageSrc);
    if (headerImageDataUrl) {
      try {
        const imgProps = pdf.getImageProperties(headerImageDataUrl);
        const imageWidth = pdfWidth - (margin * 2);
        const imgHeight = (imgProps.height * imageWidth) / imgProps.width;
        const finalImageHeight = Math.min(imgHeight, pdfHeight * 0.2);
        
        const format = placeholderImages.pdfHeader.src.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
        pdf.addImage(headerImageDataUrl, format, margin, yPos, imageWidth, finalImageHeight);
        yPos += finalImageHeight;
      } catch (e) {
        console.error("An error occurred while adding the header image to the PDF.", e);
      }
    }
    
    yPos += 10;

    // --- 2. Member Info ---
    const topContentY = yPos;
    const submissionDate = new Date(userData.submissionDate).toLocaleDateString('en-GB');

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Member ID: ${userData.memberId}`, margin, topContentY + 5);
    pdf.text(`Date: ${submissionDate}`, margin, topContentY + 10);

    const topSectionHeight = 15;
    yPos = topContentY + topSectionHeight + 5;

    // --- 3. Separator Line ---
    pdf.setDrawColor(200);
    pdf.line(margin, yPos, pdfWidth - margin, yPos);
    yPos += 10;

    const detailsStartY = yPos;

    // --- 4. User Photo (on the right) ---
    let photoSectionHeight = 0;
    if (userData.photoURL) {
      try {
        const photoBoxWidth = 50;
        const photoBoxHeight = 50;
        const photoBoxX = pdfWidth - margin - photoBoxWidth;
        const photoBoxY = detailsStartY;

        const imgProps = pdf.getImageProperties(userData.photoURL);
        const imgRatio = imgProps.width / imgProps.height;
        const boxRatio = photoBoxWidth / photoBoxHeight;

        let finalWidth, finalHeight, finalX, finalY;

        if (imgRatio > boxRatio) { // Image is wider than the box, fit to box width
            finalWidth = photoBoxWidth;
            finalHeight = photoBoxWidth / imgRatio;
            finalX = photoBoxX;
            finalY = photoBoxY + (photoBoxHeight - finalHeight) / 2; // Center vertically
        } else { // Image is taller or same ratio, fit to box height
            finalHeight = photoBoxHeight;
            finalWidth = photoBoxHeight * imgRatio;
            finalY = photoBoxY;
            finalX = photoBoxX + (photoBoxWidth - finalWidth) / 2; // Center horizontally
        }

        const format = imgProps.fileType === 'PNG' ? 'PNG' : 'JPEG';
        pdf.addImage(userData.photoURL, format, finalX, finalY, finalWidth, finalHeight);
        photoSectionHeight = photoBoxHeight + 10; // Add some padding below the photo

      } catch (e) {
        console.error("Could not add user photo to PDF", e);
      }
    }

    // --- 5. User Details (on the left) ---
    pdf.setFontSize(12);
    const col1X = margin;
    const col2X = margin + 40; 
    let detailsY = detailsStartY;
    
    const details = [
        { label: "Name", value: userData.name || 'N/A' },
        { label: "Age", value: userData.age?.toString() || 'N/A' },
        { label: "Phone Number", value: userData.phone || 'N/A' },
        { label: "Mandalam", value: userData.mandalam || 'N/A' },
        { label: "Mekhala", value: userData.mekhala || 'N/A' },
        { label: "Unit", value: userData.unit || 'N/A' },
    ];
    
    details.forEach(detail => {
        if (detailsY > pdfHeight - margin) {
            pdf.addPage();
            detailsY = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.text(`${detail.label}:`, col1X, detailsY);
        pdf.setFont("helvetica", "normal");
        pdf.text(detail.value, col2X, detailsY);
        detailsY += 10;
    });

    const detailsHeight = detailsY - detailsStartY;
    yPos = detailsStartY + Math.max(detailsHeight, photoSectionHeight);


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
        
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
        } else {
            toast({
              title: "File sharing not supported",
              description: "Your browser doesn't support sharing files. The PDF will be downloaded instead.",
            });
            pdf.save(fileName);
        }

    } catch (error) {
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
