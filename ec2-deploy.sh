#!/bin/bash

# EC2 Deployment Script for AI Ticket Assistant

echo "🚀 Starting EC2 deployment..."

# Replace with your EC2 public IP
EC2_IP="YOUR-EC2-PUBLIC-IP"

# Backend deployment
echo "📦 Setting up backend..."
cd ai-ticket-assistant
cp ../ec2-backend.env .env
sed -i "s/YOUR-EC2-PUBLIC-IP/$EC2_IP/g" .env
npm install --production

# Frontend deployment
echo "🎨 Setting up frontend..."
cd ../ai-ticket-frontend
cp ../ec2-frontend.env .env
sed -i "s/YOUR-EC2-PUBLIC-IP/$EC2_IP/g" .env
npm install
npm run build

# Create PM2 ecosystem file
cd ..
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'ai-ticket-backend',
      script: './ai-ticket-assistant/server.js',
      cwd: './ai-ticket-assistant',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'ai-ticket-inngest',
      script: 'npx',
      args: 'inngest-cli@latest dev',
      cwd: './ai-ticket-assistant',
      instances: 1,
      autorestart: true,
      watch: false
    },
    {
      name: 'ai-ticket-frontend',
      script: 'npx',
      args: 'serve -s dist -l 5174',
      cwd: './ai-ticket-frontend',
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
};
EOF

# Install serve for frontend
npm install -g serve

# Start all services with PM2
echo "🔄 Starting services..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://$EC2_IP:5174"
echo "🔧 Backend API: http://$EC2_IP:3000/api"
echo "📊 PM2 Status: pm2 status"