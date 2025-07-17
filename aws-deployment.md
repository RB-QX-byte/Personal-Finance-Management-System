# AWS Deployment Guide for Personal Finance Management App

## Overview
This guide provides multiple deployment options for your Personal Finance Management application on AWS, ranging from simple to advanced.

## Prerequisites
- AWS CLI installed and configured
- Docker installed locally
- Your Supabase project URL and API keys

## Environment Variables Required
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration
DATABASE_URL=your_supabase_postgres_connection_string
JWT_SECRET=your_jwt_secret
PORT=8080
GIN_MODE=release
```

## Option 1: AWS App Runner (Recommended for Beginners)

### Advantages
- Minimal configuration required
- Automatic scaling
- Built-in load balancing
- Easy CI/CD integration
- No container orchestration needed

### Steps

#### 1. Push Code to GitHub/GitLab
```bash
git add .
git commit -m "Add Docker configuration for AWS deployment"
git push origin main
```

#### 2. Deploy Backend with App Runner
1. Go to AWS App Runner console
2. Click "Create service"
3. Choose "Source code repository"
4. Connect your GitHub/GitLab repository
5. Configure:
   - Repository: `your-repo`
   - Branch: `main`
   - Source directory: `backend`
   - Build command: `docker build -t backend .`
   - Start command: `./main`
   - Port: `8080`
6. Add environment variables (see list above)
7. Create service

#### 3. Deploy Frontend with App Runner
1. Create another App Runner service
2. Configure:
   - Repository: `your-repo`
   - Branch: `main`
   - Source directory: `frontend`
   - Build command: `npm run build`
   - Start command: `node ./dist/server/entry.mjs`
   - Port: `4321`
3. Add environment variables
4. Set `BACKEND_URL` to your backend App Runner URL

### Cost Estimate
- **App Runner**: ~$25-50/month per service (depending on usage)
- **Total**: ~$50-100/month

## Option 2: AWS Lambda + API Gateway (Serverless)

### Advantages
- Pay per request
- Automatic scaling
- No server management
- Cost-effective for low-medium traffic

### Backend Deployment

#### 1. Install Serverless Framework
```bash
npm install -g serverless
npm install serverless-go-plugin
```

#### 2. Create serverless.yml for Backend
```yaml
# Create this in backend/serverless.yml
service: finance-backend

provider:
  name: aws
  runtime: go1.x
  region: us-east-1
  environment:
    DATABASE_URL: ${env:DATABASE_URL}
    SUPABASE_URL: ${env:SUPABASE_URL}
    SUPABASE_ANON_KEY: ${env:SUPABASE_ANON_KEY}
    JWT_SECRET: ${env:JWT_SECRET}

functions:
  api:
    handler: bin/main
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-go-plugin
```

#### 3. Modify Go Main for Lambda
You'll need to adapt your main.go to work with AWS Lambda using the aws-lambda-go library.

### Frontend Deployment
For the SSR Astro.js frontend, you can use:
- **AWS Amplify** (with SSR support)
- **Vercel** (simpler alternative)

## Option 3: Amazon ECS with Fargate (Production Ready)

### Advantages
- Full container orchestration
- Blue/green deployments
- Service discovery
- Auto-scaling
- Better for production workloads

### Steps

#### 1. Create ECR Repositories
```bash
# Create repositories
aws ecr create-repository --repository-name finance-backend
aws ecr create-repository --repository-name finance-frontend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
```

#### 2. Build and Push Images
```bash
# Backend
cd backend
docker build -t finance-backend .
docker tag finance-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/finance-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/finance-backend:latest

# Frontend
cd ../frontend
docker build -t finance-frontend .
docker tag finance-frontend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/finance-frontend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/finance-frontend:latest
```

#### 3. Create ECS Task Definitions and Services
Use AWS CLI or Console to create ECS cluster, task definitions, and services.

### Cost Estimate
- **ECS Fargate**: ~$30-60/month per service
- **Application Load Balancer**: ~$20/month
- **Total**: ~$80-140/month

## Option 4: Traditional EC2 with Docker Compose

### Advantages
- Full control
- Cost-effective for consistent traffic
- Easy to understand and debug

### Steps

#### 1. Launch EC2 Instance
- Instance type: t3.small or t3.medium
- Security groups: Allow HTTP (80), HTTPS (443), SSH (22)
- Attach Elastic IP

#### 2. Install Docker and Docker Compose
```bash
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 3. Deploy Application
```bash
# Clone repository
git clone your-repository
cd Personal-Finance-Management-System

# Create .env file with your environment variables
nano .env

# Deploy
docker-compose up -d
```

#### 4. Setup Nginx Reverse Proxy (Optional)
Create nginx.conf for better production setup with SSL.

### Cost Estimate
- **EC2 t3.small**: ~$15/month
- **Elastic IP**: ~$3.65/month
- **Total**: ~$20/month

## Option 5: AWS Amplify (Frontend Only)

For just the frontend, AWS Amplify provides excellent support for SSR frameworks:

### Steps
1. Go to AWS Amplify console
2. Connect your repository
3. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: frontend/dist
       files:
         - '**/*'
   ```

## Recommended Architecture

For production, I recommend:

```
Internet → CloudFront → ALB → ECS Services (Frontend + Backend)
                              ↓
                         Supabase (Database)
```

## Security Considerations

1. **Environment Variables**: Use AWS Systems Manager Parameter Store or AWS Secrets Manager
2. **VPC**: Deploy in private subnets with NAT Gateway
3. **Security Groups**: Restrict access to necessary ports only
4. **SSL/TLS**: Use AWS Certificate Manager for HTTPS
5. **WAF**: Consider AWS WAF for additional protection

## Monitoring and Logging

1. **CloudWatch**: For application logs and metrics
2. **X-Ray**: For distributed tracing
3. **CloudWatch Dashboards**: For monitoring
4. **SNS Alerts**: For critical issues

## CI/CD Pipeline

Consider setting up:
1. **GitHub Actions** or **AWS CodePipeline**
2. **Automated testing**
3. **Blue/green deployments**
4. **Rollback strategies**

Choose the option that best fits your experience level, budget, and scalability requirements. Start with Option 1 (App Runner) for simplicity, then migrate to Option 3 (ECS) as you scale. 