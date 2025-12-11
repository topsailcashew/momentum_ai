import { useCallback, useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface AudioMap {
    timerStart: string;
    timerEnd: string;
    taskComplete: string;
    notification: string;
}

const DEFAULT_SOUNDS: AudioMap = {
    timerStart: '/sounds/timer-start.mp3',
    timerEnd: '/sounds/timer-end.mp3',
    taskComplete: '/sounds/task-complete.mp3',
    notification: '/sounds/notification.mp3',
};

export function useAudio() {
    const { user } = useUser();
    const firestore = useFirestore();
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
    const enabledRef = useRef(true);

    // Load user preferences
    useEffect(() => {
        if (!user || !firestore) return;

        const loadPrefs = async () => {
            try {
                const prefsRef = doc(firestore, `users/${user.uid}/preferences/settings`);
                const snapshot = await getDoc(prefsRef);
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    if (typeof data.timerChimesEnabled === 'boolean') {
                        enabledRef.current = data.timerChimesEnabled;
                    }
                }
            } catch (error) {
                console.error('Failed to load audio prefs', error);
            }
        };

        loadPrefs();
    }, [user, firestore]);

    const play = useCallback((soundKey: keyof AudioMap) => {
        if (!enabledRef.current) return;

        const path = DEFAULT_SOUNDS[soundKey];
        if (!audioRefs.current[soundKey]) {
            audioRefs.current[soundKey] = new Audio(path);
        }

        const audio = audioRefs.current[soundKey];
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Audio playback failed', e));
    }, []);

    return { play };
}
