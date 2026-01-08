import { useEffect, useRef } from 'react';
import { useFirestore } from './useFirestore';

interface CategoryDoc {
    id: string; // From Firestore
    name: string;
    type: 'income' | 'expense';
}

export const useCategories = (type: 'income' | 'expense') => {
    const { data: allCategories, add, remove, loading } = useFirestore<CategoryDoc>('categories');
    const migratedRef = useRef(false);

    // Filter by type and Deduplicate
    const categoriesRaw = allCategories
        .filter(c => c.type === type)
        .map(c => c.name);
    const categories = Array.from(new Set(categoriesRaw)).sort(); // Unique and Sorted

    const defaultCategories = type === 'income'
        ? ['Salario', 'Freelance', 'Inversiones', 'Regalos', 'Ventas', 'Otros']
        : ['Comida', 'Transporte', 'Entretenimiento', 'Servicios', 'Vivienda', 'Salud', 'Educación', 'Otros'];

    // Migration / Seeding Logic
    useEffect(() => {
        if (loading || migratedRef.current) return;

        // Check if we have any categories for this type in Firestore
        const hasCategories = allCategories.some(c => c.type === type);

        if (!hasCategories) {
            migratedRef.current = true; // Prevent double execution

            // If no data in Firestore, interpret as "New User" or "Empty Collection"
            // We use default categories.
            console.log(`Seeding default ${type} categories to Firestore...`);
            const categoriesToSeed = defaultCategories;

            categoriesToSeed.forEach(catName => {
                add({ name: catName, type });
            });
        }
    }, [loading, allCategories, type]); // Dependencies need to be stable

    const addCategory = (category: string) => {
        if (!categories.includes(category)) {
            add({ name: category, type });
        }
    };

    const removeCategory = (category: string) => {
        // Find ALL docs with this name and type to handle potential duplicates
        const docsToDelete = allCategories.filter(c => c.name === category && c.type === type);

        docsToDelete.forEach(doc => {
            if (doc.id) {
                remove(doc.id);
            }
        });
    };

    return {
        categories,
        addCategory,
        removeCategory
    };
};
