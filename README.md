# My Tax Tracker - Full Stack Application

A comprehensive full-stack tax tracking application built with **FastAPI (Python)** backend and **React** frontend, featuring AWS Cognito authentication, DynamoDB storage, and S3 file management.

##  Features

- **User Authentication**: Secure login/logout with AWS Cognito
- **Receipt Management**: Upload, store, and organize tax receipts
- **OCR Processing**: Extract text from receipt images using AWS Textract
- **Responsive UI**: Modern, mobile-friendly interface built with Tailwind CSS
- **RESTful API**: Well-documented FastAPI backend with automatic documentation
- **Cloud-Native**: Built for AWS with Docker containerization

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **Python 3.11** - Latest stable Python version
- **AWS Cognito** - User authentication and management
- **DynamoDB** - NoSQL database for data storage
- **S3** - File storage for receipt images
- **AWS Textract** - OCR processing for receipts
- **JWT** - Token-based authentication

### Frontend
- **React 19** - Latest React with modern hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

## 📋 Prerequisites

Before running this application, ensure you have:

- **Docker** installed on your system
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) for Windows/Mac
  - [Docker Engine](https://docs.docker.com/engine/install/) for Linux
- **Git** for cloning the repository
- **AWS Account** with appropriate permissions (for production use)

## 🚀 Quick Start Guide

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd my-tax-tracker
```

### Step 2: Set Up Environment Variables
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your AWS credentials and configuration:
   ```bash
   # Required: AWS Cognito Configuration
   CLIENT_SECRET=your_cognito_client_secret
   CLIENT_ID=your_cognito_client_id
   COGNITO_USER_POOL_ID=your_user_pool_id
   
   # Required: AWS Credentials
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   
   # Required: DynamoDB Tables
   RECEIPT_TABLE=your_receipt_table_name
   BLACKLIST_TOKEN_TABLE=your_blacklist_table_name
   
   # Required: S3 Bucket
   S3_BUCKET=your_s3_bucket_name
   
   # Optional: Customize URLs (defaults work for local development)
   REDIRECT_URI=http://localhost:3000/auth/callback
   ALLOW_ORIGINS=http://localhost:3000,http://localhost:8000
   ```

### Step 3: Run with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### Step 4: Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔧 Development Setup

### Running Backend Only
```bash
cd backend-app/backend
docker build -t tax-tracker-backend .
docker run -p 8000:8000 --env-file ../../.env tax-tracker-backend
```

### Running Frontend Only
```bash
cd frontend-app/frontend/my-tax-tracker-fe
docker build -t tax-tracker-frontend .
docker run -p 3000:3000 --env-file ../../../.env tax-tracker-frontend
```

### Local Development (without Docker)
```bash
# Backend
cd backend-app/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend-app/frontend/my-tax-tracker-fe
npm install
npm run dev
```

## 🧪 Testing the Application

### 1. Health Check
Visit http://localhost:8000/health to verify the backend is running:
```json
{
  "status": "healthy",
  "environment": "dev"
}
```

### 2. API Documentation
Visit http://localhost:8000/docs to see the interactive API documentation.

### 3. Frontend Loading
Visit http://localhost:3000 to ensure the React app loads properly.

### 4. Authentication Flow
1. Click "Login" on the frontend
2. You should be redirected to the backend auth endpoint
3. Check browser console for any errors

### 5. Docker Container Status
```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :8000

# Kill processes if needed
kill -9 <PID>
```

#### Docker Build Issues
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### Environment Variable Issues
```bash
# Verify environment variables are loaded
docker-compose config

# Check individual service environment
docker-compose exec backend env | grep AWS
```

#### AWS Credentials Issues
- Ensure your AWS credentials have the necessary permissions
- Verify the region matches your AWS resources
- Check that DynamoDB tables and S3 buckets exist

### Logs and Debugging
```bash
# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Access container shell for debugging
docker-compose exec backend bash
docker-compose exec frontend sh
```

## 📁 Project Structure

```
my-tax-tracker/
├── backend-app/
│   └── backend/
│       ├── src/
│       │   ├── models/          # Database models
│       │   ├── routers/         # API endpoints
│       │   ├── config.py        # Configuration & AWS setup
│       │   └── helpers.py       # Utility functions
│       ├── main.py              # FastAPI application
│       ├── requirements.txt     # Python dependencies
│       └── Dockerfile           # Backend container
├── frontend-app/
│   └── frontend/
│       └── my-tax-tracker-fe/
│           ├── src/
│           │   ├── components/   # React components
│           │   ├── pages/        # Page components
│           │   └── customprocess/ # Authentication & utilities
│           ├── package.json      # Node.js dependencies
│           └── Dockerfile        # Frontend container
├── docker-compose.yml           # Service orchestration
├── .env.example                 # Environment template
└── README.md                    # This file
```

### 6. Testing Script
```bash:my-tax-tracker/test-setup.sh
#!/bin/bash

echo " Testing My Tax Tracker Setup"
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
```

### 7. Startup Script
```bash:my-tax-tracker/start.sh
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
echo " Application should now be running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo ""
echo " Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop app:     docker-compose down"
echo "   Restart:      docker-compose restart"
```

## 🎯 How to Use This Setup

### For Employers/Reviewers:

1. **Clone your repository**
2. **Copy `.env.example` to `.env`** and fill in the required AWS credentials
3. **Run `./start.sh`** to start everything
4. **Visit http://localhost:3000** to see your app running
5. **Check http://localhost:8000/docs** to see your API documentation

### Key Benefits of This Setup:

- **Professional**: Clean, production-ready Docker configuration
- **Easy to Follow**: Step-by-step instructions anyone can follow
- **Comprehensive**: Covers all edge cases and troubleshooting
- **Portfolio-Ready**: Shows your DevOps and deployment skills
- **Testing Included**: Built-in health checks and testing scripts

### What This Demonstrates:

✅ **Full-Stack Development**: Python backend + React frontend  
✅ **DevOps Skills**: Docker, Docker Compose, containerization  
✅ **Cloud Integration**: AWS services (Cognito, DynamoDB, S3)  
✅ **Documentation**: Professional README with clear instructions  
✅ **Testing**: Automated setup verification  
✅ **Production Ready**: Proper environment management and security  

This setup will make it incredibly easy for employers to see your application in action, demonstrating both your technical skills and your ability to create professional, deployable applications. The comprehensive documentation shows you understand the importance of clear communication and user experience, which are crucial skills in any development role.

Would you like me to help you test this setup or make any adjustments to the configuration?

## 🔒 Security Considerations

- **Environment Variables**: Never commit `.env` files to version control
- **AWS Credentials**: Use IAM roles with minimal required permissions
- **CORS**: Configure `ALLOW_ORIGINS` appropriately for production
- **HTTPS**: Enable HTTPS in production environments
- **Secrets Management**: Use AWS Secrets Manager for production deployments

## 🚀 Production Deployment

For production deployment, consider:

1. **AWS ECS/Fargate** for container orchestration
2. **Application Load Balancer** for traffic distribution
3. **CloudFront** for frontend CDN
4. **RDS/ElastiCache** for additional data storage needs
5. **CloudWatch** for monitoring and logging

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Docker Documentation](https://docs.docker.com/)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ using modern web technologies**