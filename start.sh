#!/bin/bash

echo "🚀 Starting My Tax Tracker Application"
echo "====================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please copy .env.example to .env and configure your environment variables."
    exit 1
fi

# Start the application
echo "🐳 Starting Docker containers..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 15

echo "🧪 Running health checks..."
./test-setup.sh

echo ""
echo "�� Application should now be running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo ""
echo "�� Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop app:     docker-compose down"
echo "   Restart:      docker-compose restart"
