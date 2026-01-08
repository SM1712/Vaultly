import { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const useFirestore = <T extends { id?: string }>(collectionName: string) => {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const colRef = collection(db, 'users', user.uid, collectionName);
        const q = query(colRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: T[] = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as T);
            });
            setData(items);
            setLoading(false);
            setError(null);

            const source = snapshot.metadata.fromCache ? "local cache" : "server";
            // console.log(`Data for ${collectionName} came from ${source}`); // Optional debug
        }, (err) => {
            console.error(`Error fetching ${collectionName}:`, err);
            setError(err);

            // Don't toast for offline errors as they are expected behavior in some cases
            // But 'permission-denied' IS actionable.
            if (err.code === 'permission-denied') {
                toast.error(`Sin permisos para leer ${collectionName}`);
            } else if (err.code !== 'unavailable') {
                // 'unavailable' often happens when offline, which is fine.
                toast.error(`Error de sincronización (${collectionName})`);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, collectionName]);

    const add = async (item: any) => {
        if (!user) return;
        try {
            const colRef = collection(db, 'users', user.uid, collectionName);
            const { id, ...rest } = item;
            // addDoc works offline! It updates cache immediately and promises resolve when server ack (if awaited)
            // If we don't await responsibly or if we want "optimistic" feel, just await it.
            // Firestore SDK handles the retries.
            await addDoc(colRef, rest);
        } catch (error: any) {
            console.error(`Error adding to ${collectionName}:`, error);
            if (error.code === 'permission-denied') {
                toast.error('Error de permisos. No se pudo guardar.');
            } else {
                toast.error('Error al guardar datos. (Se reintentará cuando haya conexión)');
            }
            throw error;
        }
    };

    const remove = async (id: string) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'users', user.uid, collectionName, id);
            await deleteDoc(docRef);
        } catch (error: any) {
            console.error(`Error removing from ${collectionName}:`, error);
            if (error.code === 'permission-denied') {
                toast.error('Error de permisos. No se pudo eliminar.');
            } else {
                toast.error('Error al eliminar datos.');
            }
            throw error;
        }
    };

    const update = async (id: string, updates: Partial<T>) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'users', user.uid, collectionName, id);
            await updateDoc(docRef, updates as DocumentData);
        } catch (error: any) {
            console.error(`Error updating ${collectionName}:`, error);
            if (error.code === 'permission-denied') {
                toast.error('Error de permisos. No se pudo actualizar.');
            } else {
                toast.error('Error al actualizar datos.');
            }
            throw error;
        }
    };

    return { data, add, remove, update, loading, error };
};
