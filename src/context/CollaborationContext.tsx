import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
    collection, doc, getDoc, setDoc, query, where, onSnapshot,
    runTransaction, getDocs, limit, updateDoc, arrayUnion
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { EmailService } from '../services/EmailService';
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
    searchUsersByNickname: (nickname: string) => Promise<PublicProfile[]>;
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

    // Helper for normalizing IDs
    const normalizeId = (text: string) => {
        return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_') // Spaces to underscores
            .replace(/[^a-z0-9_.-]/g, ''); // Remove any other weird chars
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
        }, (error) => {
            console.error("Error fetching public profile:", error);
            setProfile(null);
            setLoadingProfile(false);
            toast.error("Error al cargar perfil de colaboración");
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
        }, (error) => {
            console.error("Error fetching invites by UID:", error);
            setInvitesByUid([]);
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
            where('toNicknameNormalized', '==', normalizeId(profile.nickname)),
            where('status', '==', 'pending')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const invites: ProjectInvitation[] = [];
            snapshot.forEach(doc => {
                invites.push({ id: doc.id, ...doc.data() } as ProjectInvitation);
            });
            setInvitesByNick(invites);
        }, (error) => {
            console.error("Error fetching invites by nickname:", error);
            setInvitesByNick([]);
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
            toast.success("Identidad Creada", {
                description: "¡Tu nickname colaborativo se ha registrado con éxito!"
            });
        } catch (error: any) {
            console.error("Register Nickname Error:", error);
            throw error;
        }
    };

    const fetchUserProfileFallback = async (uid: string, fallbackNickname: string): Promise<PublicProfile> => {
        try {
            const userSnap = await getDoc(doc(db, 'users', uid));
            if (userSnap.exists()) {
                const data = userSnap.data();
                return {
                    uid,
                    nickname: data.nickname || fallbackNickname,
                    displayName: data.displayName || data.nickname || fallbackNickname,
                    email: data.email || 'Protegido',
                    photoURL: data.photoURL || undefined,
                    createdAt: data.createdAt || new Date().toISOString()
                };
            }
        } catch (error) {
            console.warn("Could not fetch full user profile (likely permissions), using fallback.", error);
        }
        return {
            uid,
            nickname: fallbackNickname,
            displayName: fallbackNickname,
            email: 'Protegido',
            createdAt: new Date().toISOString()
        };
    };

    const searchUserByNickname = async (nickname: string): Promise<PublicProfile | null> => {
        const cleanId = normalizeId(nickname);
        if (cleanId.length < 3) return null;

        const exactSnap = await getDoc(doc(db, 'nicknames', cleanId));
        if (exactSnap.exists()) {
            const uid = exactSnap.data().uid;
            return await fetchUserProfileFallback(uid, nickname.trim());
        }
        return null;
    };

    const searchUsersByNickname = async (nickname: string): Promise<PublicProfile[]> => {
        const cleanId = normalizeId(nickname);
        if (cleanId.length < 2) return [];

        const nicknamesRef = collection(db, 'nicknames');
        const resultsMap = new Map<string, PublicProfile>();

        // 1. Try Exact Match
        const exactSnap = await getDoc(doc(db, 'nicknames', cleanId));
        if (exactSnap.exists()) {
            const uid = exactSnap.data().uid;
            const uProfile = await fetchUserProfileFallback(uid, nickname.trim());
            resultsMap.set(uid, uProfile);
        }

        // 2. Try Prefix Match
        try {
            const q = query(
                nicknamesRef,
                where('__name__', '>=', cleanId),
                where('__name__', '<=', cleanId + '\uf8ff'),
                limit(5)
            );

            const querySnap = await getDocs(q);
            for (const matchDoc of querySnap.docs) {
                const uid = matchDoc.data().uid;
                if (!resultsMap.has(uid)) {
                    const uProfile = await fetchUserProfileFallback(uid, matchDoc.id);
                    resultsMap.set(uid, uProfile);
                }
            }
        } catch (e) {
            console.error("Prefix search failed", e);
        }

        return Array.from(resultsMap.values());
    };

    const sendProjectInvitation = async (projectId: string, projectName: string, toNickname: string, toUid?: string) => {
        if (!user || !profile) return;

        // Validation logic
        if (normalizeId(toNickname) === normalizeId(profile.nickname)) {
            toast.error("Invitación Inválida", {
                description: "No puedes enviar una invitación de colaboración a ti mismo."
            });
            return;
        }

        try {
            const cleanToNickname = toNickname.trim();
            const normalizedToNickname = normalizeId(cleanToNickname);
            const invitationId = `${projectId}_${toUid || normalizedToNickname}`;

            await setDoc(doc(db, 'invitations', invitationId), {
                projectId,
                projectName,
                fromUid: user.uid,
                fromNickname: profile.nickname,
                toNickname: cleanToNickname,
                toNicknameNormalized: normalizedToNickname,
                toUid: toUid || null,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            toast.success("Invitación Enviada", {
                description: `Se envió la invitación de colaboración a "${cleanToNickname}".`
            });
            
            // Send email notification
            EmailService.sendProjectInvitationEmail(
                cleanToNickname,
                toUid,
                projectName,
                profile.nickname,
                undefined // We don't know the recipient email client-side, it's queue-resolved
            ).catch(err => console.error("Error sending project invitation email", err));
        } catch (error) {
            console.error(error);
            toast.error("Envío Fallido", {
                description: "Hubo un problema al intentar enviar la invitación de colaboración."
            });
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

            toast.success(accept ? "Proyecto Aceptado" : "Invitación Rechazada", {
                description: accept 
                    ? `Te has unido exitosamente al proyecto "${invData.projectName}".`
                    : `Has rechazado la invitación para el proyecto "${invData.projectName}".`
            });

        } catch (error) {
            console.error(error);
            toast.error("Error de Respuesta", {
                description: "No se pudo procesar tu respuesta a la invitación de colaboración."
            });
        }
    };

    return (
        <CollaborationContext.Provider value={{
            profile, loadingProfile, profileSkipped, invitations,
            checkNicknameAvailability, registerNickname, skipProfileSetup,
            searchUserByNickname, searchUsersByNickname, sendProjectInvitation, respondToInvitation
        }}>
            {children}
        </CollaborationContext.Provider>
    );
};
