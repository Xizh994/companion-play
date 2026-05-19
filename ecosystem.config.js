module.exports = {
 apps: [
 {
 name: 'dazistar',
 cwd: '/www/dazistar',
 script: 'server.js',
 args: '--port 3000',
 instances: 1,
 exec_mode: 'fork',
 autorestart: true,
 watch: false,
 max_memory_restart: '1G',
 env: {
 NODE_ENV: 'production',
 PORT: '3000',
 NEXTAUTH_URL: 'http://www.dazistar.com',
 NEXT_PUBLIC_APP_URL: 'http://www.dazistar.com'
 },
 error_file: '/www/dazistar/logs/dazistar-3000-err.log',
 out_file: '/www/dazistar/logs/dazistar-3000-out.log',
 log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
 merge_logs: true
 },
 {
 name: 'dazistar-3001',
 cwd: '/www/dazistar-test',
 script: 'server.js',
 args: '--port 3001',
 instances: 1,
 exec_mode: 'fork',
 autorestart: true,
 watch: false,
 max_memory_restart: '1G',
 env: {
 NODE_ENV: 'production',
 PORT: '3001',
 NEXTAUTH_URL: 'http://test.dazistar.com',
 NEXT_PUBLIC_APP_URL: 'http://test.dazistar.com'
 },
 error_file: '/www/dazistar/logs/dazistar-3001-err.log',
 out_file: '/www/dazistar/logs/dazistar-3001-out.log',
 log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
 merge_logs: true
 }
 ]
};
