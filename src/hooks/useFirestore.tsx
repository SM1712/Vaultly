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
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setData([]);
            setLoading(false);
            return;
        }

        const colRef = collection(db, 'users', user.uid, collectionName);
        const q = query(colRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: T[] = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as T);
            });
            setData(items);
            setLoading(false);
        }, (error) => {
            console.error(`Error fetching ${collectionName}:`, error);
            if (error.code === 'permission-denied') {
                toast.error(`Sin permisos para leer ${collectionName}`);
            } else {
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
            await addDoc(colRef, rest);
        } catch (error: any) {
            console.error(`Error adding to ${collectionName}:`, error);
            if (error.code === 'permission-denied') {
                toast.error('Error de permisos. No se pudo guardar.');
            } else {
                toast.error('Error al guardar datos.');
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

    return { data, add, remove, update, loading };
};
