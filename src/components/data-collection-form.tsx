"use client"

import { useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  photo: z.string().optional(), // Will store the base64 data URL
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: "Please enter a valid phone number." }),
  age: z.coerce.number().int().min(1, "Age must be a positive number.").max(120, "Please enter a valid age."),
  mandalam: z.string().min(1, { message: "Mandalam is required." }),
  mekhala: z.string().min(1, { message: "Mekhala is required." }),
  unit: z.string().min(1, { message: "Unit is required." }),
});

export type FormValues = z.infer<typeof formSchema>;
export type UserData = Omit<FormValues, 'photo'> & { photoURL: string; id?: string };

interface DataCollectionFormProps {
  onSubmit: (data: FormValues) => void;
  isSubmitting: boolean;
}

export function DataCollectionForm({ onSubmit, isSubmitting }: DataCollectionFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      age: undefined,
      mandalam: "",
      mekhala: "",
      unit: "",
      photo: undefined,
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Collection Form</CardTitle>
        <CardDescription>Enter your details accurately.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={photoPreview ?? undefined} alt="Photo preview" />
                            <AvatarFallback>
                              <User className="h-10 w-10 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">Click to upload photo (Optional)</span>
                        </div>
                    </div>
                    <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          ref={(e) => {
                            // field.ref(e) // RHF's ref
                            if(e) fileInputRef.current = e;
                          }}
                          onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (!file) {
                               field.onChange(undefined);
                               setPhotoPreview(null);
                               return;
                             }

                             const reader = new FileReader();
                             reader.onload = (event) => {
                               const img = new Image();
                               img.onload = () => {
                                 const canvas = document.createElement('canvas');
                                 const MAX_WIDTH = 400;
                                 const scaleSize = MAX_WIDTH / img.width;
                                 canvas.width = MAX_WIDTH;
                                 canvas.height = img.height * scaleSize;

                                 const ctx = canvas.getContext('2d');
                                 ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

                                 const dataUrl = canvas.toDataURL(file.type, 0.7); // 0.7 quality
                                 
                                 field.onChange(dataUrl);
                                 setPhotoPreview(dataUrl);
                               };
                               img.src = event.target?.result as string;
                             };
                             reader.readAsDataURL(file);
                          }}
                        />
                    </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="e.g., 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 25" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                control={form.control}
                name="mandalam"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Mandalam</FormLabel>
                    <FormControl>
                        <Input placeholder="Mandalam" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="mekhala"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Mekhala</FormLabel>
                    <FormControl>
                        <Input placeholder="Mekhala" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                        <Input placeholder="Unit" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
