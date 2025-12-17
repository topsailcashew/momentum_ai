import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { EnergyLevel, DailyReport } from '@/lib/types';
import { format } from 'date-fns';

const ENERGY_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes (will trigger 2 times per hour)
const MIN_TIME_BETWEEN_CHECKS = 10 * 60 * 1000; // Minimum 10 minutes between checks

export function useEnergyTracker() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [currentEnergy, setCurrentEnergy] = useState<EnergyLevel | null>(null);
    const [shouldShowEnergyCheck, setShouldShowEnergyCheck] = useState(false);
    const lastCheckTimeRef = useRef<number>(Date.now());
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

    const today = format(new Date(), 'yyyy-MM-dd');

    // Load current energy level from Firestore
    useEffect(() => {
        if (!user || !firestore) return;

        const loadCurrentEnergy = async () => {
            try {
                const reportRef = doc(firestore, `users/${user.uid}/reports/${today}`);
                const snapshot = await getDoc(reportRef);

                if (snapshot.exists()) {
                    const data = snapshot.data() as DailyReport;
                    if (data.currentEnergyLevel) {
                        setCurrentEnergy(data.currentEnergyLevel);
                    }
                    if (data.lastEnergyCheck) {
                        lastCheckTimeRef.current = new Date(data.lastEnergyCheck).getTime();
                    }
                }
            } catch (error) {
                console.error('Failed to load current energy:', error);
            }
        };

        loadCurrentEnergy();
    }, [user, firestore, today]);

    // Set up periodic energy checks (2 times per hour = every 30 minutes)
    useEffect(() => {
        if (!user || !firestore) return;

        const scheduleNextCheck = () => {
            // Clear existing interval
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }

            // Schedule check at random time within the next 30 minutes
            const randomDelay = Math.random() * ENERGY_CHECK_INTERVAL;

            intervalIdRef.current = setTimeout(() => {
                const timeSinceLastCheck = Date.now() - lastCheckTimeRef.current;

                // Only show if enough time has passed
                if (timeSinceLastCheck >= MIN_TIME_BETWEEN_CHECKS) {
                    setShouldShowEnergyCheck(true);
                }

                // Schedule the next check
                scheduleNextCheck();
            }, randomDelay);
        };

        scheduleNextCheck();

        return () => {
            if (intervalIdRef.current) {
                clearTimeout(intervalIdRef.current);
            }
        };
    }, [user, firestore]);

    const updateEnergy = useCallback(async (newEnergy: EnergyLevel) => {
        if (!user || !firestore) return;

        try {
            const reportRef = doc(firestore, `users/${user.uid}/reports/${today}`);
            const snapshot = await getDoc(reportRef);

            const timestamp = new Date().toISOString();
            const energyEntry = { level: newEnergy, timestamp };

            if (snapshot.exists()) {
                const data = snapshot.data() as DailyReport;
                const existingHistory = data.energyHistory || [];

                await updateDoc(reportRef, {
                    currentEnergyLevel: newEnergy,
                    energyHistory: [...existingHistory, energyEntry],
                    lastEnergyCheck: timestamp,
                });
            } else {
                // Create new report if it doesn't exist
                await updateDoc(reportRef, {
                    date: today,
                    userId: user.uid,
                    currentEnergyLevel: newEnergy,
                    energyHistory: [energyEntry],
                    lastEnergyCheck: timestamp,
                    goals: 0,
                    completed: 0,
                    startTime: null,
                    endTime: null,
                    generatedReport: null,
                });
            }

            setCurrentEnergy(newEnergy);
            lastCheckTimeRef.current = Date.now();
        } catch (error) {
            console.error('Failed to update energy level:', error);
        }
    }, [user, firestore, today]);

    const requestEnergyCheck = useCallback(() => {
        const timeSinceLastCheck = Date.now() - lastCheckTimeRef.current;

        // Only show if enough time has passed since last check
        if (timeSinceLastCheck >= MIN_TIME_BETWEEN_CHECKS) {
            setShouldShowEnergyCheck(true);
        }
    }, []);

    const dismissEnergyCheck = useCallback(() => {
        setShouldShowEnergyCheck(false);
    }, []);

    return {
        currentEnergy,
        updateEnergy,
        shouldShowEnergyCheck,
        requestEnergyCheck,
        dismissEnergyCheck,
    };
}
