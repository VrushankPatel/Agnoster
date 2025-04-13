#!/bin/bash

# Agnoster - Kubernetes Namespace Management System
# Build and deployment script

set -e

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}Agnoster - Kubernetes Namespace Management System${NC}"
echo -e "${BLUE}===================================================${NC}"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3 to continue.${NC}"
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}pip3 is not installed. Please install pip3 to continue.${NC}"
    exit 1
fi

# Check if virtual environment package is installed
if ! python3 -c "import venv" &> /dev/null; then
    echo -e "${YELLOW}Python venv module not found. Installing...${NC}"
    pip3 install venv
fi

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${GREEN}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate the virtual environment
echo -e "${GREEN}Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
pip install -r dependencies.txt

# Check for PostgreSQL database
if [ -z "${DATABASE_URL}" ]; then
    echo -e "${YELLOW}Warning: DATABASE_URL environment variable not set.${NC}"
    echo -e "${YELLOW}Using SQLite database instead.${NC}"
    export DATABASE_URL="sqlite:///instance/agnoster.db"
else
    echo -e "${GREEN}Using PostgreSQL database at: ${DATABASE_URL}${NC}"
fi

# Initialize the database
echo -e "${GREEN}Initializing database...${NC}"
python -c "from app import app, db; from models import User, Config; app.app_context().push(); db.create_all(); Config.query.first() or db.session.add(Config(shutdown_threshold=14, monitoring_interval=5)) and db.session.commit(); print('Database initialized successfully');"

# Check if admin user exists, if not create it
echo -e "${GREEN}Checking for admin user...${NC}"
ADMIN_EXISTS=$(python -c "from app import app, db; from models import User; from werkzeug.security import generate_password_hash; app.app_context().push(); admin = User.query.filter_by(username='admin').first(); created = False; if not admin: admin = User(username='admin', password_hash=generate_password_hash('admin'), is_admin=True); db.session.add(admin); db.session.commit(); created = True; print('created' if created else 'exists');")

if [ "$ADMIN_EXISTS" == "created" ]; then
    echo -e "${GREEN}Admin user created with default credentials:${NC}"
    echo -e "${GREEN}Username: admin${NC}"
    echo -e "${GREEN}Password: admin${NC}"
    echo -e "${YELLOW}Please change the default password after first login.${NC}"
else
    echo -e "${GREEN}Admin user already exists.${NC}"
fi

# Set the port
export PORT=${PORT:-5000}

echo -e "${GREEN}Setup complete. You can now start the application.${NC}"
echo -e "${GREEN}To start the application, run:${NC}"
echo -e "${BLUE}    gunicorn --bind 0.0.0.0:$PORT --reuse-port --reload main:app${NC}"
echo -e "${GREEN}or use the Workflow in Replit.${NC}"

# Optional: Start the application automatically
if [ "$1" == "--start" ]; then
    echo -e "${GREEN}Starting Agnoster...${NC}"
    gunicorn --bind 0.0.0.0:$PORT --reuse-port --reload main:app
fi

echo -e "${BLUE}===================================================${NC}"