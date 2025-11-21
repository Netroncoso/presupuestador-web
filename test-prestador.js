// Test script para verificar el endpoint actualizarPrestador
const axios = require('axios');

async function testActualizarPrestador() {
  try {
    // Primero hacer login para obtener token
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      username: 'prueba',
      password: 'prueba123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');
    
    // Probar el endpoint actualizarPrestador
    const response = await axios.put('http://localhost:4000/api/presupuestos/286/prestador', {
      idobra_social: '5'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Respuesta del endpoint:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testActualizarPrestador();