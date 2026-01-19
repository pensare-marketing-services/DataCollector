
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AuthContext';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Share2, LogOut, Loader2, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import placeholderImages from '@/app/lib/placeholder-images.json';

// Define the shape of a user document
interface UserDoc {
    id: string;
    name: string;
    phone: string;
    age: number;
    mandalam: string;
    mekhala: string;
    unit: string;
    submissionDate: string;
}

export default function AdminDashboard() {
  const { isAuthenticated, logout } = useAdminAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { toast } = useToast();

  // Filters state
  const [nameFilter, setNameFilter] = useState('');
  const [mandalamFilter, setMandalamFilter] = useState('');
  const [mekhalaFilter, setMekhalaFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [minAgeFilter, setMinAgeFilter] = useState('');
  const [maxAgeFilter, setMaxAgeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Memoize the query to prevent re-renders, and wait for auth to be ready.
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || isAuthLoading || !user) return null;
    return query(collection(firestore, 'users'), orderBy('submissionDate', 'desc'));
  }, [firestore, isAuthLoading, user]);

  const { data: users, isLoading: isDataLoading } = useCollection<UserDoc>(usersQuery);

  const isLoading = isAuthLoading || isDataLoading;

  useEffect(() => {
    // Once auth state is resolved, if user is not authenticated via our custom logic, redirect.
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    const minAge = minAgeFilter ? parseInt(minAgeFilter, 10) : 0;
    const maxAge = maxAgeFilter ? parseInt(maxAgeFilter, 10) : Infinity;

    return users.filter(user => {
      return (
        user.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
        user.mandalam.toLowerCase().includes(mandalamFilter.toLowerCase()) &&
        user.mekhala.toLowerCase().includes(mekhalaFilter.toLowerCase()) &&
        user.unit.toLowerCase().includes(unitFilter.toLowerCase()) &&
        (user.age >= minAge && user.age <= maxAge)
      );
    });
  }, [users, nameFilter, mandalamFilter, mekhalaFilter, unitFilter, minAgeFilter, maxAgeFilter]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.text('User Data', 14, 16);
    
    (doc as any).autoTable({
      head: [['Name', 'Phone', 'Age', 'Mandalam', 'Mekhala', 'Unit']],
      body: filteredUsers.map(u => [u.name, u.phone, u.age, u.mandalam, u.mekhala, u.unit]),
      startY: 20,
    });

    doc.save('filtered_users.pdf');
  };
  
  const handleShareForm = async () => {
    const shareUrl = `https://${window.location.hostname}/form`;
    const shareData = {
        title: 'Data Form',
        text: 'Please fill out the data collection form.',
        url: shareUrl,
    };
    
    try {
        // First, copy the link to the clipboard unconditionally.
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link copied to clipboard!' });
        
        // Then, if the share API is available, use it.
        if (navigator.share) {
            await navigator.share(shareData);
        }
    } catch (error) {
        // The user closing the share dialog is not an error, so we ignore it.
        if ((error as Error).name !== 'AbortError') {
            toast({
                variant: 'destructive',
                title: 'Could not share link',
                description: 'The link was copied, but sharing failed. You can paste it manually.'
            });
        }
    }
  };

  // Show a loading spinner until auth is resolved and we've confirmed the user is authenticated with our custom logic
  if (isAuthLoading || !isAuthenticated) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
                <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </Button>
                <Button onClick={handleShareForm} variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Form
                </Button>
                <Button onClick={logout} variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </header>

        {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6 p-4 border rounded-lg bg-card animate-in fade-in-0 duration-300">
                <Input placeholder="Filter by name..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} />
                <Input placeholder="Mandalam..." value={mandalamFilter} onChange={e => setMandalamFilter(e.target.value)} />
                <Input placeholder="Mekhala..." value={mekhalaFilter} onChange={e => setMekhalaFilter(e.target.value)} />
                <Input placeholder="Unit..." value={unitFilter} onChange={e => setUnitFilter(e.target.value)} />
                <div className="flex items-center gap-2 lg:col-span-2">
                    <Input type="number" placeholder="Min Age" value={minAgeFilter} onChange={e => setMinAgeFilter(e.target.value)} />
                    <span className="text-muted-foreground">-</span>
                    <Input type="number" placeholder="Max Age" value={maxAgeFilter} onChange={e => setMaxAgeFilter(e.target.value)} />
                </div>
            </div>
        )}
        
        <div className="border rounded-lg overflow-hidden relative">
            <div
                className="absolute inset-0 bg-contain bg-no-repeat bg-center opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `url(${placeholderImages.logo.src})`,
                }}
            />
            <div className="relative overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Mandalam</TableHead>
                            <TableHead>Mekhala</TableHead>
                            <TableHead>Unit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    <div className="flex justify-center items-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium capitalize">{user.name}</TableCell>
                                    <TableCell>{user.phone}</TableCell>
                                    <TableCell>{user.age}</TableCell>
                                    <TableCell className="capitalize">{user.mandalam}</TableCell>
                                    <TableCell className="capitalize">{user.mekhala}</TableCell>
                                    <TableCell className="capitalize">{user.unit}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    No users found matching your filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>

        <Button
            onClick={handleDownloadPdf}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
            size="icon"
        >
            <Download className="h-6 w-6" />
            <span className="sr-only">Download PDF</span>
        </Button>
    </div>
  );
}
