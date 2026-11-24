interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'blue' | 'yellow' | 'purple' | 'gray' | 'indigo' | 'orange';
}

const variantClasses: Record<string, string> = {
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  gray: 'bg-slate-700/50 text-slate-400 border-slate-600',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export default function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
