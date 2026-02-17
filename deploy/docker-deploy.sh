#!/bin/bash

# Docker Hub Production Deployment Script
# This script builds and pushes the Docker image to Docker Hub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-lalalaala}"
DOCKER_IMAGE_NAME="playwright-cli-automation"
DOCKER_REGISTRY="docker.io"
VERSION="${VERSION:-latest}"

echo -e "${BLUE}===========================================\n${NC}"
echo -e "${BLUE}Docker Hub Production Deployment\n${NC}"
echo -e "${BLUE}===========================================\n${NC}"

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_message "$RED" "❌ Error: Docker is not installed"
    exit 1
fi

print_message "$GREEN" "✅ Docker is installed"

# Check if we're logged in to Docker Hub
if ! docker info | grep -q "Username: $DOCKER_USERNAME" 2>/dev/null; then
    print_message "$YELLOW" "⚠️  Not logged in to Docker Hub. Please login first."
    print_message "$BLUE" "To login, run: docker login -u $DOCKER_USERNAME"
    
    # Prompt for login
    read -p "Would you like to login now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker login -u "$DOCKER_USERNAME"
        if [ $? -ne 0 ]; then
            print_message "$RED" "❌ Docker login failed"
            exit 1
        fi
    else
        print_message "$RED" "❌ Deployment cancelled - Docker login required"
        exit 1
    fi
fi

print_message "$GREEN" "✅ Logged in to Docker Hub as $DOCKER_USERNAME"

# Build the Docker image
print_message "$BLUE" "\n📦 Building Docker image..."
docker build -t "${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:${VERSION}" .

if [ $? -ne 0 ]; then
    print_message "$RED" "❌ Docker build failed"
    exit 1
fi

print_message "$GREEN" "✅ Docker image built successfully"

# Tag image with additional tags if version is specified and not 'latest'
if [ "$VERSION" != "latest" ]; then
    print_message "$BLUE" "\n🏷️  Tagging image with version $VERSION..."
    docker tag "${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:${VERSION}" \
               "${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:latest"
fi

# Push to Docker Hub
print_message "$BLUE" "\n🚀 Pushing image to Docker Hub..."
docker push "${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:${VERSION}"

if [ $? -ne 0 ]; then
    print_message "$RED" "❌ Docker push failed"
    exit 1
fi

print_message "$GREEN" "✅ Image pushed: ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:${VERSION}"

# Push latest tag if version was specified
if [ "$VERSION" != "latest" ]; then
    docker push "${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:latest"
    print_message "$GREEN" "✅ Image pushed: ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:latest"
fi

# Show image info
print_message "$BLUE" "\n📊 Image Information:"
docker images | grep "${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}"

print_message "$GREEN" "\n✅ Deployment completed successfully!"
print_message "$BLUE" "\n📝 To pull and run this image on another machine:"
print_message "$BLUE" "   docker pull ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:${VERSION}"
print_message "$BLUE" "   docker run -d -p 3000:3000 --name playwright-automation ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:${VERSION}"

print_message "$BLUE" "\n📝 Or use docker-compose:"
print_message "$BLUE" "   docker-compose up -d"

echo -e "\n${BLUE}===========================================\n${NC}"
