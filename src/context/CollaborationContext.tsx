import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
    collection, doc, getDoc, setDoc, query, where, onSnapshot,
    runTransaction, getDocs, limit, updateDoc, arrayUnion
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import type { PublicProfile, ProjectInvitation, ProjectMember } from '../types';

// ... (Context definition)



interface CollaborationContextType {
    profile: PublicProfile | null;
    loadingProfile: boolean;
    profileSkipped: boolean;
    invitations: ProjectInvitation[];
    checkNicknameAvailability: (nickname: string) => Promise<boolean>;
    registerNickname: (nickname: string) => Promise<void>;
    skipProfileSetup: () => void;
    searchUserByNickname: (nickname: string) => Promise<PublicProfile | null>;
    sendProjectInvitation: (projectId: string, projectName: string, toNickname: string, toUid?: string) => Promise<void>;
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

    const [invitesByUid, setInvitesByUid] = useState<ProjectInvitation[]>([]);
    const [invitesByNick, setInvitesByNick] = useState<ProjectInvitation[]>([]);

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

    // 2. Fetch Invitations (UID)
    useEffect(() => {
        if (!user) {
            setInvitesByUid([]);
            return;
        }

        const q = query(
            collection(db, 'invitations'),
            where('toUid', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const invites: ProjectInvitation[] = [];
            snapshot.forEach(doc => {
                invites.push({ id: doc.id, ...doc.data() } as ProjectInvitation);
            });
            setInvitesByUid(invites);
        });

        return () => unsub();
    }, [user]);

    // 2b. Fetch Invitations (Nickname - Legacy/Fallback)
    useEffect(() => {
        if (!user || !profile?.nickname) {
            setInvitesByNick([]);
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
            setInvitesByNick(invites);
        });

        return () => unsub();
    }, [user, profile?.nickname]);

    // 2c. Merge Invitations
    useEffect(() => {
        const unique = new Map<string, ProjectInvitation>();
        invitesByUid.forEach(inv => unique.set(inv.id, inv));
        invitesByNick.forEach(inv => unique.set(inv.id, inv));
        setInvitations(Array.from(unique.values()));
    }, [invitesByUid, invitesByNick]);

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
            try {
                const userSnap = await getDoc(doc(db, 'users', uid));
                return userSnap.exists() ? userSnap.data() as PublicProfile : {
                    uid,
                    nickname: nickname.trim(), // Fallback to searched nickname
                    email: 'Protegido',
                    createdAt: new Date().toISOString()
                } as PublicProfile;
            } catch (error) {
                console.warn("Could not fetch full user profile (likely permissions), using fallback.", error);
                return {
                    uid,
                    nickname: nickname.trim(),
                    email: 'Protegido',
                    createdAt: new Date().toISOString()
                } as PublicProfile;
            }
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
                try {
                    const userSnap = await getDoc(doc(db, 'users', uid));
                    return userSnap.exists() ? userSnap.data() as PublicProfile : {
                        uid,
                        nickname: matchDoc.id, // Use normalized ID as best guess
                        email: 'Protegido',
                        createdAt: new Date().toISOString()
                    } as PublicProfile;
                } catch (error) {
                    return {
                        uid,
                        nickname: matchDoc.id,
                        email: 'Protegido',
                        createdAt: new Date().toISOString()
                    } as PublicProfile;
                }
            }
        } catch (e) {
            console.error("Prefix search failed", e);
        }

        return null;
    };

    const sendProjectInvitation = async (projectId: string, projectName: string, toNickname: string, toUid?: string) => {
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
                toUid: toUid || null,
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
        if (!user || !profile) return;
        try {
            const invRef = doc(db, 'invitations', invitationId);
            const invSnap = await getDoc(invRef);

            if (!invSnap.exists()) return;
            const invData = invSnap.data() as ProjectInvitation;

            if (accept) {
                // Add to project
                const projectRef = doc(db, 'projects', invData.projectId);

                // Construct new member object
                const newMember: ProjectMember = {
                    uid: user.uid,
                    nickname: profile.nickname,
                    role: 'editor', // Default role
                    joinedAt: new Date().toISOString()
                };

                // Atomically add to members array and membersIds helper
                await updateDoc(projectRef, {
                    members: arrayUnion(newMember),
                    membersIds: arrayUnion(user.uid)
                });
            }

            // Update invitation status
            await setDoc(invRef, { status: accept ? 'accepted' : 'rejected' }, { merge: true });

            toast.success(accept ? "¡Te has unido al proyecto!" : "Invitación rechazada");

        } catch (error) {
            console.error(error);
            toast.error("Error al responder invitación");
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
