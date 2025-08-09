#!/bin/bash

# TinkyBink Connect Pro Suite - Bluehost Deployment Setup Script
# Run this script to prepare your application for Bluehost deployment

set -e

echo "🚀 TinkyBink Connect Pro Suite - Bluehost Deployment Setup"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "next.config.js" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

print_info "Starting deployment preparation..."

# 1. Install dependencies
print_info "Installing dependencies..."
if npm install; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# 2. Type check
print_info "Running type check..."
if npm run type-check; then
    print_status "Type check passed"
else
    print_warning "Type check had issues, but continuing..."
fi

# 3. Lint check (non-blocking)
print_info "Running lint check..."
if npm run lint; then
    print_status "Lint check passed"
else
    print_warning "Lint check had issues, but continuing..."
fi

# 4. Build the application
print_info "Building production application..."
if npm run build; then
    print_status "Build completed successfully"
else
    print_error "Build failed - please fix errors before deploying"
    exit 1
fi

# 5. Create production environment file if it doesn't exist
if [ ! -f ".env.production" ]; then
    print_info "Creating .env.production from template..."
    cp .env.production.template .env.production
    print_warning "Please edit .env.production with your actual values"
    print_info "Required values to update:"
    echo "  - DATABASE_URL (your MySQL connection string)"
    echo "  - NEXTAUTH_URL (your domain URL)"
    echo "  - NEXTAUTH_SECRET (generate a 32-character secret)"
    echo "  - STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY"
    echo "  - OPENAI_API_KEY"
    echo "  - SMTP settings for your domain email"
else
    print_status ".env.production already exists"
fi

# 6. Create deployment package
print_info "Creating deployment package..."
DEPLOY_DIR="tinkybink-deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files for deployment
print_info "Copying files for deployment..."
echo "Copying build output..."
cp -r .next "$DEPLOY_DIR/"
echo "Copying static files..."
cp -r public "$DEPLOY_DIR/"
echo "Copying configuration files..."
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/" 2>/dev/null || true
cp next.config.js "$DEPLOY_DIR/"
cp .env.production "$DEPLOY_DIR/"

# Create a simple server.js for standalone deployment
cat > "$DEPLOY_DIR/server.js" << 'EOF'
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
  .once('error', (err) => {
    console.error(err)
    process.exit(1)
  })
  .listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
EOF

# Create package.json for production
cat > "$DEPLOY_DIR/package-production.json" << 'EOF'
{
  "name": "tinkybink-aac-platform",
  "version": "1.0.0",
  "description": "TinkyBink Connect Pro Suite - Production Build",
  "main": "server.js",
  "scripts": {
    "start": "NODE_ENV=production node server.js",
    "dev": "next dev",
    "build": "next build"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF

# Create .htaccess for Apache (Bluehost uses Apache)
cat > "$DEPLOY_DIR/.htaccess" << 'EOF'
# TinkyBink Connect Pro Suite - Apache Configuration

# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle Next.js routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.stripe.com https://api.openai.com; frame-src https://js.stripe.com;"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
EOF

# Create deployment instructions
cat > "$DEPLOY_DIR/DEPLOYMENT_INSTRUCTIONS.md" << 'EOF'
# TinkyBink Connect Pro Suite - Bluehost Deployment Instructions

## Files Included
- `.next/` - Built Next.js application
- `public/` - Static assets
- `server.js` - Production server
- `.env.production` - Environment variables (UPDATE WITH YOUR VALUES)
- `.htaccess` - Apache configuration
- `database-schema.sql` - MySQL database schema

## Deployment Steps

### 1. Database Setup
1. Log into your Bluehost cPanel
2. Go to MySQL Databases
3. Create a new database (e.g., `tinkybink_prod`)
4. Create a database user with full privileges
5. Import the `database-schema.sql` file

### 2. File Upload
1. Upload all files to your public_html directory (or subdirectory)
2. Ensure file permissions are set correctly:
   - Files: 644
   - Directories: 755

### 3. Environment Configuration
1. Edit `.env.production` with your actual values:
   - Update DATABASE_URL with your MySQL credentials
   - Set NEXTAUTH_URL to your domain
   - Add your Stripe, OpenAI, and email credentials
   - Generate secure secrets for NEXTAUTH_SECRET

### 4. Domain Configuration
1. Point your domain to the hosting directory
2. Ensure SSL certificate is active
3. Test HTTPS redirect

### 5. Node.js Setup (if supported)
1. Enable Node.js in cPanel
2. Set the startup file to `server.js`
3. Install dependencies: `npm install`
4. Start the application: `npm start`

### 6. Testing
1. Visit your domain
2. Test user registration/login
3. Test subscription flows
4. Verify email sending
5. Test payment processing

## Important Notes
- Update next.config.js redirect destination to your actual domain
- Ensure all API keys are properly set in environment variables
- Monitor error logs for any issues
- Set up regular database backups

## Support
If you encounter issues, check:
1. Bluehost error logs
2. Browser console for client-side errors
3. Database connection settings
4. File permissions
EOF

# Create ZIP file for easy upload
print_info "Creating deployment ZIP file..."
if command -v zip &> /dev/null; then
    zip -r "${DEPLOY_DIR}.zip" "$DEPLOY_DIR"
    print_status "Deployment package created: ${DEPLOY_DIR}.zip"
else
    print_warning "ZIP command not found. Manual upload required."
fi

print_status "Deployment preparation complete!"
echo ""
print_info "Next Steps:"
echo "1. Edit ${DEPLOY_DIR}/.env.production with your actual values"
echo "2. Create MySQL database in Bluehost cPanel"
echo "3. Import database-schema.sql into your database"
echo "4. Upload files to your hosting directory"
echo "5. Configure Node.js (if supported) or use static export"
echo "6. Test your deployment"
echo ""
print_info "Deployment package location: ./${DEPLOY_DIR}/"
if [ -f "${DEPLOY_DIR}.zip" ]; then
    print_info "ZIP file ready for upload: ./${DEPLOY_DIR}.zip"
fi
echo ""
print_status "Your TinkyBink Connect Pro Suite is ready for deployment! 🚀"