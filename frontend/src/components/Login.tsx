import React, { useState } from 'react';
import { Paper, TextInput, PasswordInput, Button, Title, Stack, Alert } from '@mantine/core';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(username, password);
    
    if (!success) {
      setError('Credenciales inválidas');
    }
    
    setLoading(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <Paper p="xl" withBorder style={{ width: 400 }}>
        <Title order={2} ta="center" mb="lg">
          Presupuestador Web
        </Title>
        
        <form onSubmit={handleSubmit}>
          <Stack spacing="md">
            {error && (
              <Alert icon={<ExclamationCircleIcon width={16} height={16} />} color="red">
                {error}
              </Alert>
            )}
            
            <TextInput
              label="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            
            <PasswordInput
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <Button type="submit" loading={loading} fullWidth>
              Iniciar Sesión
            </Button>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}