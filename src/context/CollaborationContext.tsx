import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
    collection, doc, getDoc, setDoc, query, where, onSnapshot,
    runTransaction, getDocs, limit
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import type { PublicProfile, ProjectInvitation } from '../types';

interface CollaborationContextType {
    profile: PublicProfile | null;
    loadingProfile: boolean;
    profileSkipped: boolean;
    invitations: ProjectInvitation[];
    checkNicknameAvailability: (nickname: string) => Promise<boolean>;
    registerNickname: (nickname: string) => Promise<void>;
    skipProfileSetup: () => void;
    searchUserByNickname: (nickname: string) => Promise<PublicProfile | null>;
    sendProjectInvitation: (projectId: string, projectName: string, toNickname: string) => Promise<void>;
    respondToInvitation: (invitationId: string, accept: boolean) => Promise<void>;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const useCollaboration = () => {
    const context = useContext(CollaborationContext);
    if (!context) throw new Error('useCollaboration must be used within a CollaborationProvider');
    return context;
};

export const CollaborationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileSkipped, setProfileSkipped] = useState(false);
    const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);

    const skipProfileSetup = () => {
        setProfileSkipped(true);
    };

    // 1. Fetch Public Profile
    useEffect(() => {
        if (!user) {
            setProfile(null);
            setLoadingProfile(false);
            return;
        }

        const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data() as PublicProfile);
            } else {
                setProfile(null);
            }
            setLoadingProfile(false);
        });

        return () => unsub();
    }, [user]);

    // 2. Fetch Invitations (Listen) - Only if we have a nickname
    useEffect(() => {
        if (!user || !profile?.nickname) {
            setInvitations([]);
            return;
        }

        const q = query(
            collection(db, 'invitations'),
            where('toNickname', '==', profile.nickname),
            where('status', '==', 'pending')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const invites: ProjectInvitation[] = [];
            snapshot.forEach(doc => {
                invites.push({ id: doc.id, ...doc.data() } as ProjectInvitation);
            });
            setInvitations(invites);
        });

        return () => unsub();
    }, [user, profile?.nickname]);

    const normalizeId = (text: string) => {
        return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_') // Spaces to underscores
            .replace(/[^a-z0-9_.-]/g, ''); // Remove any other weird chars
    };

    const checkNicknameAvailability = async (nickname: string): Promise<boolean> => {
        const cleanId = normalizeId(nickname);
        if (cleanId.length < 3) return false;

        const docRef = doc(db, 'nicknames', cleanId);
        const snapshot = await getDoc(docRef);
        return !snapshot.exists();
    };

    const registerNickname = async (nickname: string) => {
        if (!user) throw new Error("Usuario no autenticado");
        const cleanId = normalizeId(nickname);

        try {
            await runTransaction(db, async (transaction) => {
                const nickRef = doc(db, 'nicknames', cleanId);
                const nickDoc = await transaction.get(nickRef);

                if (nickDoc.exists()) {
                    throw new Error("El nickname ya está en uso.");
                }

                // Create nickname reservation
                transaction.set(nickRef, { uid: user.uid });

                // Create/Update public profile
                const extraData: PublicProfile = {
                    uid: user.uid,
                    nickname: nickname.trim(), // Store original casing/accents for display
                    email: user.email || '',
                    createdAt: new Date().toISOString()
                };
                transaction.set(doc(db, 'users', user.uid), extraData, { merge: true });
            });
            toast.success("¡Identidad creada con éxito!");
        } catch (error: any) {
            console.error("Register Nickname Error:", error);
            throw error;
        }
    };

    const searchUserByNickname = async (nickname: string) => {
        const cleanId = normalizeId(nickname);
        if (cleanId.length < 3) return null; // Too short for valid search

        const nicknamesRef = collection(db, 'nicknames');

        // 1. Try Exact Match
        const exactSnap = await getDoc(doc(db, 'nicknames', cleanId));
        if (exactSnap.exists()) {
            const uid = exactSnap.data().uid;
            const userSnap = await getDoc(doc(db, 'users', uid));
            return userSnap.exists() ? userSnap.data() as PublicProfile : null;
        }

        // 2. Try Prefix Match (Fuzzy-ish)
        // Note: This relies on document IDs being the normalized nicknames
        try {
            const q = query(
                nicknamesRef,
                where('__name__', '>=', cleanId),
                where('__name__', '<=', cleanId + '\uf8ff'),
                limit(1)
            );

            const querySnap = await getDocs(q); // Need import getDocs
            if (!querySnap.empty) {
                const matchDoc = querySnap.docs[0];
                const uid = matchDoc.data().uid;
                const userSnap = await getDoc(doc(db, 'users', uid));
                return userSnap.exists() ? userSnap.data() as PublicProfile : null;
            }
        } catch (e) {
            console.error("Prefix search failed", e);
        }

        return null;
    };

    const sendProjectInvitation = async (projectId: string, projectName: string, toNickname: string) => {
        if (!user || !profile) return;

        // Validation logic
        if (toNickname === profile.nickname) {
            toast.error("No puedes invitarte a ti mismo.");
            return;
        }

        try {
            await setDoc(doc(collection(db, 'invitations')), {
                projectId,
                projectName,
                fromUid: user.uid,
                fromNickname: profile.nickname,
                toNickname: toNickname.trim(),
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            toast.success(`Invitación enviada a ${toNickname}`);
        } catch (error) {
            console.error(error);
            toast.error("Error enviando invitación");
        }
    };

    const respondToInvitation = async (invitationId: string, accept: boolean) => {
        if (!user) return;
        try {
            const invRef = doc(db, 'invitations', invitationId);
            const invSnap = await getDoc(invRef);

            if (!invSnap.exists()) return;
            // logic to add to project comes later (needs shared project structure)
            // for now just update status

            await setDoc(invRef, { status: accept ? 'accepted' : 'rejected' }, { merge: true });
            toast.success(accept ? "Invitación aceptada" : "Invitación rechazada");

            // TODO: Step 2 triggers here -> Add user to project 'members' array in Firestore
        } catch (error) {
            console.error(error);
            toast.error("Error al responder");
        }
    };

    return (
        <CollaborationContext.Provider value={{
            profile, loadingProfile, profileSkipped, invitations,
            checkNicknameAvailability, registerNickname, skipProfileSetup,
            searchUserByNickname, sendProjectInvitation, respondToInvitation
        }}>
            {children}
        </CollaborationContext.Provider>
    );
};
