#!/bin/bash

# AgentVerse Marketplace Setup Script
# This script sets up the complete AgentVerse marketplace with Python microservices

set -e  # Exit on any error

echo "🚀 Setting up AgentVerse Marketplace..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
print_status "Node.js found: $(node --version)"

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi
print_status "Python found: $(python3 --version)"

# Check Redis
if ! command -v redis-server &> /dev/null; then
    print_warning "Redis not found. Installing Redis..."
    # Try to install Redis based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y redis-server
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install redis
        else
            print_error "Please install Redis manually or install Homebrew first."
            exit 1
        fi
    else
        print_error "Please install Redis manually for your operating system."
        exit 1
    fi
fi
print_status "Redis found"

# Start Redis if not running
if ! redis-cli ping &> /dev/null; then
    print_info "Starting Redis server..."
    redis-server --daemonize yes
    sleep 2
    if redis-cli ping &> /dev/null; then
        print_status "Redis server started"
    else
        print_error "Failed to start Redis server"
        exit 1
    fi
else
    print_status "Redis server is running"
fi

# Setup environment variables
echo ""
echo "Setting up environment variables..."

if [ ! -f ".env" ]; then
    print_info "Creating .env file from template..."
    cp .env.example .env
    
    # Generate secure keys
    MCP_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    # Update .env with generated keys
    sed -i.bak "s/your_32_char_encryption_key_here/$MCP_KEY/g" .env
    sed -i.bak "s/your_nextauth_secret_here/$NEXTAUTH_SECRET/g" .env
    rm .env.bak 2>/dev/null || true
    
    print_status "Environment file created with secure keys"
    print_warning "Please update .env with your OpenAI API key and other credentials"
else
    print_status "Environment file already exists"
fi

# Setup Next.js frontend
echo ""
echo "Setting up Next.js frontend..."

if [ ! -d "node_modules" ]; then
    print_info "Installing Node.js dependencies..."
    npm install
    print_status "Node.js dependencies installed"
else
    print_status "Node.js dependencies already installed"
fi

# Initialize database
print_info "Initializing database..."
npm run build > /dev/null 2>&1 || true
node -e "
const { initializeDatabase } = require('./lib/database.ts');
try {
  initializeDatabase();
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Database initialization failed:', error.message);
  process.exit(1);
}
" 2>/dev/null || print_warning "Database initialization may have failed - will be created on first run"

print_status "Database setup completed"

# Setup Python microservices
echo ""
echo "Setting up Python microservices..."

cd python_services

# Create virtual environment
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    print_status "Virtual environment created"
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
print_info "Installing Python dependencies..."
pip install --upgrade pip > /dev/null
pip install -r requirements.txt > /dev/null
print_status "Python dependencies installed"

# Create necessary directories
mkdir -p pids
mkdir -p logs

cd ..

# Create Docker setup (optional)
echo ""
echo "Setting up Docker configuration..."

if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    print_status "Docker and Docker Compose found"
    print_info "You can use 'docker-compose up --build' to run with Docker"
else
    print_warning "Docker not found. You can still run services manually."
fi

# Final setup
echo ""
echo "Final setup steps..."

# Make scripts executable
chmod +x python_services/start_services.sh
chmod +x python_services/stop_services.sh
chmod +x setup_agentverse.sh

print_status "Scripts made executable"

# Create systemd service files (Linux only)
if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v systemctl &> /dev/null; then
    print_info "Creating systemd service files..."
    
    cat > agentverse.service << EOF
[Unit]
Description=AgentVerse Marketplace
After=network.target redis.service

[Service]
Type=forking
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/python_services/start_services.sh
ExecStop=$(pwd)/python_services/stop_services.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    print_status "Systemd service file created (agentverse.service)"
    print_info "To install: sudo cp agentverse.service /etc/systemd/system/ && sudo systemctl enable agentverse"
fi

echo ""
echo "🎉 AgentVerse Marketplace setup completed!"
echo "=========================================="
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Update your .env file with required API keys:"
echo "   - OPENAI_API_KEY (required for AI features)"
echo "   - Stripe keys (for payments)"
echo ""
echo "2. Start the services:"
echo "   Option A - Manual start:"
echo "   $ npm run dev                              # Start Next.js (port 3000)"
echo "   $ cd python_services && ./start_services.sh  # Start Python services"
echo ""
echo "   Option B - Docker (if available):"
echo "   $ docker-compose up --build"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Admin Dashboard: http://localhost:3000/admin/microservices"
echo "   - API Health: http://localhost:3000/api/microservices/health"
echo ""
echo "4. Service endpoints:"
echo "   - Workflow Engine: http://localhost:8001/docs"
echo "   - Agent Runtime: http://localhost:8002/docs"
echo "   - MCP Server: http://localhost:8003/docs"
echo "   - A2A Service: http://localhost:8004/docs"
echo "   - AI Orchestrator: http://localhost:8005/docs"
echo ""
echo "📚 Documentation:"
echo "   - Main README: ./README.md"
echo "   - Python Services: ./python_services/README.md"
echo "   - Architecture Docs: ./docs/"
echo ""
echo "🔧 Management commands:"
echo "   - Start Python services: ./python_services/start_services.sh"
echo "   - Stop Python services: ./python_services/stop_services.sh"
echo "   - Health check: curl http://localhost:3000/api/microservices/health"
echo ""
print_status "Setup complete! Happy coding! 🚀"