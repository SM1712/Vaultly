import useLocalStorage from './useLocalStorage';

export const useCategories = (type: 'income' | 'expense') => {
    const defaultCategories = type === 'income'
        ? ['Salario', 'Freelance', 'Inversiones', 'Regalos', 'Ventas', 'Otros']
        : ['Comida', 'Transporte', 'Entretenimiento', 'Servicios', 'Vivienda', 'Salud', 'Educación', 'Otros'];

    const [categories, setCategories] = useLocalStorage<string[]>(`vault_categories_${type}`, defaultCategories);

    const addCategory = (category: string) => {
        if (!categories.includes(category)) {
            setCategories([...categories, category]);
        }
    };

    const removeCategory = (category: string) => {
        setCategories(categories.filter(c => c !== category));
    };

    return {
        categories,
        addCategory,
        removeCategory
    };
};
