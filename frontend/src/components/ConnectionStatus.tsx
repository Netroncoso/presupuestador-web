import { Tooltip } from '@mantine/core';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  const statusColor = isConnected ? '#40c057' : '#fa5252';
  const statusText = isConnected ? 'Notificaciones en tiempo real' : 'Desconectado';
  
  return (
    <Tooltip label={statusText}>
      <div 
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColor
        }}
      />
    </Tooltip>
  );
};