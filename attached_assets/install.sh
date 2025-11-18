#!/bin/bash

# SmartResultChecker Installation Script
# This script automates the setup process

echo "🎓 SmartResultChecker Installation Script"
echo "=========================================="
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check MongoDB installation
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed or not in PATH"
    echo "Do you want to use Docker for MongoDB? (y/n)"
    read -r USE_DOCKER
    
    if [ "$USE_DOCKER" = "y" ]; then
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker is not installed. Please install Docker first."
            exit 1
        fi
        
        echo "🐳 Starting MongoDB with Docker..."
        docker run -d -p 27017:27017 --name smartresult-mongodb mongo:latest
        
        if [ $? -eq 0 ]; then
            echo "✅ MongoDB started successfully"
        else
            echo "❌ Failed to start MongoDB"
            exit 1
        fi
    else
        echo "Please install MongoDB manually and restart this script."
        exit 1
    fi
else
    echo "✅ MongoDB detected"
fi

echo ""
echo "📦 Installing Backend Dependencies..."
echo ""

cd backend || exit

if [ ! -f package.json ]; then
    echo "❌ Backend package.json not found"
    exit 1
fi

npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✅ Backend dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    
    cat > .env << EOL
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartresultchecker
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000

# Super Admin Default Credentials
SUPER_ADMIN_EMAIL=superadmin@smartresult.com
SUPER_ADMIN_PASSWORD=Admin@123456
EOL
    
    echo "✅ .env file created with random JWT secret"
else
    echo "⚠️  .env file already exists, skipping..."
fi

cd ..

echo ""
echo "📦 Installing Frontend Dependencies..."
echo ""

cd frontend || exit

if [ ! -f package.json ]; then
    echo "❌ Frontend package.json not found"
    exit 1
fi

npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "✅ Frontend dependencies installed"
echo ""

# Create frontend .env file
if [ ! -f .env ]; then
    echo "📝 Creating frontend .env file..."
    
    cat > .env << EOL
REACT_APP_API_URL=http://localhost:5000/api
EOL
    
    echo "✅ Frontend .env file created"
else
    echo "⚠️  Frontend .env file already exists, skipping..."
fi

cd ..

echo ""
echo "=========================================="
echo "✅ Installation Complete!"
echo "=========================================="
echo ""
echo "🚀 To start the application:"
echo ""
echo "Backend:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Frontend (in a new terminal):"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "📚 Access:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:5000"
echo "  API Docs: http://localhost:5000/api-docs"
echo ""
echo "🔑 Default Super Admin Credentials:"
echo "  Email: superadmin@smartresult.com"
echo "  Password: Admin@123456"
echo ""
echo "📖 Full documentation available in DOCUMENTATION.md"
echo ""
echo "Happy coding! 🎉"