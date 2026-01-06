import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useSettings } from '../../context/SettingsContext';

interface CategorySummaryProps {
    data: { name: string; value: number }[];
    total: number;
}

const CategorySummary = ({ data, total }: CategorySummaryProps) => {
    // Sort data by value descending
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const { currency } = useSettings();

    // Warm Palette
    const COLORS = [
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#10b981', // Emerald
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#f97316', // Orange
        '#06b6d4', // Cyan
    ];

    if (data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed p-8">
                <p className="text-zinc-500 font-medium">Sin datos para mostrar</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-zinc-800 dark:text-zinc-200 font-bold text-lg mb-6">Distribución por Categoría</h3>

            {/* Bar Chart */}
            <div className="h-48 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sortedData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fill: '#71717a', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{
                                backgroundColor: '#1c1917',
                                borderColor: '#292524',
                                color: '#fafaf9',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            formatter={(value: any) => [`${currency}${Number(value).toFixed(2)}`, 'Monto']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                            {sortedData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Detailed List */}
            <div className="space-y-3">
                {sortedData.map((item, index) => {
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                        <div key={item.name} className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-zinc-700 dark:text-zinc-300 font-medium text-sm">
                                    {item.name}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-zinc-900 dark:text-zinc-100 font-bold font-mono text-sm">
                                    {currency}{item.value.toFixed(2)}
                                </p>
                                <p className="text-zinc-500 text-xs">
                                    {percentage.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CategorySummary;
