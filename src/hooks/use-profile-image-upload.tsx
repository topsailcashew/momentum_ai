'use client';

import * as React from 'react';
import { useFirebase } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '@/firebase';

export function useProfileImageUpload() {
  const { storage } = useFirebase();
  const { user } = useUser();
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const uploadImage = async (file: File) => {
    if (!user || !storage) {
      setError(new Error('User or Firebase Storage not available.'));
      return null;
    }

    setIsUploading(true);
    setError(null);

    try {
      const storageRef = ref(storage, `profile-images/${user.uid}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setIsUploading(false);
      return downloadURL;
    } catch (e) {
      setError(e as Error);
      setIsUploading(false);
      return null;
    }
  };

  return { isUploading, error, uploadImage };
}
