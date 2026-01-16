"use client"

import { useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { User } from "lucide-react"

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  photo: z
    .custom<FileList>()
    .refine((files) => files && files.length === 1, "Photo is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: "Please enter a valid phone number." }),
  age: z.coerce.number().int().min(1, "Age must be a positive number.").max(120, "Please enter a valid age."),
  mandalam: z.string().min(1, { message: "Mandalam is required." }),
  mekhala: z.string().min(1, { message: "Mekhala is required." }),
  unit: z.string().min(1, { message: "Unit is required." }),
});

export type FormValues = z.infer<typeof formSchema>;
export type UserData = FormValues & { photoURL: string };

interface DataCollectionFormProps {
  onSubmit: (data: UserData) => void;
}

export function DataCollectionForm({ onSubmit }: DataCollectionFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      age: undefined,
      mandalam: "",
      mekhala: "",
      unit: "",
    },
  });
  
  function handleFormSubmit(values: FormValues) {
    if (values.photo && values.photo.length > 0) {
      const photoURL = URL.createObjectURL(values.photo[0]);
      onSubmit({ ...values, photoURL });
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Collection Form</CardTitle>
        <CardDescription>Enter your details accurately.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
                  <div className="flex items-center gap-4">
                    <FormControl>
                      <>
                        <Input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={(e) => {
                             field.onChange(e.target.files);
                             if (e.target.files && e.target.files[0]) {
                              setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                             } else {
                              setPhotoPreview(null);
                             }
                          }}
                        />
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={photoPreview ?? undefined} alt="Photo preview" />
                            <AvatarFallback>
                              <User className="h-10 w-10 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">Click to upload photo</span>
                        </div>
                      </>
                    </FormControl>
                  </div>
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
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Submit</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
