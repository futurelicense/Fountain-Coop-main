interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'highlighted';
}
export function Card({
  children,
  className = '',
  title,
  subtitle,
  icon,
  headerAction,
  variant = 'default'
}: CardProps) {
  const baseStyles = 'rounded-xl bg-white overflow-hidden';
  const variantStyles = {
    default: 'shadow-sm border border-fountain-gray-200',
    outlined: 'border-2 border-fountain-gray-200',
    highlighted:
    'shadow-md border border-fountain-blue ring-1 ring-fountain-blue/20'
  };
  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {(title || icon || headerAction) &&
      <div className="px-5 py-4 border-b border-fountain-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && <div className="text-fountain-blue">{icon}</div>}
            <div>
              {title &&
            <h3 className="text-lg font-semibold text-fountain-gray-900">
                  {title}
                </h3>
            }
              {subtitle &&
            <p className="text-sm text-fountain-gray-600 mt-0.5">
                  {subtitle}
                </p>
            }
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      }
      <div className="p-5">{children}</div>
    </div>);

}