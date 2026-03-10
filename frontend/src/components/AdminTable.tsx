import { Table, Paper, ScrollArea } from '@mantine/core';
import { ReactNode } from 'react';

interface AdminTableProps {
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  minWidth?: number;
  onScrollPositionChange?: (position: { x: number; y: number }) => void;
}

export default function AdminTable({ children, emptyMessage = 'No se encontraron resultados', isEmpty = false, minWidth = 800, onScrollPositionChange }: AdminTableProps) {
  return (
    <Paper p="md" withBorder>
      {isEmpty ? (
        <div style={{ textAlign: 'left', padding: '2rem', color: '#666' }}>
          {emptyMessage}
        </div>
      ) : (
        <ScrollArea onScrollPositionChange={onScrollPositionChange} h={600}>
          <Table striped="odd" highlightOnHover stickyHeader style={{ minWidth }}>
            {children}
          </Table>
        </ScrollArea>
      )}
    </Paper>
  );
}
