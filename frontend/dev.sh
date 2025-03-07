#!/bin/bash
# Next.js Development Environment Helper Script

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display usage information
show_usage() {
  echo -e "${YELLOW}Next.js Development Environment Helper${NC}"
  echo "Usage: ./dev.sh [command]"
  echo ""
  echo "Commands:"
  echo "  start       - Start the development environment"
  echo "  stop        - Stop the development environment"
  echo "  restart     - Restart the development environment"
  echo "  logs        - Show logs from the development container"
  echo "  shell       - Open a shell in the development container"
  echo "  install     - Install a new npm package in the development container"
  echo "  build       - Run a development build"
  echo "  test        - Run tests in the development container"
  echo "  clean       - Remove all containers and volumes"
}

# Check if docker is installed
if ! command -v docker &> /dev/null; then
  echo "Docker is not installed. Please install Docker first."
  exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
  echo "Docker Compose is not installed. Please install Docker Compose first."
  exit 1
fi

# Execute command based on the first argument
case "$1" in
  start)
    echo -e "${GREEN}Starting development environment...${NC}"
    docker-compose up -d
    docker-compose logs -f
    ;;
  
  stop)
    echo -e "${GREEN}Stopping development environment...${NC}"
    docker-compose down
    ;;
  
  restart)
    echo -e "${GREEN}Restarting development environment...${NC}"
    docker-compose down
    docker-compose up -d
    docker-compose logs -f
    ;;
  
  logs)
    echo -e "${GREEN}Showing logs...${NC}"
    docker-compose logs -f
    ;;
  
  shell)
    echo -e "${GREEN}Opening shell in development container...${NC}"
    docker-compose exec nextjs-dev /bin/bash
    ;;
  
  install)
    if [ -z "$2" ]; then
      echo "Please specify a package to install"
      echo "Usage: ./dev.sh install [package-name]"
      exit 1
    fi
    echo -e "${GREEN}Installing package $2...${NC}"
    docker-compose exec nextjs-dev npm install "$2"
    ;;
  
  build)
    echo -e "${GREEN}Running development build...${NC}"
    docker-compose exec nextjs-dev npm run build
    ;;
  
  test)
    echo -e "${GREEN}Running tests...${NC}"
    docker-compose exec nextjs-dev npm test
    ;;
  
  clean)
    echo -e "${YELLOW}Removing all containers and volumes...${NC}"
    docker-compose down -v
    echo -e "${GREEN}Environment cleaned successfully${NC}"
    ;;
  
  *)
    show_usage
    exit 1
    ;;
esac
