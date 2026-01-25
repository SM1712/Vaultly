import { useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { LayoutGrid, Wallet, TrendingUp, Target, MoreHorizontal, PiggyBank, Landmark, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const MobileWheelNav = () => {
    const { setIsMobileMenuOpen } = useTheme();

    // Config
    const RADIUS = 400; // Larger radius for flatter curve
    const ITEM_ANGLE = 18; // Degrees between items

    // State
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number, initialRotation: number } | null>(null);
    const wheelRef = useRef<HTMLDivElement>(null);

    // Items - using all main navigation items
    const items = [
        { id: 'dashboard', icon: LayoutGrid, to: '/', label: 'Inicio' },
        { id: 'expenses', icon: Wallet, to: '/expenses', label: 'Gastos' },
        { id: 'income', icon: TrendingUp, to: '/income', label: 'Ingresos' },
        { id: 'goals', icon: Target, to: '/goals', label: 'Metas' },
        { id: 'calendar', icon: Calendar, to: '/calendar', label: 'Calendario' },
        { id: 'funds', icon: PiggyBank, to: '/funds', label: 'Fondos' },
        { id: 'credits', icon: Landmark, to: '/credits', label: 'Créditos' },
        { id: 'menu', icon: MoreHorizontal, action: () => setIsMobileMenuOpen(true), label: 'Menú' }
    ];

    // Center the initial view?
    // Let's center on the first few items. 0 degrees = top center.
    // Items will be placed at angles: -X, 0, +X...
    // Let's modify the index logic.

    const handlePointerDown = (e: React.PointerEvent) => {
        // Prevent default browser actions (scrolling, zooming)
        e.preventDefault();
        e.stopPropagation();

        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, initialRotation: rotation };

        // Capture pointer to track movement outside the element
        try {
            if (wheelRef.current) {
                wheelRef.current.setPointerCapture(e.pointerId);
            }
        } catch (err) {
            console.error('Failed to capture pointer:', err);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !dragStartRef.current) return;

        e.preventDefault();
        e.stopPropagation();

        const deltaX = e.clientX - dragStartRef.current.x;
        const sensitivity = 0.5;
        let newRotation = dragStartRef.current.initialRotation + (deltaX * sensitivity);

        // Constraints
        const centerOffset = ((items.length - 1) * ITEM_ANGLE) / 2;
        // Clamp with small buffer for elastic feel
        const clampBuffer = 15;
        newRotation = Math.max(-centerOffset - clampBuffer, Math.min(centerOffset + clampBuffer, newRotation));

        setRotation(newRotation);
    };

    const handlePointerUp = (e?: React.PointerEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setIsDragging(false);
        dragStartRef.current = null;

        // Snap to nearest item
        const centerOffset = ((items.length - 1) * ITEM_ANGLE) / 2;

        // Calculate index based on rotation: rotation = centerOffset - (index * ITEM_ANGLE)
        const preciseIndex = (centerOffset - rotation) / ITEM_ANGLE;

        // Snap to nearest valid index
        const snappedIndex = Math.round(preciseIndex);
        const clampedIndex = Math.max(0, Math.min(items.length - 1, snappedIndex));

        const finalRotation = centerOffset - (clampedIndex * ITEM_ANGLE);
        setRotation(finalRotation);
    };

    return (
        <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe-area flex justify-center h-48 overflow-hidden pointer-events-none">
            {/* Interaction Zone - making it pointer-events-auto */}
            <div
                className="absolute left-1/2 -translate-x-1/2 bottom-[-280px] w-[600px] h-[600px] rounded-full bg-zinc-900/95 dark:bg-white/95 backdrop-blur-3xl shadow-[0_-10px_60px_-10px_rgba(0,0,0,0.4)] border-4 border-zinc-800/20 dark:border-zinc-200/20 pointer-events-auto touch-none cursor-grab active:cursor-grabbing"
                style={{
                    transform: `translateX(-50%) rotate(${rotation}deg)`,
                    transformOrigin: '50% 50%'
                }}
                ref={wheelRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                {/* Decoration: Inner Circle/Hub */}
                {/* <div className="absolute inset-40 rounded-full border border-white/5 dark:border-black/5" /> */}

                {items.map((item, index) => {
                    // Position items along the top arc. 
                    // 0 degrees is 3 o'clock in CSS rotation usually? No, depends on setup.
                    // We want items on the TOP edge.
                    // Angle calculation:
                    // spread items around -90deg (Top).
                    // Or, if we rotate the whole wheel, we place items at fixed angles relative to wheel.
                    // Item 0 at 0deg (Top Center relative to wheel).
                    // Item 1 at 25deg, Item -1 at -25deg...

                    // Let's center the group around 0.
                    // Total items width = (items.length - 1) * ITEM_ANGLE
                    // Start angle = -Total / 2

                    const centerOffset = ((items.length - 1) * ITEM_ANGLE) / 2;
                    const itemAngle = (index * ITEM_ANGLE) - centerOffset;

                    // CSS Rotate: Rotates the element around the center.
                    // We want to translate it OUT to the radius.
                    // transform: rotate(angle) translateY(-radius)
                    // This puts "Top" at -radius y.

                    return (
                        <div
                            key={item.id}
                            className="absolute top-1/2 left-1/2 w-16 h-16 -ml-8 -mt-8 flex items-center justify-center transition-transform"
                            style={{
                                transform: `rotate(${itemAngle}deg) translateY(-${RADIUS}px) rotate(${-itemAngle}deg)`
                                // Second rotate counter-rotates icon so it stays upright? 
                                // User said "acompañar curvatura" -> Icons should follow curve?
                                // If yes, remove second rotate, or adjust it.
                                // Usually upright is better for readability, but "align with curve" means rotated.
                                // Let's try ROTATED (remove 2nd rotate) first as requested "acompañar".
                                // Actually, readability is king. Let's keep upright first, or slightly rotated.
                                // Let's remove the second rotate to follow curvature perfectly.
                            }}
                        >
                            {item.to ? (
                                <NavLink
                                    to={item.to}
                                    draggable={false}
                                    className={({ isActive }) => clsx(
                                        "flex flex-col items-center justify-center w-full h-full rounded-2xl transition-all duration-300",
                                        isActive
                                            ? "bg-primary text-white scale-125 shadow-xl shadow-primary/40 ring-4 ring-zinc-900 dark:ring-white"
                                            : "text-zinc-500 dark:text-zinc-400 hover:text-white dark:hover:text-zinc-900 hover:scale-110"
                                    )}
                                >
                                    <item.icon size={24} strokeWidth={2.5} />
                                </NavLink>
                            ) : (
                                <button
                                    onClick={item.action}
                                    className="flex flex-col items-center justify-center w-full h-full rounded-2xl text-zinc-500 dark:text-zinc-400 hover:text-white dark:hover:text-zinc-900 transition-all hover:scale-110"
                                >
                                    <item.icon size={24} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Visual Indicator of "Active Zone" (Top Center) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1 h-3 bg-primary rounded-full opacity-50 pointer-events-none z-50" />
        </nav>
    );
};
