import React from 'react';

interface ArtNumberProps {
    value: number;
    symbol?: string;
    showSymbol?: boolean;
    className?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
}

export const ArtNumber: React.FC<ArtNumberProps> = ({
    value,
    symbol = '$',
    showSymbol = true,
    className = '',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
}) => {
    const isNegative = value < 0;
    
    // Defensive adjustment to prevent RangeError where min > max
    const adjustedMin = Math.min(minimumFractionDigits, maximumFractionDigits);

    // Format the absolute value first
    const formatted = Math.abs(value).toLocaleString(undefined, {
        minimumFractionDigits: adjustedMin,
        maximumFractionDigits: maximumFractionDigits
    });

    // Convert string into characters to style commas and dots individually
    const chars = formatted.split('');

    return (
        <span className={`inline-flex items-baseline ${className}`}>
            {isNegative && <span className="font-bold mr-0.5">-</span>}
            {showSymbol && <span className="opacity-70 mr-0.5">{symbol}</span>}
            {chars.map((char, index) => {
                if (char === ',') {
                    return (
                        <span key={index} className="art-comma">
                            ,
                        </span>
                    );
                }
                if (char === '.') {
                    return (
                        <span key={index} className="art-dot">
                            .
                        </span>
                    );
                }
                return <span key={index}>{char}</span>;
            })}
        </span>
    );
};
