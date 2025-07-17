## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring
- [ ] Docker/Deployment changes

## Testing
- [ ] I have tested this locally with Docker: `docker-compose up --build`
- [ ] Frontend tests pass: `cd frontend && npm test`
- [ ] Backend tests pass: `cd backend && go test ./...`
- [ ] Health endpoints respond correctly:
  - [ ] Backend: `curl http://localhost:8080/health`
  - [ ] Frontend: `curl http://localhost:4321/api/health`

## Deployment
- [ ] Changes are compatible with current AWS deployment
- [ ] Environment variables updated if needed
- [ ] Docker configuration updated if needed
- [ ] Database migrations included if needed

## Screenshots (if applicable)
Add screenshots of new features or UI changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Related Issues
Closes #(issue_number) (if applicable) 