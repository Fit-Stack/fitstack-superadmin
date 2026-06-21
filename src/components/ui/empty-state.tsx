import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  className?: string;
  variant?: 'default' | 'compact' | 'card';
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className,
  variant = 'default',
}: EmptyStateProps) {
  const isCompact = variant === 'compact';
  const isCard = variant === 'card';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        isCompact ? 'py-8 px-4' : 'py-12 px-6',
        isCard && 'bg-white rounded-lg border border-gray-200 shadow-sm',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full bg-gray-100 flex items-center justify-center',
          isCompact ? 'h-12 w-12 mb-3' : 'h-16 w-16 mb-4'
        )}
      >
        <Icon
          className={cn(
            'text-gray-400',
            isCompact ? 'h-6 w-6' : 'h-8 w-8'
          )}
        />
      </div>
      
      <h3
        className={cn(
          'font-semibold text-gray-900',
          isCompact ? 'text-base mb-1' : 'text-lg mb-2'
        )}
      >
        {title}
      </h3>
      
      {description && (
        <p
          className={cn(
            'text-gray-500 max-w-sm',
            isCompact ? 'text-sm mb-3' : 'text-base mb-4'
          )}
        >
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size={isCompact ? 'sm' : 'default'}
          className="mt-2"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export interface EmptyStateCardProps extends EmptyStateProps {
  children?: React.ReactNode;
}

export function EmptyStateCard({
  children,
  ...props
}: EmptyStateCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <EmptyState {...props} variant="default" />
      {children}
    </div>
  );
}
