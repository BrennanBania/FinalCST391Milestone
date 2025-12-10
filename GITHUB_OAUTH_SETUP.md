# GitHub OAuth Setup Guide

## Prerequisites
- A GitHub account
- Your application running locally or deployed

## Step 1: Create a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"** (or **"New GitHub App"** → **OAuth Apps**)
3. Fill in the application details:
   - **Application name**: Music App (or your preferred name)
   - **Homepage URL**: 
     - Development: `http://localhost:3000`
     - Production: Your deployed URL (e.g., `https://your-app.vercel.app`)
   - **Authorization callback URL**:
     - Development: `http://localhost:3000/api/auth/github/callback`
     - Production: `https://your-app.vercel.app/api/auth/github/callback`
4. Click **"Register application"**

## Step 2: Get Your Credentials

After creating the app:
1. Copy the **Client ID**
2. Click **"Generate a new client secret"**
3. Copy the **Client Secret** (you won't be able to see it again!)

## Step 3: Configure Environment Variables

### Local Development

1. Create a `.env` file in the root of your project (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```

2. Add your GitHub OAuth credentials to `.env`:
   ```env
   GITHUB_CLIENT_ID=your_github_client_id_here
   GITHUB_CLIENT_SECRET=your_github_client_secret_here
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

### Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `GITHUB_CLIENT_ID`: Your GitHub Client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub Client Secret
   - `NEXT_PUBLIC_API_URL`: Your production URL (e.g., `https://your-app.vercel.app`)

## Step 4: Run Database Migration

The GitHub OAuth feature requires a `github_id` column in the users table:

```bash
node database/add-github-oauth.js
```

This script will:
- Add the `github_id` column to the users table
- Make the `password_hash` column nullable (for OAuth-only users)

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page: `http://localhost:3000/login`

3. Click the **"🔓 Login with GitHub"** button

4. Authorize the application on GitHub

5. You should be redirected back to your app and logged in!

## How It Works

1. User clicks "Login with GitHub"
2. User is redirected to GitHub's authorization page
3. User authorizes the app
4. GitHub redirects back to `/api/auth/github/callback` with an authorization code
5. Server exchanges the code for an access token
6. Server fetches user info from GitHub API
7. Server creates/updates user in database
8. Server generates JWT token and redirects to homepage with token
9. Client stores token and logs user in

## Troubleshooting

### "GitHub OAuth is not configured" error
- Make sure `GITHUB_CLIENT_ID` is set in your `.env` file
- Restart your development server after adding environment variables

### Redirect URI mismatch
- Ensure the callback URL in your GitHub OAuth app settings matches exactly:
  - `http://localhost:3000/api/auth/github/callback` (for development)
  - Your production URL + `/api/auth/github/callback` (for production)

### Database errors
- Make sure you've run the migration script: `node database/add-github-oauth.js`
- Check that your database connection is working

### User can't login after GitHub auth
- Check the browser console for errors
- Verify the token is being returned in the URL after GitHub redirect
- Check that `JWT_SECRET` is set in your environment variables

## Security Notes

- Never commit your `.env` file or expose your `GITHUB_CLIENT_SECRET`
- Use different OAuth apps for development and production
- Rotate your client secret periodically
- The `password_hash` field will be empty for GitHub OAuth users (this is normal)

## Features

- ✅ Automatic user creation on first login
- ✅ Links GitHub account to existing users by email
- ✅ No password required for GitHub OAuth users
- ✅ Fetches email even if private on GitHub profile
- ✅ Assigns 'customer' role by default to new users
- ✅ 24-hour JWT token expiration
