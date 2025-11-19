import { Badge } from '@mantine/core';

interface NotificationIndicatorProps {
  count: number;
  maxCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

export const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({ 
  count, 
  maxCount = 99, 
  size = 'sm',
  color = 'red' 
}) => {
  if (count <= 0) return null;

  return (
    <Badge 
      color={color} 
      variant="filled" 
      size={size} 
      circle
      style={{ 
        minWidth: size === 'sm' ? '20px' : '24px', 
        height: size === 'sm' ? '20px' : '24px',
        fontSize: size === 'sm' ? '11px' : '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:0,
        lineHeight: 1,
        boxSizing: 'border-box',
      }}
    >
      {count > maxCount ? `${maxCount}+` : count}
    </Badge>
  );
};