import { useData } from '../context/DataContext';

export const useCategories = (type: 'income' | 'expense') => {
    const { data, updateData } = useData();

    // Ensure categories object exists (safety check)
    const allCategories = data.categories || { income: [], expense: [] };
    const categories = allCategories[type] || [];

    const addCategory = (category: string) => {
        if (!categories.includes(category)) {
            const newCategories = [...categories, category].sort();
            updateData({
                categories: {
                    ...allCategories,
                    [type]: newCategories
                }
            });
        }
    };

    const removeCategory = (category: string) => {
        const newCategories = categories.filter(c => c !== category);
        updateData({
            categories: {
                ...allCategories,
                [type]: newCategories
            }
        });
    };

    return {
        categories,
        addCategory,
        removeCategory
    };
};
