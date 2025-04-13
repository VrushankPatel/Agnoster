#!/bin/bash

# Agnoster build script
# This script will set up the Agnoster Kubernetes namespace management system

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${GREEN}Agnoster - Kubernetes Namespace Management System${NC}"
echo -e "${BLUE}===================================================${NC}"
echo

# Check if running with appropriate permissions
if [[ $EUID -ne 0 ]] && [[ ! -z "$REPL_OWNER" ]]; then
    echo -e "${YELLOW}Note: Running in Replit environment.${NC}"
elif [[ $EUID -ne 0 ]]; then
    echo -e "${YELLOW}Note: This script is not running with root privileges.${NC}"
    echo -e "${YELLOW}Some operations may fail.${NC}"
    echo
fi

# Make script directory the working directory
cd "$(dirname "$0")"

# Check Python version
echo -e "${GREEN}Checking Python version...${NC}"
if command -v python3 &>/dev/null; then
    PYTHON_CMD=python3
elif command -v python &>/dev/null; then
    PYTHON_CMD=python
else
    echo -e "${RED}Python not found. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

# Check Python version
python_version=$($PYTHON_CMD -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${GREEN}Python version: $python_version${NC}"

# Ensure pip is installed
echo -e "${GREEN}Checking pip installation...${NC}"
if ! command -v pip &>/dev/null && ! command -v pip3 &>/dev/null; then
    echo -e "${YELLOW}pip not found. Installing pip...${NC}"
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    $PYTHON_CMD get-pip.py
    rm get-pip.py
fi

# Determine pip command
if command -v pip3 &>/dev/null; then
    PIP_CMD=pip3
else
    PIP_CMD=pip
fi

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
$PIP_CMD install -r dependencies.txt

# Check for PostgreSQL database
db_url=$DATABASE_URL
if [ -z "${db_url}" ]; then
    echo -e "${YELLOW}Warning: DATABASE_URL environment variable not set.${NC}"
    echo -e "${YELLOW}Using SQLite database instead.${NC}"
    
    # Create instance directory if it doesn't exist
    mkdir -p instance
    
    # Using absolute path for SQLite to avoid permission issues
    CURRENT_DIR=$(pwd)
    export DATABASE_URL="sqlite:///${CURRENT_DIR}/instance/agnoster.db"
    echo -e "${GREEN}SQLite database path: ${DATABASE_URL}${NC}"
else
    echo -e "${GREEN}Using PostgreSQL database at: ${DATABASE_URL}${NC}"
fi

# Initialize the database
echo -e "${GREEN}Initializing database...${NC}"
$PYTHON_CMD -c "from app import app, db; from models import User, Config; app.app_context().push(); db.create_all(); Config.query.first() or db.session.add(Config(shutdown_threshold=14, monitoring_interval=5)) and db.session.commit(); print('Database initialized successfully');"

# Check if admin user exists, if not create it
echo -e "${GREEN}Checking for admin user...${NC}"
ADMIN_EXISTS=$($PYTHON_CMD -c "from app import app, db; from models import User; from werkzeug.security import generate_password_hash; app.app_context().push(); admin = User.query.filter_by(username='admin').first(); created = False; if not admin: admin = User(username='admin', password_hash=generate_password_hash('admin'), is_admin=True); db.session.add(admin); db.session.commit(); created = True; print('created' if created else 'exists');")

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