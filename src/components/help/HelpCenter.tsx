import { useState } from 'react';
import {
    BookOpen, Search, ChevronDown, ChevronRight,
    LayoutDashboard, Wallet, Target, CreditCard,
    Trophy, Sparkles, Users
} from 'lucide-react';

type HelpSection = {
    id: string;
    title: string;
    icon: any;
    articles: {
        title: string;
        content: React.ReactNode;
    }[];
};

export const HelpCenter = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSection, setExpandedSection] = useState<string | null>('basics');

    const sections: HelpSection[] = [
        {
            id: 'basics',
            title: 'Conceptos Básicos',
            icon: LayoutDashboard,
            articles: [
                {
                    title: 'Entendiendo el Dashboard',
                    content: (
                        <div className="space-y-2">
                            <p>El <strong>Panel Principal</strong> es tu centro de comando. Aquí verás:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600 dark:text-zinc-400 ml-2">
                                <li><strong>Saldo Disponible:</strong> Dinero real que puedes gastar hoy. No incluye ahorros bloqueados en metas.</li>
                                <li><strong>Bento Grid:</strong> Tarjetas modulares que resumen tus ingresos, gastos y ahorros del mes actual.</li>
                                <li><strong>Línea de Tiempo:</strong> Una lista unificada de tus próximos compromisos financieros (pagos de créditos, cuotas de ahorro y facturas recurrentes).</li>
                            </ul>
                        </div>
                    )
                },
                {
                    title: 'Libro Contable (Ledger)',
                    content: (
                        <p>El libro contable es el registro histórico de absolutamente todos tus movimientos. Puedes filtrar por fecha, tipo, categoría o cuenta. Es la fuente de la verdad para cualquier auditoría personal.</p>
                    )
                }
            ]
        },
        {
            id: 'finance',
            title: 'Gestión Financiera',
            icon: Wallet,
            articles: [
                {
                    title: 'Transacciones y Categorías',
                    content: (
                        <div className="space-y-2">
                            <p>Registra gastos e ingresos con categorías personalizables. El sistema aprende de tus hábitos.</p>
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30 text-xs text-amber-800 dark:text-amber-400">
                                <strong>Tip Pro:</strong> Usa los "Atajos" en configuración para crear botones rápidos para gastos frecuentes como "Café" o "Transporte".
                            </div>
                        </div>
                    )
                },
                {
                    title: 'Reglas Recurrentes',
                    content: (
                        <p>Configura pagos automáticos (suscripciones, alquiler) en la pestaña <strong>Programados</strong>. El sistema generará la transacción automáticamente el día que elijas, evitando que olvides registrarla.</p>
                    )
                }
            ]
        },
        {
            id: 'goals',
            title: 'Metas de Ahorro',
            icon: Target,
            articles: [
                {
                    title: 'Cálculo Dinámico vs Estático',
                    content: (
                        <div className="space-y-3">
                            <p>En <strong>Preferencias</strong> puedes elegir cómo se calculan tus cuotas:</p>
                            <ul className="space-y-2">
                                <li className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                                    <span className="font-bold block text-indigo-600 dark:text-indigo-400">Dinámico (Recomendado)</span>
                                    La cuota se recalcula cada mes. Si adelantas dinero, tus cuotas futuras bajan. Si te atrasas, suben suavemente para que llegues a la meta a tiempo.
                                </li>
                                <li className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                                    <span className="font-bold block text-zinc-600 dark:text-zinc-400">Estático</span>
                                    Cuota fija inamovible (Total / Meses). Ideal si prefieres previsibilidad absoluta.
                                </li>
                            </ul>
                        </div>
                    )
                },
                {
                    title: 'Estrategias de Recuperación',
                    content: (
                        <p>Si necesitas retirar dinero de una meta por emergencia, el sistema te preguntará cómo quieres reponerlo: redistribuyendo el faltante en los meses restantes (Spread) o pagándolo todo el mes siguiente (Catch Up).</p>
                    )
                }
            ]
        },
        {
            id: 'ayni',
            title: 'Sistema Ayni (Proyectos)',
            icon: Target,
            articles: [
                {
                    title: 'Filosofía Ayni',
                    content: (
                        <p>Inspirado en el concepto de reciprocidad andina, el <strong>Sistema Ayni</strong> gestiona la distribución de recursos en proyectos. Permite "sembrar" capital en diferentes partidas presupuestarias y cosechar resultados mediante hitos temporales.</p>
                    )
                },
                {
                    title: 'Partidas y Fuentes',
                    content: (
                        <div className="space-y-2">
                            <p>Cada proyecto tiene su propia "micro-economía":</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                                <li><strong>Partidas (Buckets):</strong> Son los sobres virtuales donde asignas dinero para propósitos específicos (ej. "Marketing", "Desarrollo", "Legal").</li>
                                <li><strong>Fuentes de Fondeo:</strong> Indica de dónde sale el dinero real (ej. "Ahorros Personales", "Inversionista Ángel"). El sistema cruza cada gasto contra una partida y una fuente.</li>
                            </ul>
                        </div>
                    )
                },
                {
                    title: 'Gestión Temporal (Timeline)',
                    content: (
                        <p>La pestaña <strong>Hitos</strong> permite visualizar el proyecto en el tiempo. Puedes marcar fechas clave (lanzamientos, entregas) y ver cómo el presupuesto se consume a medida que te acercas a esos eventos.</p>
                    )
                }
            ]
        },
        {
            id: 'axon',
            title: 'Sistema Axon (Colaboración)',
            icon: Users,
            articles: [
                {
                    title: 'Identidad Digital',
                    content: (
                        <p>Axon te asigna una identidad única (Nickname) dentro del ecosistema Vault. Esta identidad es universal y te permite ser reconocido por otros usuarios sin exponer tu email o datos sensibles.</p>
                    )
                },
                {
                    title: 'Invitaciones y Permisos',
                    content: (
                        <div className="space-y-2">
                            <p>Ahora puedes invitar colaboradores a tus proyectos:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                                <li>Envía invitaciones usando el nickname exacto o aproximado del usuario.</li>
                                <li>El receptor verá la invitación en su Dashboard principal.</li>
                                <li>Al aceptar, obtendrá acceso de lectura/escritura (según el rol) al proyecto compartido.</li>
                            </ul>
                        </div>
                    )
                }
            ]
        },
        {
            id: 'credits',
            title: 'Créditos y Deudas',
            icon: CreditCard,
            articles: [
                {
                    title: 'Modo Simple y Avanzado',
                    content: (
                        <p>Al crear una deuda, usa el <strong>Modo Simple</strong> para préstamos informales (solo monto y cuota) o el <strong>Modo Avanzado</strong> para préstamos bancarios con tasa de interés y amortización francesa.</p>
                    )
                },
                {
                    title: 'Ingeniería Inversa de Tasas',
                    content: (
                        <p>¿No sabes la tasa de interés? Si ingresas el monto del préstamo, el plazo y la cuota que pagas, el sistema calculará exactamente qué tasa te están cobrando.</p>
                    )
                }
            ]
        },
        {
            id: 'system',
            title: 'Gamificación y Sistema',
            icon: Trophy,
            articles: [
                {
                    title: 'Niveles y Rangos',
                    content: (
                        <p>Ganas experiencia (XP) registrando operaciones, completando metas y manteniendo rachas (streaks) de uso. Subir de nivel desbloquea nuevos títulos y personalizaciones de avatar.</p>
                    )
                },
                {
                    title: 'Zona Nuclear',
                    content: (
                        <p>En la pestaña <strong>Datos</strong>, puedes exportar toda tu información a un archivo JSON de respaldo. La "Zona Nuclear" permite borrar todo y empezar de cero (requiere código de seguridad).</p>
                    )
                },
                {
                    title: 'Guía de Logros (Insignias)',
                    content: (
                        <div className="space-y-4">
                            <p>Desbloquea insignias realizando acciones clave. Cada una otorga XP para subir de nivel.</p>

                            <div className="space-y-3">
                                <div>
                                    <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Comunes (50 XP)</h5>
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        <li><strong>Primeros Pasos:</strong> Registra tu primera transacción.</li>
                                        <li><strong>Semilla:</strong> Crea tu primera meta de ahorro.</li>
                                        <li><strong>Feedback:</strong> Importa una copia de seguridad (30 XP).</li>
                                    </ul>
                                </div>

                                <div>
                                    <h5 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Poco Comunes (100-150 XP)</h5>
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        <li><strong>Constancia:</strong> Registra movimientos 3 días seguidos.</li>
                                        <li><strong>Consciente:</strong> Revisa tus proyecciones 5 veces en total.</li>
                                        <li><strong>Pagador:</strong> Registra tu primer abono a una deuda.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h5 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Raras (300-500 XP)</h5>
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        <li><strong>Guerrero del Ahorro:</strong> Completa una meta de ahorro al 100%.</li>
                                        <li><strong>Historiador:</strong> Alcanza 100 transacciones registradas.</li>
                                        <li><strong>Ahorrador Inteligente:</strong> Ahorra al menos el 20% de tus ingresos en un mes.</li>
                                        <li><strong>Búho Nocturno (Secreto):</strong> ??? (Pista: Registra algo muy tarde).</li>
                                    </ul>
                                </div>

                                <div>
                                    <h5 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">Épicas (800-1200 XP)</h5>
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        <li><strong>Francotirador:</strong> Termina el mes con desviación menor al 2% (Ingresos vs Gastos).</li>
                                        <li><strong>Centurión:</strong> Alcanza el nivel 25.</li>
                                        <li><strong>Constructor de Riqueza:</strong> Ingresa &gt;5000 y ahorra el 70%.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h5 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Legendarias (5000 XP)</h5>
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        <li><strong>Libertad Financiera (Secreto):</strong> ??? (Pista: Ingresos pasivos simulados superan gastos).</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        }
    ];

    const filteredSections = sections.map(section => ({
        ...section,
        articles: section.articles.filter(article =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (typeof article.content === 'string' && article.content.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    })).filter(section => section.articles.length > 0);

    return (
        <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950/50">
            {/* Header / Search */}
            <div className="p-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Enciclopedia Vault</h2>
                        <p className="text-sm text-zinc-500">Toda la documentación técnica y funcional en un solo lugar.</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar en la ayuda (ej. 'Metas', 'Interés', 'Backup')..."
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {filteredSections.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                        <Sparkles className="mx-auto mb-2 opacity-50" size={32} />
                        <p>No encontramos resultados para "{searchTerm}"</p>
                    </div>
                ) : (
                    filteredSections.map(section => (
                        <div key={section.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                            <button
                                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <section.icon size={20} className="text-zinc-400" />
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{section.title}</span>
                                </div>
                                {expandedSection === section.id ? <ChevronDown size={18} className="text-zinc-400" /> : <ChevronRight size={18} className="text-zinc-400" />}
                            </button>

                            {expandedSection === section.id && (
                                <div className="border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/30">
                                    {section.articles.map((article, idx) => (
                                        <div key={idx} className="p-4 md:p-6 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                                            <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                {article.title}
                                            </h4>
                                            <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-3.5 border-l-2 border-indigo-100 dark:border-indigo-900/30">
                                                {article.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 text-center text-xs text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
                <p>Vault Ledger v1.5 • Documentación Actualizada</p>
            </div>
        </div>
    );
};
