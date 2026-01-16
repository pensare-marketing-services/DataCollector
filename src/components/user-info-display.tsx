"use client"

import { Download, Share2, Undo2 } from "lucide-react"
import type { UserData } from "./data-collection-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "./ui/separator"

interface UserInfoDisplayProps {
  userData: UserData;
  onAccept: () => void;
}

const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between py-2">
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground">{value}</span>
  </div>
);

export function UserInfoDisplay({ userData, onAccept }: UserInfoDisplayProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { photo, photoURL, ...dataToDownload } = userData;
    const headers = Object.keys(dataToDownload).join(',');
    const values = Object.values(dataToDownload).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + values;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${userData.name.replace(/\s+/g, '_').toLowerCase()}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: "Your data is being downloaded as a CSV file.",
    });
  };

  const handleShare = async () => {
    const { name, age, phone, mandalam, mekhala, unit } = userData;
    const text = `GatherWise User Profile:\n\nName: ${name}\nAge: ${age}\nPhone: ${phone}\nMandalam: ${mandalam}\nMekhala: ${mekhala}\nUnit: ${unit}`;
    
    if (navigator.share) {
        try {
            await navigator.share({ title: 'User Profile', text });
            toast({ title: "Shared Successfully" });
        } catch (error) {
            // We ignore AbortError which is triggered when the user cancels the share dialog.
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
           <Avatar className="h-28 w-28 border-4 border-secondary">
            <AvatarImage src={userData.photoURL} alt={userData.name} />
            <AvatarFallback className="text-4xl">{userData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-3xl font-headline">{userData.name}</CardTitle>
            <CardDescription>Review your details below.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 space-y-2">
            <InfoRow label="Age" value={userData.age} />
            <Separator />
            <InfoRow label="Phone Number" value={userData.phone} />
            <Separator />
            <InfoRow label="Mandalam" value={userData.mandalam} />
            <Separator />
            <InfoRow label="Mekhala" value={userData.mekhala} />
            <Separator />
            <InfoRow label="Unit" value={userData.unit} />
        </div>
        <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Declaration</h3>
            <div className="p-4 bg-secondary/50 rounded-md border">
                <p className="text-sm text-secondary-foreground text-center">
                I hereby declare that the information provided is true and correct to the best of my knowledge and belief.
                </p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        <Button variant="outline" onClick={onAccept}><Undo2 className="mr-2 h-4 w-4"/>Go Back</Button>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownload}><Download className="mr-2 h-4 w-4"/>Download CSV</Button>
            <Button onClick={handleShare} className="bg-accent text-accent-foreground hover:bg-accent/90"><Share2 className="mr-2 h-4 w-4"/>Share</Button>
        </div>
      </CardFooter>
    </Card>
  )
}
