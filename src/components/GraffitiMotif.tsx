import React, { useId } from 'react';

interface GraffitiMotifProps {
  isDark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GraffitiMotif: React.FC<GraffitiMotifProps> = ({
  isDark = false,
  size = 'md',
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const painGradId = `pain-grad-${uid}`;
  const gainGradId = `gain-grad-${uid}`;
  const arrowGradId = `arrow-grad-${uid}`;
  const splashGradId = `splash-grad-${uid}`;

  const heightClass =
    size === 'sm'
      ? 'h-9 sm:h-10 w-auto'
      : size === 'lg'
        ? 'h-14 sm:h-16 w-auto'
        : 'h-11 lg:h-12 w-auto';

  const outlineColor = isDark ? '#0C0603' : '#241309';
  const extrudeColor = isDark ? '#3D2314' : '#4A2B18';

  return (
    <div
      aria-label="Motivasi NO PAIN NO GAIN"
      className={`inline-flex items-center justify-center select-none ${className}`}
    >
      <svg
        viewBox="0 0 430 80"
        className={`${heightClass} overflow-visible`}
        role="img"
        aria-label="NO PAIN | NO GAIN"
      >
        <defs>
          {/* Bright Ivory/White Fill for NO PAIN */}
          <linearGradient id={painGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#FAF3E8" />
            <stop offset="100%" stopColor="#E4D1B7" />
          </linearGradient>

          {/* Rich Metallic Gold Fill for NO GAIN */}
          <linearGradient id={gainGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF0B8" />
            <stop offset="45%" stopColor="#E5B874" />
            <stop offset="100%" stopColor="#B87328" />
          </linearGradient>

          {/* Street Arrow & Divider Accent */}
          <linearGradient id={arrowGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B4D25" />
            <stop offset="50%" stopColor="#E5B874" />
            <stop offset="100%" stopColor="#9C5726" />
          </linearGradient>

          {/* Subtle Tag Splash Backdrop */}
          <radialGradient id={splashGradId} cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={isDark ? '#C59656' : '#8B4D25'}
              stopOpacity={isDark ? '0.26' : '0.16'}
            />
            <stop
              offset="70%"
              stopColor={isDark ? '#4A2B18' : '#C59656'}
              stopOpacity="0.06"
            />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Atmospheric Tag Splash & Spray Specks */}
        <ellipse cx="215" cy="40" rx="195" ry="26" fill={`url(#${splashGradId})`} />
        <g fill={isDark ? '#E5B874' : '#6E3E20'} opacity="0.65">
          <circle cx="22" cy="24" r="2.2" />
          <circle cx="14" cy="31" r="1.3" />
          <circle cx="30" cy="18" r="1.4" />
          <circle cx="404" cy="22" r="2.3" />
          <circle cx="414" cy="30" r="1.4" />
          <circle cx="395" cy="15" r="1.3" />
          <circle cx="118" cy="12" r="1.5" />
          <circle cx="315" cy="66" r="1.6" />
        </g>

        {/* Graffiti Crown above center */}
        <g transform="translate(197, 2) rotate(-4)">
          <path
            d="M3 13 L1 3 L9 8 L17 1 L25 8 L33 3 L31 13 Z"
            fill="#E5B874"
            stroke={outlineColor}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="1" cy="2.5" r="1.6" fill="#FFF0B8" stroke={outlineColor} strokeWidth="1" />
          <circle cx="17" cy="1" r="1.8" fill="#FFF0B8" stroke={outlineColor} strokeWidth="1" />
          <circle cx="33" cy="2.5" r="1.6" fill="#FFF0B8" stroke={outlineColor} strokeWidth="1" />
        </g>

        {/* Main Tilted Tag Group */}
        <g transform="rotate(-1.8 215 42)">
          {/* Layer 1: Chunky 3D Block Extrusion Shadow */}
          <text
            x="215"
            y="50"
            textAnchor="middle"
            transform="translate(3.5, 3.5)"
            className="font-graffiti"
            fontSize="35"
            fontWeight="900"
            fill={extrudeColor}
            stroke={extrudeColor}
            strokeWidth="6.5"
            strokeLinejoin="round"
            style={{ paintOrder: 'stroke fill' }}
          >
            <tspan>NO PAIN</tspan>
            <tspan dx="10">|</tspan>
            <tspan dx="10">NO GAIN</tspan>
          </text>

          {/* Layer 2: Bold Outline + Metallic/Ivory Gradient Lettering */}
          <text
            x="215"
            y="50"
            textAnchor="middle"
            className="font-graffiti"
            fontSize="35"
            fontWeight="900"
            stroke={outlineColor}
            strokeWidth="6.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ paintOrder: 'stroke fill' }}
          >
            <tspan fill={`url(#${painGradId})`}>NO PAIN</tspan>
            <tspan dx="10" fill="#E5B874">
              |
            </tspan>
            <tspan dx="10" fill={`url(#${gainGradId})`}>
              NO GAIN
            </tspan>
          </text>

          {/* Paint Drips hanging cleanly from key letters */}
          <g fill={outlineColor}>
            {/* Drip under N / O */}
            <path d="M52 50 C52 56 54 61 52.5 63.5 C51 66 48.5 64 49 60.5 C49.3 57 50 53 50 50 Z" />
            {/* Drip under P */}
            <path d="M126 51 C126 57 127.8 63 126.2 66 C124.5 68.5 122 66.2 122.4 62.5 C122.8 58 123.5 54 123.5 51 Z" />
            {/* Gold drip under G */}
            <path
              d="M277 51 C277 58 279 64 277.3 67.5 C275.5 70 273 67.5 273.5 63.2 C273.8 59 274.5 54 274.5 51 Z"
              fill="#C59656"
              stroke={outlineColor}
              strokeWidth="1.4"
            />
          </g>

          {/* Dynamic Graffiti Arrow Swoosh Underline */}
          <path
            d="M36 62 Q150 54 245 60 T392 56"
            fill="none"
            stroke={outlineColor}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M36 62 Q150 54 245 60 T392 56"
            fill="none"
            stroke={`url(#${arrowGradId})`}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Arrow Head */}
          <path
            d="M386 50 L402 55.5 L388 63 L391 56 Z"
            fill="#E5B874"
            stroke={outlineColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>

        {/* Crisp Vector Star Glints */}
        <path
          d="M26 42 L28 36 L30 42 L36 44 L30 46 L28 52 L26 46 L20 44 Z"
          fill="#E5B874"
          stroke={outlineColor}
          strokeWidth="1.1"
        />
        <path
          d="M402 36 L403.5 31 L405 36 L410 37.5 L405 39 L403.5 44 L402 39 L397 37.5 Z"
          fill={isDark ? '#FFFFFF' : '#E5B874'}
          stroke={outlineColor}
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};
