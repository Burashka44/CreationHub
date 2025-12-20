import React from 'react';

interface GaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

const Gauge = ({ 
  value, 
  max = 100, 
  size = 100, 
  strokeWidth = 8, 
  label,
  color = 'primary'
}: GaugeProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(value / max, 1);
  const offset = circumference - percent * circumference;

  const colorClasses = {
    primary: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    destructive: 'stroke-destructive',
  };

  const getColor = () => {
    if (value < 50) return colorClasses.success;
    if (value < 80) return colorClasses.warning;
    return colorClasses.destructive;
  };

  return (
    <div className="stat-card">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted"
          />
          {/* Value circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`gauge-ring ${color === 'primary' ? getColor() : colorClasses[color]}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{Math.round(value)}%</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
};

export default Gauge;
