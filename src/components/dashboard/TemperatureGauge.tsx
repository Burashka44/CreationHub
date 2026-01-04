import React from 'react';

interface TemperatureGaugeProps {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  size?: number;
  warning?: number;
  critical?: number;
}

const TemperatureGauge = ({
  value,
  max = 100,
  label,
  unit = '%',
  size = 120,
  warning,
  critical
}: TemperatureGaugeProps) => {
  const percent = Math.min(value / max, 1);
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;

  // Gauge arc from 135° to 405° (270° arc)
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;
  const currentAngle = startAngle + (percent * totalAngle);

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad)
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  // Color gradient based on value
  const getColor = () => {
    // If warning/critical provided, use them (absolute values)
    if (warning !== undefined && critical !== undefined) {
      if (value >= critical) return '#ef4444'; // Red
      if (value >= warning) return '#f97316'; // Orange
      return '#22c55e'; // Green
    }

    // Default percentage based fallback
    if (percent < 0.3) return '#22c55e'; // Green
    if (percent < 0.5) return '#84cc16'; // Lime
    if (percent < 0.7) return '#eab308'; // Yellow
    if (percent < 0.85) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getGradientColors = () => {
    return [
      { offset: '0%', color: '#22c55e' },
      { offset: '25%', color: '#84cc16' },
      { offset: '50%', color: '#eab308' },
      { offset: '75%', color: '#f97316' },
      { offset: '100%', color: '#ef4444' },
    ];
  };

  const cx = size / 2;
  const cy = size / 2;
  const gradientId = `gauge-gradient-${label.replace(/\s/g, '-')}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {getGradientColors().map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d={describeArc(cx, cy, radius, startAngle, endAngle)}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value arc */}
          <path
            d={describeArc(cx, cy, radius, startAngle, currentAngle)}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-500"
          />

          {/* Inner dark circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius - strokeWidth * 1.5}
            fill="hsl(var(--card))"
            className="drop-shadow-lg"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold text-foreground"
            style={{ fontSize: size * 0.22 }}
          >
            {value.toFixed(unit === '°C' ? 0 : 2)}{unit}
          </span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground mt-2">{label}</span>
    </div>
  );
};

export default TemperatureGauge;
