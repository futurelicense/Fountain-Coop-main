interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default';
  size?: 'sm' | 'md';
  className?: string;
}
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };
  const variantStyles = {
    success: 'bg-fountain-green/10 text-fountain-green',
    warning: 'bg-fountain-amber/10 text-fountain-amber',
    danger: 'bg-fountain-red/10 text-fountain-red',
    info: 'bg-fountain-blue/10 text-fountain-blue',
    neutral: 'bg-fountain-gray-100 text-fountain-gray-600',
    default: 'bg-fountain-gray-100 text-fountain-gray-900'
  };
  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      
      {children}
    </span>);

}