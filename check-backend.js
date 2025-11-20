const http = require('http');

// Check if backend is running
const checkBackend = () => {
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/stream/updates',
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Backend status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    if (res.statusCode === 401) {
      console.log('✅ Backend is running - SSE endpoint exists but requires authentication');
    } else if (res.statusCode === 200) {
      console.log('✅ Backend is running - SSE endpoint is accessible');
    } else {
      console.log(`❌ Unexpected status code: ${res.statusCode}`);
    }
  });

  req.on('error', (err) => {
    console.log('❌ Backend is not running or not accessible');
    console.log('Error:', err.message);
    console.log('\nTo start the backend:');
    console.log('1. cd backend');
    console.log('2. npm run dev');
  });

  req.setTimeout(5000, () => {
    console.log('❌ Request timeout - backend might be slow or not responding');
    req.destroy();
  });

  req.end();
};

console.log('Checking backend server...');
checkBackend();