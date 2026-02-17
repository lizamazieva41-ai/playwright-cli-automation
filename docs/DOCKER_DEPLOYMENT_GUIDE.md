# Docker Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Playwright CLI Automation application to production using Docker.

**Target Environment:** Docker Production  
**Docker Registry:** Docker Hub  
**Username:** lalalaala  
**Image Name:** playwright-cli-automation

---

## Prerequisites

### Required Software
- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- curl (for testing)
- Git (for repository access)

### System Requirements
- **Operating System:** Linux (Ubuntu 20.04+), macOS, or Windows with WSL2
- **CPU:** 2 cores minimum (4 cores recommended)
- **RAM:** 2GB minimum (4GB recommended)
- **Storage:** 10GB free space minimum
- **Network:** Stable internet connection

---

## Step 1: Docker Hub Authentication

### Login to Docker Hub

Use the provided credentials to login to Docker Hub:

```bash
docker login -u lalalaala
```

When prompted for password, enter your Docker Hub Personal Access Token (PAT).

**Note:** Use the Docker PAT provided by your administrator. Never commit credentials to source control.

**Verify login:**
```bash
docker info | grep Username
```

You should see: `Username: lalalaala`

---

## Step 2: Build Docker Image

### Build Locally

Navigate to the project directory:

```bash
cd /path/to/playwright-cli-automation
```

Build the Docker image:

```bash
docker build -t lalalaala/playwright-cli-automation:latest .
```

**Build with version tag (optional):**
```bash
docker build -t lalalaala/playwright-cli-automation:v1.0.1 .
```

### Verify Build

Check that the image was created successfully:

```bash
docker images | grep playwright-cli-automation
```

Expected output:
```
lalalaala/playwright-cli-automation   latest    <image-id>   <time>   <size>
```

---

## Step 3: Test Locally

Before pushing to Docker Hub, test the image locally:

### Start Container

```bash
docker run -d \
  --name playwright-automation-test \
  -p 3000:3000 \
  -e NODE_ENV=production \
  lalalaala/playwright-cli-automation:latest
```

### Verify Health

Wait 10-15 seconds for the container to initialize, then check health:

```bash
# Check container status
docker ps

# Test health endpoint
curl http://localhost:3000/health

# Test deep health check (launches browser)
curl http://localhost:3000/health?deep=1
```

### View Logs

```bash
docker logs playwright-automation-test
```

### Stop Test Container

```bash
docker stop playwright-automation-test
docker rm playwright-automation-test
```

---

## Step 4: Push to Docker Hub

### Push Image

Push the image to Docker Hub:

```bash
docker push lalalaala/playwright-cli-automation:latest
```

**Push versioned image (if applicable):**
```bash
docker push lalalaala/playwright-cli-automation:v1.0.1
```

### Verify Push

Check Docker Hub to verify the image was pushed successfully:

```bash
# List repositories
curl -s https://hub.docker.com/v2/repositories/lalalaala/ | grep playwright-cli-automation
```

Or visit: https://hub.docker.com/r/lalalaala/playwright-cli-automation

---

## Step 5: Deploy with Docker Compose

### Configuration

The project includes a `docker-compose.yml` file for easy deployment.

**Review configuration:**

```bash
cat docker-compose.yml
```

### Environment Variables

Copy and configure environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure production settings:
- SMTP settings for email notifications
- Slack webhook URL (if using)
- Proxy list (if needed)
- Concurrency settings

### Start Services

Deploy the application:

```bash
docker-compose up -d
```

### Verify Deployment

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Check health
curl http://localhost:3000/health
```

---

## Step 6: Production Configuration

### Volume Mounts

The Docker Compose configuration mounts three volumes for data persistence:

- `./data/sessions` - Browser session storage
- `./data/output` - Scraped data output
- `./data/logs` - Application logs

**Ensure these directories exist and have proper permissions:**

```bash
mkdir -p data/sessions data/output data/logs
chmod 755 data/sessions data/output data/logs
```

### Resource Limits

The docker-compose.yml sets resource limits:
- CPU: 1-2 cores
- Memory: 1-2GB

Adjust these in `docker-compose.yml` based on your needs:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
```

### Network Configuration

The application uses a dedicated Docker network (`playwright-network`) for isolation.

**Verify network:**
```bash
docker network ls | grep playwright-network
```

---

## Step 7: Monitoring and Maintenance

### Health Monitoring

Set up automated health checks:

```bash
# Create monitoring script
cat > /etc/cron.d/playwright-health << EOF
*/5 * * * * root curl -f http://localhost:3000/health || systemctl restart docker-compose
EOF
```

### View Logs

```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service logs
docker logs playwright-automation-prod
```

### Resource Monitoring

Monitor container resource usage:

```bash
# Real-time stats
docker stats playwright-automation-prod

# Single snapshot
docker stats --no-stream playwright-automation-prod
```

### Log Rotation

Configure log rotation to prevent disk space issues:

```bash
# Configure Docker log driver
# Add to docker-compose.yml:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## Step 8: Scaling and Updates

### Scaling

To run multiple instances (if needed):

```bash
docker-compose up -d --scale playwright-automation=3
```

**Note:** You'll need to configure a load balancer for multiple instances.

### Update Deployment

To update to a new version:

```bash
# Pull latest image
docker-compose pull

# Restart with new image
docker-compose down
docker-compose up -d

# Or rolling update
docker-compose up -d --no-deps --build playwright-automation
```

### Rollback

If an update causes issues:

```bash
# Stop current deployment
docker-compose down

# Pull specific version
docker pull lalalaala/playwright-cli-automation:v1.0.0

# Update docker-compose.yml to use specific version
# Then restart
docker-compose up -d
```

---

## Step 9: Backup and Recovery

### Backup Data Volumes

Regularly backup important data:

```bash
# Backup sessions
tar -czf sessions-backup-$(date +%Y%m%d).tar.gz data/sessions/

# Backup output
tar -czf output-backup-$(date +%Y%m%d).tar.gz data/output/

# Backup logs (optional)
tar -czf logs-backup-$(date +%Y%m%d).tar.gz data/logs/
```

### Restore from Backup

```bash
# Stop container
docker-compose down

# Restore data
tar -xzf sessions-backup-YYYYMMDD.tar.gz -C ./
tar -xzf output-backup-YYYYMMDD.tar.gz -C ./

# Restart container
docker-compose up -d
```

---

## Step 10: Security Best Practices

### Secrets Management

**Never** commit sensitive data to the repository:

- Use `.env` files (excluded by `.gitignore`)
- Use Docker secrets for production
- Rotate credentials regularly

### Network Security

- Use firewall rules to restrict access to port 3000
- Consider using a reverse proxy (nginx) with SSL
- Implement rate limiting

### Image Security

Regularly scan images for vulnerabilities:

```bash
# Using Docker scan
docker scan lalalaala/playwright-cli-automation:latest

# Using Trivy
trivy image lalalaala/playwright-cli-automation:latest
```

### Update Dependencies

Keep base images and dependencies updated:

```bash
# Rebuild with latest base image
docker build --no-cache -t lalalaala/playwright-cli-automation:latest .
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker logs playwright-automation-prod
```

**Common issues:**
- Port 3000 already in use: Change port in docker-compose.yml
- Volume mount permissions: Check directory permissions
- Insufficient resources: Increase Docker resources

### Health Check Fails

**Verify endpoint:**
```bash
docker exec playwright-automation-prod curl http://localhost:3000/health
```

**Check:**
- Container is fully started (wait 15-30 seconds)
- Node.js process is running
- Health server is configured correctly

### Browser Automation Issues

**Test browser launch:**
```bash
docker exec playwright-automation-prod node src/index.js health --once --deep
```

**Common issues:**
- Insufficient memory: Increase container memory
- Missing dependencies: Rebuild with `--no-cache`
- Display issues: Verify headless mode is enabled

### High Resource Usage

**Monitor resources:**
```bash
docker stats playwright-automation-prod
```

**Optimize:**
- Reduce concurrency (`DEFAULT_CONCURRENCY` in .env)
- Lower viewport resolution
- Enable headless mode
- Adjust resource limits in docker-compose.yml

---

## Quick Reference Commands

### Container Management
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# View status
docker-compose ps

# View logs
docker-compose logs -f
```

### Testing
```bash
# Health check
curl http://localhost:3000/health

# Deep health check
curl http://localhost:3000/health?deep=1

# Execute command in container
docker exec -it playwright-automation-prod /bin/bash

# Test CLI commands
docker exec playwright-automation-prod node src/index.js session list
```

### Maintenance
```bash
# Clean up old images
docker image prune -a

# Clean up volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

---

## Support and Resources

### Documentation
- Main README: [README.md](../README.md)
- Acceptance Testing Plan: [ACCEPTANCE_TESTING_PLAN.md](ACCEPTANCE_TESTING_PLAN.md)
- Project Repository: https://github.com/lizamazieva41-ai/playwright-cli-automation

### Docker Resources
- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Docker Hub: https://hub.docker.com/

### Getting Help
- Open an issue on GitHub
- Check existing issues and discussions
- Review logs for error messages

---

## Automated Deployment Script

For convenience, use the automated deployment script:

```bash
# Build and push to Docker Hub
./deploy/docker-deploy.sh

# Run acceptance tests
./tests/acceptance/run-acceptance-tests.sh
```

---

**Document Version:** 1.0  
**Last Updated:** February 17, 2026  
**Maintained by:** DevOps Team
