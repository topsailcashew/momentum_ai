import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { format, isSameDay, parseISO } from 'date-fns';

export function useMorningPlan() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [shouldShow, setShouldShow] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !firestore) {
            setLoading(false);
            return;
        }

        const checkMorningPlan = async () => {
            try {
                const today = format(new Date(), 'yyyy-MM-dd');
                const prefsRef = doc(firestore, `users/${user.uid}/preferences/settings`);
                const snapshot = await getDoc(prefsRef);

                let lastPlanDate: string | null = null;

                if (snapshot.exists()) {
                    const data = snapshot.data();
                    lastPlanDate = data.lastMorningPlanDate;
                }

                // If no record, or last plan was not today, show it
                if (!lastPlanDate || lastPlanDate !== today) {
                    setShouldShow(true);
                } else {
                    setShouldShow(false);
                }
            } catch (error) {
                console.error('Error checking morning plan status', error);
            } finally {
                setLoading(false);
            }
        };

        checkMorningPlan();
    }, [user, firestore]);

    return { shouldShow, loading, setShouldShow };
}
