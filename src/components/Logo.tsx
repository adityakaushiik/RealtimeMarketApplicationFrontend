
import React from 'react';

/**
 * A highly polished, animated logo for DGEX.
 * 
 * Design Philosophy:
 * 1. Simplicity: Uses pure typography (Standard Sans-Serif) for immediate legibility.
 * 2. Premium Feel: Uses a "Liquid Metal" gradient effect that breathes life into the text.
 * 3. Dynamism: A secondary "Light Sweep" animation runs periodically to catch the eye.
 * 4. Theme Aware: Uses `currentColor` as the base, so it naturally fits Light/Dark modes.
 */
export function Logo({ className }: { className?: string }) {
    const idSuffix = React.useId ? React.useId().replace(/:/g, "") : "dgex";
    const baseGradientId = `dgex-liquid-${idSuffix}`;
    const shineGradientId = `dgex-shine-${idSuffix}`;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 120 32"
            className={className}
            aria-label="DGEX Logo"
            // Ensure the svg takes up space but text is centered
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                {/* 
                   1. Liquid Metal Gradient (Base Fill)
                   Creates a subtle shimmering effect using opacity variations of the current text color.
                   This makes the text look like polished metal rather than flat ink.
                */}
                <linearGradient id={baseGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
                    <stop offset="50%" stopColor="currentColor" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
                    <animate
                        attributeName="x1"
                        values="0%; 100%; 0%"
                        dur="8s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="x2"
                        values="100%; 200%; 100%"
                        dur="8s"
                        repeatCount="indefinite"
                    />
                </linearGradient>

                {/* 
                   2. Shine Sweep Gradient (Overlay)
                   A sharp beam of light that wipes across the text.
                */}
                <linearGradient id={shineGradientId} x1="-100%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0" />
                    <stop offset="50%" stopColor="white" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                    <animate
                        attributeName="x1"
                        from="-150%"
                        to="150%"
                        dur="4s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="x2"
                        from="50%"
                        to="350%"
                        dur="4s"
                        repeatCount="indefinite"
                    />
                </linearGradient>
            </defs>

            {/* 
               Layer 1: The Liquid Base 
               We render the text using the base gradient.
            */}
            <text
                x="50%"
                y="55%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                fontSize="28"
                fontWeight="800"
                letterSpacing="-0.04em"
                fill={`url(#${baseGradientId})`}
            >
                DGEX
            </text>

            {/* 
               Layer 2: The Shine Overlay 
               We render the exact same text on top, filled with the shine gradient.
               'color-burn' or 'overlay' blend modes can be used, but normal alpha blending 
               works most reliably across all browsers for this 'white on color' effect.
            */}
            <text
                x="50%"
                y="55%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                fontSize="28"
                fontWeight="800"
                letterSpacing="-0.04em"
                fill={`url(#${shineGradientId})`}
                style={{ mixBlendMode: 'overlay' }}
            >
                DGEX
            </text>

            {/* Fallback/Boost for Shine (Screen mode for max brightness without clipping) */}
            <text
                x="50%"
                y="55%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                fontSize="28"
                fontWeight="800"
                letterSpacing="-0.04em"
                fill={`url(#${shineGradientId})`}
                fillOpacity="0.4"
                style={{ pointerEvents: 'none' }}
            >
                DGEX
            </text>
        </svg>
    );
}
