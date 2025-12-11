import React, { useState } from 'react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Alert,
  Group,
  PaperProps
} from '@mantine/core';
import { useForm } from '@mantine/form';
import ExclamationCircleIcon from '@heroicons/react/24/outline/ExclamationCircleIcon';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import EyeSlashIcon from '@heroicons/react/24/outline/EyeSlashIcon';
import { useAuth } from '../contexts/AuthContext';

export default function Login(props: PaperProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (val) => (val.length === 0 ? 'Usuario requerido' : null),
      password: (val) => (val.length === 0 ? 'Contraseña requerida' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setError('');
    setLoading(true);

    const success = await login(values.username, values.password);
    
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
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <Paper 
        radius="20" 
        p="xl" 
        withBorder 
        shadow='xl' 
        {...props} 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          width: '100%',
          maxWidth: '900px',
          minHeight: '500px',
          gap: 30
        }}
      >
        {/* Logo Section */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRight: '2px solid #e0e0e0'
        }}>
          <img 
            src="/logoMH.png" 
            alt="MediHome Logo" 
            style={{ maxWidth: '280px', height: 'auto' }}
          />
        </div>

        {/* Form Section */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
        }}>
          <Text size="xl" fw={500} ta="center" mb="xs">
            MEDIHOME
          </Text>
          <Text size="md" fw={400} ta="center" mb="xs">
            Presupuestador Web
          </Text>
          
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="xs">
              {error && (
                <Alert icon={<ExclamationCircleIcon width={16} height={16} />} color="red">
                  {error}
                </Alert>
              )}
              
              <TextInput
                required
                label="Usuario"
                placeholder="Ingresa tu usuario"
                value={form.values.username}
                onChange={(event) => form.setFieldValue('username', event.currentTarget.value)}
                error={form.errors.username}
                radius="md"
                variant="filled"
              />
              
              <PasswordInput
                required
                label="Contraseña"
                placeholder="xxxxxxxx"
                value={form.values.password}
                onChange={(event) => form.setFieldValue('password', event.currentTarget.value)}
                error={form.errors.password}
                radius="md"
                variant="filled"
                mt="md"
                visibilityToggleIcon={({ reveal }) => 
                  reveal ? <EyeSlashIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />
                }
              />
            </Stack>
            
            <Button 
              type="submit" 
              loading={loading} 
              radius="md" 
              size="md"
              style={{ backgroundColor: 'rgb(0, 92, 163)' }}
              fullWidth
              mt="xl"
            >
              Iniciar Sesión
            </Button>
          </form>
        </div>
      </Paper>
    </div>
  );
}
