'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Church, FolderKanban } from 'lucide-react';
import type { Ministry } from '@/lib/types';
import { collection, onSnapshot } from 'firebase/firestore';
import { MinistryDialog } from '@/components/ministries/ministry-dialog';
import { Badge } from '@/components/ui/badge';

export function MinistriesClientPage() {
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [ministries, setMinistries] = React.useState<Ministry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Real-time listener for ministries
  React.useEffect(() => {
    if (!user || !firestore) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const ministriesCol = collection(firestore, 'users', user.uid, 'ministries');

    const unsubscribe = onSnapshot(ministriesCol, (snapshot) => {
      const ministriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ministry));
      setMinistries(ministriesData);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to ministries:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore]);

  React.useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading || loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ministries</h1>
          <p className="text-muted-foreground mt-2">Manage your church ministries and their strategic plans</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Ministry
        </Button>
      </div>

      {ministries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Church className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No ministries yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Get started by creating your first ministry to organize your projects and tasks.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Ministry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry) => (
            <Card
              key={ministry.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/ministries/${ministry.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Church className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{ministry.name}</CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ministry.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {ministry.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FolderKanban className="h-4 w-4" />
                  <span>View Projects & Strategic Plan</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MinistryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
