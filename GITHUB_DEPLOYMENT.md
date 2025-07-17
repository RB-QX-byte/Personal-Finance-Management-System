# GitHub Deployment Guide

This guide covers deploying your Personal Finance Management System to GitHub and setting up automated deployments to AWS.

## 🚀 Quick Start: GitHub Deployment

### 1. Create GitHub Repository

1. **Visit GitHub.com** and sign in
2. **Click "New Repository"** 
3. **Repository Settings:**
   ```
   Repository name: Personal-Finance-Management
   Description: Personal Finance Management System - Astro.js, Go, Supabase, Docker
   Visibility: Public (recommended) or Private
   Initialize: Don't add README, .gitignore, or license (we have them)
   ```

### 2. Push Your Code to GitHub

```bash
# Navigate to your project
cd Personal-Finance-Management-System

# Initialize git (if not done)
git init

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/Personal-Finance-Management.git

# Stage all files
git add .

# Initial commit
git commit -m "🚀 Initial commit: Personal Finance Management System

- ✅ Astro.js frontend with SSR
- ✅ Go backend with Gin framework  
- ✅ Supabase integration (auth + database)
- ✅ Docker containerization
- ✅ AWS deployment configurations
- ✅ GitHub Actions CI/CD pipelines"

# Push to GitHub
git push -u origin main
```

### 3. Verify Repository Setup

Visit your GitHub repository and ensure you see:
- ✅ All source code files
- ✅ Docker configuration files
- ✅ `.github/workflows/` directory with CI/CD pipelines
- ✅ Documentation files (README.md, aws-deployment.md, etc.)

## 🤖 Automated Deployment with GitHub Actions

### Step 1: Choose Your Deployment Strategy

We've included two deployment workflows:

| Workflow | File | Best For | Complexity |
|----------|------|----------|------------|
| **App Runner** | `deploy-aws-app-runner.yml` | Beginners | Low |
| **ECS Fargate** | `deploy-ecs.yml` | Production | High |

### Step 2: Configure GitHub Secrets

1. **Go to your repository** → **Settings** → **Secrets and variables** → **Actions**
2. **Click "New repository secret"**
3. **Add these secrets:**

#### Required for All Deployments:
```bash
AWS_ACCESS_KEY_ID
# Your AWS access key ID

AWS_SECRET_ACCESS_KEY  
# Your AWS secret access key

AWS_REGION
# Default: us-east-1
```

#### For App Runner Deployment:
```bash
APP_RUNNER_BACKEND_ARN
# ARN of your backend App Runner service
# Example: arn:aws:apprunner:us-east-1:123456789012:service/finance-backend/abc123

APP_RUNNER_FRONTEND_ARN
# ARN of your frontend App Runner service  
# Example: arn:aws:apprunner:us-east-1:123456789012:service/finance-frontend/def456
```

#### For ECS Deployment:
```bash
ECR_REPOSITORY_BACKEND
# Default: finance-backend

ECR_REPOSITORY_FRONTEND
# Default: finance-frontend

ECS_CLUSTER
# Default: finance-cluster

ECS_SERVICE_BACKEND
# Default: finance-backend-service

ECS_SERVICE_FRONTEND
# Default: finance-frontend-service
```

### Step 3: Create AWS Resources First

#### Option A: App Runner (Recommended)

1. **Go to AWS App Runner Console**
2. **Create Backend Service:**
   - Source: GitHub repository
   - Directory: `backend/`
   - Build command: `docker build -t backend .`
   - Start command: `./main`
   - Port: `8080`
   - Add environment variables from `env.example`

3. **Create Frontend Service:**
   - Source: Same GitHub repository
   - Directory: `frontend/`
   - Build command: `npm run build`
   - Start command: `node ./dist/server/entry.mjs`
   - Port: `4321`
   - Add environment variables

4. **Copy the ARNs** and add them to GitHub Secrets

#### Option B: ECS Fargate

1. **Create ECR Repositories:**
   ```bash
   aws ecr create-repository --repository-name finance-backend
   aws ecr create-repository --repository-name finance-frontend
   ```

2. **Create ECS Cluster, Task Definitions, and Services**
   (See `aws-deployment.md` for detailed instructions)

### Step 4: Enable GitHub Actions

1. **Go to repository** → **Actions** tab
2. **You'll see workflows:**
   - "Deploy to AWS App Runner"
   - "Deploy to Amazon ECS"
3. **Choose and enable** the one matching your AWS setup

### Step 5: Trigger Deployment

```bash
# Make any change to trigger deployment
echo "# Deployment trigger" >> README.md
git add .
git commit -m "🚀 Trigger initial deployment"
git push origin main
```

**Monitor deployment** in the Actions tab of your GitHub repository.

## 🌐 GitHub Codespaces (Cloud Development)

### Enable Cloud Development

1. **Go to your repository** → **Code** → **Codespaces**
2. **Click "Create codespace on main"**
3. **Wait for setup** (automatically installs Go, Node.js, Docker)

### Development in Codespaces

```bash
# Set up environment
cp env.example .env
# Edit .env with your Supabase credentials

# Test with Docker
docker-compose up --build

# Access via forwarded ports:
# Frontend: https://YOUR-CODESPACE-4321.preview.app.github.dev
# Backend: https://YOUR-CODESPACE-8080.preview.app.github.dev
```

## 🔧 GitHub Repository Management

### Branch Protection Rules

1. **Go to Settings** → **Branches**
2. **Add rule for `main` branch:**
   ```
   ✅ Require a pull request before merging
   ✅ Require status checks to pass before merging
   ✅ Require up-to-date branches before merging
   ✅ Include administrators
   ```

### Issue Templates

We've included templates for:
- 🐛 **Bug reports** (`.github/ISSUE_TEMPLATE/bug_report.md`)
- ✨ **Feature requests** (`.github/ISSUE_TEMPLATE/feature_request.md`)

### Pull Request Template

Includes checklist for:
- ✅ Docker testing
- ✅ Health check verification
- ✅ Deployment compatibility
- ✅ Documentation updates

## 📊 Monitoring Deployments

### GitHub Actions Status

- **View deployment status** in Actions tab
- **Get deployment URLs** from action logs
- **Monitor build times** and success rates

### AWS Integration

- **CloudWatch logs** for application monitoring
- **App Runner/ECS dashboards** for service health
- **Cost monitoring** in AWS Billing dashboard

## 🚨 Troubleshooting

### Common Issues

#### 1. GitHub Actions Failing
```bash
# Check secrets are set correctly
Repository → Settings → Secrets and variables → Actions

# Verify AWS permissions
aws sts get-caller-identity
```

#### 2. App Runner Build Failing
```bash
# Check build logs in App Runner console
# Verify Dockerfile syntax
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend
```

#### 3. Environment Variables Not Working
```bash
# Update App Runner service configuration
# Re-deploy after adding missing variables
```

### Getting Help

1. **Check GitHub Actions logs** for detailed error messages
2. **Review AWS CloudWatch logs** for runtime issues
3. **Use GitHub Issues** for community support
4. **Check documentation** in `aws-deployment.md`

## 🎯 Next Steps

After successful deployment:

1. **Set up custom domain** in Route 53
2. **Configure SSL certificates** with ACM
3. **Set up monitoring alerts** in CloudWatch
4. **Implement blue/green deployments**
5. **Add performance monitoring** tools

## 🔗 Quick Links

- **Repository**: https://github.com/YOUR_USERNAME/Personal-Finance-Management
- **Actions**: https://github.com/YOUR_USERNAME/Personal-Finance-Management/actions
- **Issues**: https://github.com/YOUR_USERNAME/Personal-Finance-Management/issues
- **AWS Console**: https://console.aws.amazon.com/

Happy deploying! 🚀 