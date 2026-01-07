import { useFirestore } from './useFirestore';
import type { TransactionPreset } from '../types';
import { toast } from 'sonner';

export const usePresets = () => {
    const { data: presets, add, remove } = useFirestore<TransactionPreset>('transaction_presets');

    const addPreset = (data: Omit<TransactionPreset, 'id'>) => {
        // Limit to 10 presets to keep it clean
        if (presets.length >= 10) {
            toast.error('Límite de 10 atajos alcanzado');
            return;
        }
        add(data);
        toast.success('Atajo creado');
    };

    return {
        presets,
        addPreset,
        deletePreset: remove
    };
};
