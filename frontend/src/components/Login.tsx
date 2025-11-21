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
      backgroundColor: '#f5f5f5'}}> 

      <Paper radius="md" p="lg" withBorder w={400} shadow='xl' {...props}>
        <Text size="lg" fw={500} ta="center" mb="xs">
           Presupuestador Web
        </Text>
        <Text size="lg" fw={500} ta="center" mb="xs">
          MediHome
        </Text>
        
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack align="stretch" justify="space-around" gap="md" >
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
              variant="unstyled"
            />
            
            <PasswordInput
              required
              label="Contraseña"
              placeholder="Tu contraseña"
              value={form.values.password}
              onChange={(event) => form.setFieldValue('password', event.currentTarget.value)}
              error={form.errors.password}
              radius="md"
              variant="unstyled"
              mt="md"
              visibilityToggleIcon={({ reveal }) => 
                reveal ? <EyeSlashIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />
              }
            />
          </Stack>
          
          <Group justify="center" mt="xl">
            <Button type="submit" loading={loading} radius="xl" size="md">
              Iniciar Sesión
            </Button>
          </Group>
        </form>
      </Paper>
    </div>
  );
}
