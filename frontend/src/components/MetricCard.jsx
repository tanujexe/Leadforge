import React from 'react';

export default function MetricCard({ title, value, icon: Icon, description, colorClass = 'text-primary' }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-start justify-between hover:border-border/80 transition-all select-none">
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{title}</span>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-2xl font-extrabold tracking-tight text-text">{value}</span>
        </div>
        {description && (
          <p className="text-[10px] text-text-muted/80 font-medium">{description}</p>
        )}
      </div>
      <div className={`p-2 bg-background border border-border rounded ${colorClass}`}>
        <Icon size={16} />
      </div>
    </div>
  );
}
