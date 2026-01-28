# Deployment Guide

## Deploying the Backend

### Option 1: Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku Account** at https://www.heroku.com

3. **Login to Heroku**
   ```bash
   heroku login
   ```

4. **Create Heroku App**
   ```bash
   cd backend
   heroku create your-app-name
   ```

5. **Create Procfile**
   Create `Procfile` in backend directory:
   ```
   web: node server.js
   ```

6. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_atlas_url
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set PORT=80
   ```

7. **Deploy**
   ```bash
   git push heroku main
   ```

8. **Monitor Logs**
   ```bash
   heroku logs --tail
   ```

### Option 2: Deploy to AWS

1. **Create EC2 Instance**
   - Choose Ubuntu 20.04 LTS
   - Configure security groups to allow ports 80, 443, 5000

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install MongoDB**
   ```bash
   sudo apt-get install -y mongodb
   sudo systemctl start mongodb
   ```

5. **Clone and Setup**
   ```bash
   git clone your-repo-url
   cd two-wheeler-maintenance/backend
   npm install
   ```

6. **Create .env file**
   ```bash
   sudo nano .env
   ```

7. **Install PM2**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js
   pm2 startup
   pm2 save
   ```

### Option 3: Deploy Using Docker

1. **Create Dockerfile** in backend:
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

2. **Build Docker Image**
   ```bash
   docker build -t two-wheeler-backend .
   ```

3. **Run Docker Container**
   ```bash
   docker run -p 5000:5000 \
     -e MONGODB_URI=your_mongodb_url \
     -e JWT_SECRET=your_secret \
     two-wheeler-backend
   ```

## Deploying the Frontend

### Option 1: Deploy to Netlify

1. **Build the Project**
   ```bash
   cd frontend
   npm run build
   ```

2. **Connect GitHub to Netlify**
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Connect your GitHub repo
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Set Environment Variables**
   - In Netlify settings, add:
   - `REACT_APP_API_URL=https://your-backend-url/api`

4. **Deploy**
   - Netlify will auto-deploy on every push to main

### Option 2: Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variables**
   - Add `REACT_APP_API_URL` in Vercel project settings

### Option 3: Deploy to GitHub Pages

1. **Update package.json**
   ```json
   "homepage": "https://yourusername.github.io/two-wheeler-maintenance",
   ```

2. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Add Deploy Scripts**
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d build"
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

### Option 4: Traditional Web Host (cPanel, etc.)

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Upload to Host**
   - Upload contents of `build/` folder to public_html

3. **Create .htaccess** for React Router
   ```
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME} -f [OR]
     RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME} -d
     RewriteRule ^ - [L]
     RewriteRule ^ /index.html [L]
   </IfModule>
   ```

## Production Checklist

### Backend
- [ ] Change JWT_SECRET to a strong random string
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas instead of local MongoDB
- [ ] Enable HTTPS
- [ ] Add CORS configuration for frontend URL
- [ ] Set up error logging (Sentry, etc.)
- [ ] Add rate limiting
- [ ] Use environment variables for all secrets
- [ ] Test all API endpoints
- [ ] Set up automated backups

### Frontend
- [ ] Update REACT_APP_API_URL to production backend
- [ ] Remove console.log statements
- [ ] Enable gzip compression
- [ ] Set up analytics
- [ ] Test on multiple browsers
- [ ] Test responsive design
- [ ] Check performance (Lighthouse)
- [ ] Set up error tracking (Sentry)

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db
JWT_SECRET=your-strong-secret-key-here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password
EMAIL_USER=email@gmail.com
EMAIL_PASSWORD=app_password
```

### Frontend (.env)
```
REACT_APP_API_URL=https://api.yourdomain.com
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

1. **Install Certbot**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Get Certificate**
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```

3. **Configure Nginx** (if using Nginx)
   ```nginx
   server {
       listen 443 ssl;
       server_name yourdomain.com;
       
       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       
       location / {
           proxy_pass http://localhost:5000;
       }
   }
   ```

4. **Auto-Renew**
   ```bash
   sudo systemctl enable certbot.timer
   sudo systemctl start certbot.timer
   ```

## Monitoring and Maintenance

### Set Up Monitoring
- Use PM2 for process management
- Set up CloudWatch or New Relic
- Monitor CPU, memory, and disk usage

### Backup Strategy
- Set up MongoDB Atlas backups
- Regular database dumps
- Version control for code
- Environment variable backups (secure)

### Performance Optimization
- Enable gzip compression
- Cache static assets
- Use CDN for frontend
- Optimize database queries
- Implement pagination

## Troubleshooting Deployments

### Backend Won't Start
1. Check logs: `heroku logs --tail`
2. Verify environment variables
3. Test locally first: `npm start`

### Frontend Won't Load API
1. Check CORS settings on backend
2. Verify API URL in .env
3. Check browser DevTools Network tab
4. Ensure backend is running

### Database Connection Issues
1. Check MONGODB_URI
2. Verify IP whitelist in MongoDB Atlas
3. Test connection locally

### Performance Issues
1. Check database indexes
2. Monitor API response times
3. Enable caching
4. Use CDN for static files

## Cost Estimates (Monthly)

- Heroku Backend: $7-50+ (starting free tier)
- MongoDB Atlas: Free-$10+ (starting free tier)
- Netlify Frontend: Free
- Domain: $10-15
- Total Minimum: ~$20-30/month

## Support

For deployment issues:
1. Check the hosting provider's documentation
2. Review error logs carefully
3. Test functionality locally before deploying
4. Use staging environment for testing
