# TinkyBink AAC Platform - Bluehost Deployment Guide

## 🔧 Pre-Deployment Requirements

### Bluehost Account Setup
- [ ] Verify Node.js is enabled in cPanel
- [ ] Ensure SSL certificate is active
- [ ] Set up custom domain (e.g., tinkybink.com)
- [ ] Create MySQL database for user data
- [ ] Set up email accounts for notifications

### Environment Variables Needed
Create `.env.production` file with:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/tinkybink_prod"

# Authentication
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key-here"

# Stripe (for payments)
STRIPE_PUBLISHABLE_KEY="pk_live_your_key"
STRIPE_SECRET_KEY="sk_live_your_key"

# AI Services
OPENAI_API_KEY="your-openai-key"

# Email Service
SMTP_HOST="mail.yourdomain.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASSWORD="your-email-password"

# Healthcare APIs
NPI_REGISTRY_API_KEY="your-npi-key"
```

## 📦 Build & Deploy Process

### Step 1: Optimize for Production
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Test the production build locally
npm start
```

### Step 2: Upload to Bluehost
Options for uploading:
1. **File Manager** (cPanel)
2. **FTP/SFTP** (FileZilla recommended)
3. **Git deployment** (if Bluehost supports it)

### Step 3: Database Setup
1. Create MySQL database in cPanel
2. Import any required schema
3. Set up database connection string
4. Test database connectivity

### Step 4: Domain Configuration
1. Point domain to hosting directory
2. Configure SSL certificate
3. Set up redirects (www to non-www or vice versa)
4. Test domain accessibility

## 🔒 Security Checklist

- [ ] Enable HTTPS redirect
- [ ] Set up proper file permissions (644 for files, 755 for directories)
- [ ] Configure CORS settings
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Configure backup system

## 🚀 Go-Live Checklist

- [ ] DNS propagation complete
- [ ] SSL certificate working
- [ ] All environment variables set
- [ ] Database connection working
- [ ] Email notifications working
- [ ] Payment processing working
- [ ] AI services responding
- [ ] Mobile responsiveness tested
- [ ] Analytics tracking active

## 📊 Post-Launch Monitoring

- [ ] Set up uptime monitoring
- [ ] Configure error logging
- [ ] Monitor server resources
- [ ] Track user registrations
- [ ] Monitor payment transactions
- [ ] Check AI service usage/costs

## 🔧 Troubleshooting Common Issues

### Node.js Not Working
- Enable Node.js in cPanel
- Check Node.js version compatibility
- Verify package.json scripts

### Database Connection Issues
- Verify connection string
- Check database user permissions
- Ensure database exists

### SSL Certificate Issues
- Force HTTPS in Next.js config
- Check certificate expiration
- Verify domain DNS settings

### Performance Issues
- Enable caching in cPanel
- Optimize images and assets
- Consider CDN setup
- Monitor database queries