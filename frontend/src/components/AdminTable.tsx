import { Table, Paper, Text } from '@mantine/core';
import { ReactNode } from 'react';

interface AdminTableProps {
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export default function AdminTable({ children, emptyMessage = 'No se encontraron resultados', isEmpty = false }: AdminTableProps) {
  return (
    <Paper p="md" withBorder>
      <Table striped="odd" highlightOnHover  stickyHeader>
        {children}
      </Table>
      
      {isEmpty && (
        <div style={{ textAlign: 'left', padding: '2rem', color: '#666' }}>
          {emptyMessage}
        </div>
      )}
    </Paper>
  );
}
