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

            // 1. Try to get from LocalStorage
            const localKey = `vault_categories_${type}`;
            const localItem = window.localStorage.getItem(localKey);

            let categoriesToSeed: string[] = [];

            if (localItem) {
                try {
                    const parsed = JSON.parse(localItem);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        categoriesToSeed = parsed;
                        console.log(`Migrating ${type} categories from LocalStorage to Firestore...`);
                    }
                } catch (e) {
                    console.error("Error parsing local categories", e);
                }
            }

            // 2. If no local data, use defaults
            if (categoriesToSeed.length === 0) {
                categoriesToSeed = defaultCategories;
                console.log(`Seeding default ${type} categories to Firestore...`);
            }

            // 3. Add valid categories to Firestore
            // We throttle or process this safely. Since it's < 20 items usually, basic loop is fine for now but Promise.all is better
            // However, 'add' from useFirestore might not return a promise we can await in parallel easily if it relies on state updates?
            // Checked useFirestore: 'add' is async and awaits addDoc. It is safe.

            // To avoid flooding, let's do it sequentially or parallel.
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
