import React from 'react';
import { LayoutDashboard, Target, CreditCard, Trophy } from 'lucide-react';

export type DocBlock =
    | { type: 'text'; content: string }
    | { type: 'heading'; content: string }
    | { type: 'list'; items: string[] }
    | { type: 'alert'; variant: 'info' | 'warning' | 'tip'; content: string }
    | { type: 'code'; content: string; language?: string }
    | { type: 'example'; title: string; content: React.ReactNode };

export interface Article {
    id: string;
    title: string;
    description: string;
    blocks: DocBlock[];
}

export interface Section {
    id: string;
    title: string;
    icon: any;
    articles: Article[];
}

export const encyclopediaData: Section[] = [
    {
        id: 'basics',
        title: 'Conceptos Básicos',
        icon: LayoutDashboard,
        articles: [
            {
                id: 'philosophy',
                title: 'Filosofía Vault',
                description: 'Entiende cómo Vault organiza tu vida financiera.',
                blocks: [
                    { type: 'text', content: 'Vault no es solo una hoja de cálculo bonita. Es un sistema diseñado para darte "Consciencia Financiera". A diferencia de otras apps que solo registran gastos, Vault se enfoca en el "Net Worth" (Patrimonio Neto) y el "Cash Flow" (Flujo de Caja).' },
                    { type: 'heading', content: 'La Ecuación Maestra' },
                    { type: 'alert', variant: 'info', content: 'Saldo Disponible = (Ingresos - Gastos) - (Ahorros Bloqueados + Fondos Ayni)' },
                    { type: 'text', content: 'Esta fórmula es vital. Significa que el dinero que ves en "Saldo Disponible" es realmente tuyo para gastar. Si tienes 1000 en el banco pero 800 son para un viaje (Meta), Vault te dirá que solo tienes 200 disponibles. Esto evita que te gastes el dinero de tus sueños en café.' }
                ]
            },
            {
                id: 'dashboard',
                title: 'Navegando el Dashboard',
                description: 'Tu centro de comando explicado.',
                blocks: [
                    { type: 'heading', content: 'Bento Grid' },
                    { type: 'text', content: 'El diseño modular (Bento) te permite ver el estado de salud de tus finanzas de un vistazo.' },
                    {
                        type: 'list', items: [
                            'Tarjeta de Balance: Tu liquidez inmediata.',
                            'Tarjeta de Ahorro: Cuánto has acumulado en Metas.',
                            'Tarjeta de Deuda: Tu carga financiera actual.'
                        ]
                    },
                    { type: 'heading', content: 'Timeline (Línea de Tiempo)' },
                    { type: 'text', content: 'Una lista cronológica unificada que combina:' },
                    {
                        type: 'list', items: [
                            'Vencimientos de Metas de Ahorro.',
                            'Fechas de pago de Créditos.',
                            'Transacciones programadas (Suscripciones, Alquiler).'
                        ]
                    },
                    { type: 'alert', variant: 'tip', content: 'Revisa tu Timeline cada lunes para planificar tu semana y evitar sorpresas.' }
                ]
            }
        ]
    },
    {
        id: 'goals',
        title: 'Metas de Ahorro',
        icon: Target,
        articles: [
            {
                id: 'dynamic-math',
                title: 'Matemática Dinámica',
                description: 'Cómo funciona el algoritmo de cuotas variables.',
                blocks: [
                    { type: 'text', content: 'Vault usa un modelo dinámico para calcular cuánto debes ahorrar cada mes. A diferencia de dividir el monto total entre los meses (estático), Vault recalcula tu cuota cada vez que abres la app.' },
                    { type: 'code', content: 'Cuota = (Meta - Ahorrado) / Meses_Restantes', language: 'math' },
                    { type: 'heading', content: 'Ejemplo Práctico' },
                    { type: 'text', content: 'Imagina una meta de 1200 a 12 meses.' },
                    {
                        type: 'list', items: [
                            'Mes 1: (1200 - 0) / 12 = 100/mes.',
                            'Mes 1 (Realidad): Tienes un ingreso extra y metes 500 de golpe.',
                            'Mes 2 (Recálculo): (1200 - 500) / 11 = 63.6/mes.'
                        ]
                    },
                    { type: 'alert', variant: 'tip', content: 'Al aportar más, tus cuotas futuras bajan automáticamente, dándote alivio financiero.' }
                ]
            },
            {
                id: 'strategies',
                title: 'Estrategias de Retiro',
                description: 'Qué pasa cuando sacas dinero de una meta.',
                blocks: [
                    { type: 'text', content: 'A veces surge una emergencia y debes tocar tus ahorros. Vault te permite hacerlo sin romper la lógica matemática, ofreciéndote dos caminos:' },
                    { type: 'heading', content: '1. Spread (Redistribuir)' },
                    { type: 'text', content: 'El dinero que sacaste se divide entre todos los meses que faltan. Tu cuota mensual subirá un poco permanentemente.' },
                    { type: 'heading', content: '2. Catch Up (Ponerse al día)' },
                    { type: 'text', content: 'El sistema asume que repondrás TODO lo retirado el próximo mes. Tu próxima cuota será gigante, pero luego volverá a la normalidad.' },
                    { type: 'alert', variant: 'warning', content: 'Usa "Catch Up" solo si sabes que recibirás dinero pronto para tapar el hueco.' }
                ]
            }
        ]
    },
    {
        id: 'credits',
        title: 'Créditos y Deudas',
        icon: CreditCard,
        articles: [
            {
                id: 'interest-types',
                title: 'Interés Simple vs Compuesto',
                description: 'Entendiendo cómo te cobran los bancos.',
                blocks: [
                    { type: 'text', content: 'Vault puede manejar préstamos informales (sin interés) y bancarios (amortización francesa).' },
                    { type: 'heading', content: '¿Qué es la Tasa Efectiva Anual (TEA)?' },
                    { type: 'text', content: 'Es el costo real del dinero. Muchos bancos te dicen "1% mensual", pero matemáticamente (1.01)^12 es más que 12% anual debido al interés compuesto.' },
                    {
                        type: 'example', title: 'Simulador de Costo', content: (
                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold">Préstamo: $1000</span>
                                    <span className="text-sm font-bold text-rose-500">Tasa: 50%</span>
                                </div>
                                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-emerald-500 w-2/3" title="Capital"></div>
                                    <div className="h-full bg-rose-500 w-1/3" title="Interés"></div>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">En tasas altas, una gran parte de tu cuota es puro interés.</p>
                            </div>
                        )
                    }
                ]
            }
        ]
    },
    {
        id: 'gamification',
        title: 'Sistema de Niveles',
        icon: Trophy,
        articles: [
            {
                id: 'xp-table',
                title: 'Tabla de Experiencia',
                description: 'Cómo subir de nivel y desbloquear rangos.',
                blocks: [
                    { type: 'text', content: 'Cada acción en Vault te da XP. No es solo un juego, es un mecanismo para reforzar hábitos positivos.' },
                    { type: 'heading', content: 'Acciones Básicas' },
                    {
                        type: 'list', items: [
                            'Registrar Transacción: +10 XP',
                            'Crear Meta: +50 XP',
                            'Completar Meta: +500 XP'
                        ]
                    },
                    { type: 'alert', variant: 'info', content: 'Mantener una racha (Streak) diaria multiplica tus puntos x1.5.' }
                ]
            },
            {
                id: 'secrets',
                title: 'Logros Secretos',
                description: 'Pistas para los cazadores de logros.',
                blocks: [
                    { type: 'text', content: 'Hay logros que no aparecen en la lista hasta que los desbloqueas.' },
                    {
                        type: 'list', items: [
                            '🕵️ ???: Intenta ahorrar exactamente el 50% de tus ingresos un mes.',
                            '🦉 Búho Nocturno: Registra gastos a las 3:00 AM.',
                            '💎 Manos de Diamante: No retires nada de tus metas por 6 meses.'
                        ]
                    }
                ]
            }
        ]
    }
];
