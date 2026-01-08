import { useData } from '../context/DataContext';
import type { Preset } from '../types';
import { toast } from 'sonner';

export const usePresets = () => {
    const { data, updateData } = useData();
    const presets = data.presets || [];

    const addPreset = (presetData: Omit<Preset, 'id'>) => {
        // Limit to 10 presets to keep it clean
        if (presets.length >= 10) {
            toast.error('Límite de 10 atajos alcanzado');
            return;
        }

        const newPreset: Preset = {
            id: crypto.randomUUID(),
            ...presetData
        };

        updateData({ presets: [...presets, newPreset] });
        toast.success('Atajo creado');
    };

    const deletePreset = (id: string) => {
        const newPresets = presets.filter(p => p.id !== id);
        updateData({ presets: newPresets });
    };

    return {
        presets,
        addPreset,
        deletePreset
    };
};
