import { useData } from '../context/DataContext';
import type { Preset } from '../types';
import { toast } from 'sonner';

export const usePresets = () => {
    const { data, updateData } = useData();
    const presets = data.presets || [];

    const addPreset = (presetData: Omit<Preset, 'id'>) => {
        // Limit to 10 presets to keep it clean
        if (presets.length >= 10) {
            toast.error("Límite de Atajos", {
                description: "Has alcanzado el límite de 10 atajos rápidos. Elimina uno para crear uno nuevo."
            });
            return;
        }

        const newPreset: Preset = {
            id: crypto.randomUUID(),
            ...presetData
        };

        updateData({ presets: [...presets, newPreset] });
        toast.success("Atajo Creado", {
            description: `El atajo "${newPreset.label}" se ha creado correctamente.`
        });
    };

    const deletePreset = (id: string) => {
        const presetToDelete = presets.find(p => p.id === id);
        const newPresets = presets.filter(p => p.id !== id);
        updateData({ presets: newPresets });
        toast.success("Atajo Eliminado", {
            description: presetToDelete ? `El atajo "${presetToDelete.label}" fue removido.` : "El atajo fue removido."
        });
    };

    return {
        presets,
        addPreset,
        deletePreset
    };
};
