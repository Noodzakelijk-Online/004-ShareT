const http = require('http');

const PORT = process.env.PORT || 5000;
const HOST = 'localhost';

console.log(`🏥 Checking health of ShareT server on ${HOST}:${PORT}...`);

const options = {
  hostname: HOST,
  port: PORT,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      
      console.log('');
      console.log('📊 Health Check Results:');
      console.log('========================');
      console.log(`Status: ${health.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy'}`);
      console.log(`MongoDB: ${health.mongodb === 'connected' ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`Uptime: ${Math.floor(health.uptime / 60)} minutes`);
      console.log(`Timestamp: ${health.timestamp}`);
      console.log('');

      if (health.status === 'healthy' && health.mongodb === 'connected') {
        console.log('✅ Server is healthy and ready!');
        process.exit(0);
      } else {
        console.log('⚠️  Server is running but not fully healthy');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Invalid health check response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('');
  console.error('❌ Health check failed!');
  console.error(`Error: ${error.message}`);
  console.error('');
  console.error('Possible reasons:');
  console.error('  - Server is not running');
  console.error('  - Server is starting up');
  console.error('  - Port is blocked');
  console.error('');
  console.error('Try: npm run pm2:logs');
  console.error('');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Health check timed out!');
  req.destroy();
  process.exit(1);
});

req.end();
