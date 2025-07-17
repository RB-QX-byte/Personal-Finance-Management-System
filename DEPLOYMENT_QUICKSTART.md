# Quick Start: Deploy to AWS

This guide will get your Personal Finance Management app deployed to AWS in under 30 minutes using the simplest approach.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Supabase Project** already set up
3. **GitHub Repository** with your code
4. **Local Environment** with Docker installed

## Option 1: AWS App Runner (Fastest & Easiest)

### Step 1: Prepare Your Environment

1. Copy environment template:
   ```bash
   cp env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   # ... etc
   ```

### Step 2: Test Locally with Docker

```bash
# Build and test both services
docker-compose up --build

# Test endpoints
curl http://localhost:8080/health  # Backend health check
curl http://localhost:4321         # Frontend
```

### Step 3: Push to GitHub

```bash
git add .
git commit -m "Add Docker configuration for AWS deployment"
git push origin main
```

### Step 4: Deploy Backend to App Runner

1. **Go to AWS Console → App Runner**
2. **Click "Create service"**
3. **Configure Source:**
   - Source: "Source code repository"
   - Repository provider: GitHub
   - Repository: Select your repo
   - Branch: main
   - Source directory: `backend`
   
4. **Configure Build:**
   ```
   Build command: docker build -t backend .
   Start command: ./main
   Port: 8080
   ```

5. **Add Environment Variables:**
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   DATABASE_URL=your_postgres_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=8080
   GIN_MODE=release
   ```

6. **Create Service** (takes ~5-10 minutes)

7. **Note the Service URL** (e.g., `https://abc123.us-east-1.awsapprunner.com`)

### Step 5: Deploy Frontend to App Runner

1. **Create another App Runner service**
2. **Configure Source:**
   - Repository: Same repo
   - Source directory: `frontend`
   
3. **Configure Build:**
   ```
   Build command: npm run build
   Start command: node ./dist/server/entry.mjs
   Port: 4321
   ```

4. **Add Environment Variables:**
   ```
   PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   BACKEND_URL=https://your-backend-service-url.awsapprunner.com
   ```

5. **Create Service**

### Step 6: Configure CORS (Important!)

Update your Go backend to allow requests from your frontend domain:

```go
// In your main.go or wherever CORS is configured
c := cors.New(cors.Options{
    AllowedOrigins: []string{
        "http://localhost:4321",
        "https://your-frontend-service.awsapprunner.com", // Add this
    },
    AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowedHeaders: []string{"*"},
    AllowCredentials: true,
})
```

Redeploy the backend after this change.

### Step 7: Test Your Deployment

Visit your frontend URL and test:
- [ ] Login/Register functionality
- [ ] Adding transactions
- [ ] Budget creation
- [ ] Dashboard loads correctly

## Estimated Costs

- **Backend App Runner**: ~$25-40/month
- **Frontend App Runner**: ~$25-40/month
- **Total**: ~$50-80/month (scales with usage)

## Troubleshooting

### Backend Issues
- Check CloudWatch logs in AWS Console
- Verify environment variables are set correctly
- Test backend URL directly: `https://your-backend.awsapprunner.com/health`

### Frontend Issues
- Check that `BACKEND_URL` points to your backend service
- Verify Supabase configuration
- Check browser console for CORS errors

### Database Issues
- Ensure Supabase database is accessible from AWS
- Check connection string format
- Verify database migrations are applied

## Next Steps

Once your basic deployment is working:

1. **Set up CI/CD** using the included GitHub Actions workflows
2. **Configure a custom domain** using Route 53 and CloudFront
3. **Set up monitoring** with CloudWatch dashboards
4. **Consider migrating to ECS** for production scaling

## Alternative Deployment Options

If App Runner doesn't meet your needs:

- **AWS Lambda + API Gateway**: Serverless, pay-per-request
- **Amazon ECS with Fargate**: Full container orchestration
- **EC2 with Docker Compose**: Maximum control, lowest cost
- **AWS Amplify**: Frontend-only option

See `aws-deployment.md` for detailed instructions on these options.

## Support

If you encounter issues:
1. Check AWS CloudWatch logs
2. Review the detailed deployment guide in `aws-deployment.md`
3. Ensure all environment variables are correctly set
4. Test locally with Docker first

Happy deploying! 🚀 