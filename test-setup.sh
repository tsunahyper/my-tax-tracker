#!/bin/bash

echo "�� Testing My Tax Tracker Setup"
echo "================================"

# Check if Docker is running
echo "1. Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi
echo "✅ Docker is running"

# Check if containers are running
echo "2. Checking container status..."
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Containers are not running. Starting them now..."
    docker-compose up --build -d
    sleep 10
fi

# Test backend health
echo "3. Testing backend health..."
BACKEND_HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null)
if [[ $BACKEND_HEALTH == *"healthy"* ]]; then
    echo "✅ Backend is healthy: $BACKEND_HEALTH"
else
    echo "❌ Backend health check failed"
fi

# Test frontend
echo "4. Testing frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [[ $FRONTEND_RESPONSE == "200" ]]; then
    echo "✅ Frontend is responding (HTTP $FRONTEND_RESPONSE)"
else
    echo "❌ Frontend is not responding properly (HTTP $FRONTEND_RESPONSE)"
fi

# Test API documentation
echo "5. Testing API documentation..."
API_DOCS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs)
if [[ $API_DOCS == "200" ]]; then
    echo "✅ API documentation is accessible"
else
    echo "❌ API documentation is not accessible (HTTP $API_DOCS)"
fi

# Check container logs for errors
echo "6. Checking for container errors..."
ERRORS=$(docker-compose logs --tail=20 | grep -i "error\|exception\|failed" | wc -l)
if [[ $ERRORS -eq 0 ]]; then
    echo "✅ No recent errors found in container logs"
else
    echo "⚠️  Found $ERRORS potential errors in container logs"
    echo "Recent logs:"
    docker-compose logs --tail=10
fi

echo ""
echo "🎉 Setup testing complete!"
echo ""
echo "📱 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "🔍 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
