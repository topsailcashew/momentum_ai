
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithRedirect,
  User as FirebaseUser,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { createUserProfile } from '@/lib/data-firestore';

const formSchema = z
  .object({
    displayName: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Invalid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  });

  React.useEffect(() => {
    if (!userLoading && user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  
  const createSampleData = async (userId: string) => {
    if (!firestore) return;
  
    const batch = writeBatch(firestore);
  
    // Sample Projects
    const projects = [
      { id: 'q1-product-launch', name: 'Q1 Product Launch', priority: 'High', userId },
      { id: 'website-redesign', name: 'Website Redesign', priority: 'Medium', userId },
      { id: 'personal-fitness', name: 'Personal Fitness', priority: 'Low', userId },
    ];
  
    projects.forEach(project => {
      const projectRef = doc(firestore, `users/${userId}/projects`, project.id);
      batch.set(projectRef, { name: project.name, priority: project.priority, userId });
    });
  
    // Sample Tasks
    const tasks = [
      // Tasks for Q1 Product Launch
      { name: 'Finalize marketing brief', energyLevel: 'Medium', category: 'work', projectId: 'q1-product-launch', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), effort: 2, focusType: 'Analytical', priority: 'Urgent & Important', userId },
      { name: 'Design promotional graphics', energyLevel: 'High', category: 'work', projectId: 'q1-product-launch', deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), effort: 3, focusType: 'Creative', priority: 'Important & Not Urgent', userId },
      { name: 'Coordinate with PR agency', energyLevel: 'Low', category: 'work', projectId: 'q1-product-launch', effort: 1, focusType: 'Administrative', userId },
      // Tasks for Website Redesign
      { name: 'Gather user feedback on current site', energyLevel: 'Medium', category: 'work', projectId: 'website-redesign', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), effort: 2, focusType: 'Analytical', userId },
      { name: 'Create wireframes for new homepage', energyLevel: 'High', category: 'work', projectId: 'website-redesign', priority: 'Important & Not Urgent', userId },
      // Tasks for Personal Fitness
      { name: 'Go for a 30-minute run', energyLevel: 'High', category: 'health', projectId: 'personal-fitness', focusType: 'Physical', userId },
      { name: 'Meal prep for the week', energyLevel: 'Medium', category: 'health', projectId: 'personal-fitness', deadline: new Date().toISOString(), effort: 3, userId },
      // Uncategorized Tasks
      { name: 'Book dentist appointment', energyLevel: 'Low', category: 'personal', priority: 'Urgent & Not Important', userId },
      { name: 'Read a chapter of a book', energyLevel: 'Low', category: 'learning', userId },
      { name: 'Clean the kitchen', energyLevel: 'Medium', category: 'chore', effort: 2, userId },
    ];
  
    tasks.forEach(task => {
      const taskRef = doc(firestore, `users/${userId}/tasks`, Math.random().toString(36).substring(2));
      batch.set(taskRef, {
        ...task,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
      });
    });
  
    await batch.commit();
  };


  const handleUserCreation = async (user: FirebaseUser, displayName: string | null) => {
    if (firestore && user) {
        createUserProfile(firestore, user.uid, {
            email: user.email,
            displayName: displayName || user.displayName,
            photoURL: user.photoURL,
        });
        await createSampleData(user.uid);
    }
  };


  const onSubmit = (data: FormValues) => {
    if (!auth) return;
    startTransition(async () => {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );
        await updateProfile(userCredential.user, { displayName: data.displayName });
        await handleUserCreation(userCredential.user, data.displayName);
        
        toast({ title: 'Account created successfully!' });
        router.push('/');
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Sign up failed',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  };

  const handleGoogleSignIn = () => {
    if (!auth) return;
    startTransition(async () => {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
        // Note: This will redirect the user to Google. The redirect result
        // is handled in the root layout, where we'll also create sample data.
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Google Sign-Up failed',
          description: error.message || 'Could not sign up with Google. Please try again.',
        });
      }
    });
  };

  if (userLoading || !auth || !firestore) {
      return (
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <Skeleton className="mx-auto h-10 w-10 rounded-full" />
                    <Skeleton className="h-6 w-3/4 mx-auto mt-2" />
                    <Skeleton className="h-4 w-full mx-auto" />
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
                  <CardFooter className="justify-center">
                    <Skeleton className="h-4 w-1/2" />
                </CardFooter>
            </Card>
      );
  }

  return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Logo className="mx-auto h-10 w-10 text-primary lg:hidden" />
          <CardTitle className="mt-2">Create an Account</CardTitle>
          <CardDescription>Join Elvo to start aligning your energy with your tasks.</CardDescription>
        </CardHeader>
      <CardContent className="grid gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </Form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isPending}>
           {isPending ? 'Redirecting...' : 'Google'}
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
      </Card>
  );
}
