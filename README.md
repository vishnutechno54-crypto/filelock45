# File Locker

A secure file locker web app with public signup/login, authenticated upload/download/preview, and a modern React SPA frontend backed by a Node.js/Express/MongoDB API.

## Key Features

- Public user registration via `/register`
- Public login via `/login`
- Authenticated dashboard and file management
- File upload support up to 1.5GB per file, streamed directly into GridFS (no in-memory buffering)
- File preview and download endpoints for authenticated users
- No admin-only restriction for signup or login — an admin panel exists but is optional
- Frontend served as a React SPA with protected routes and route fallback
- Backend API with health check and rate limiting

## Project Structure

- `backend/` - Express API server
- `frontend/` - React single-page application

## Backend

### Main server
- `backend/server.js`
- Connects to MongoDB
- Enables CORS, security headers, request rate limiting
- Exposes routes:
  - `/api/auth` - registration and login
  - `/api/files` - upload, download, preview
  - `/api/folders` - folder management
  - `/api/admin` - optional admin dashboard (requires an admin-role account)
  - `/api/health` - health check

### Upload limits
- File upload size limit is 1.5GB per file
- Uses multer with a custom storage engine that streams uploads directly into GridFS

### Auth
- Public registration enabled at `POST /api/auth/register` (always creates a `role: "user"` account)
- Login returns a JWT token stored in frontend local storage
- Admin routes exist but are not required for normal user flows; use `backend/seed.js` to create the first admin account if you want one

## Frontend

### Routing
- `frontend/src/App.js` defines SPA routes:
  - `/login` -> login page
  - `/register` -> registration page
  - `/` -> protected dashboard
  - `/files` -> protected file list page
  - `/admin` -> protected, admin-role-only page

### Auth flow
- `frontend/src/context/AuthContext.js` manages auth state (`login`, `register`, `logout`, `refreshUser`)
- `frontend/src/components/ProtectedRoute.js` blocks unauthenticated (and, for `/admin`, non-admin) access
- Successful login/register redirects users into the app

### Pages
- `frontend/src/pages/Login.js`
- `frontend/src/pages/Register.js`
- `frontend/src/pages/Dashboard.js`
- `frontend/src/pages/Files.js`
- `frontend/src/pages/Admin.js`

## Running the app

### Backend

1. Open a terminal in `backend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (copy `.env.example`) with your MongoDB values:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/filelocker
   FRONTEND_URL=http://localhost:3002
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
   JWT_EXPIRE=7d
   ADMIN_EMAIL=admin@filelocker.com
   ADMIN_PASSWORD=Admin@123456
   NODE_ENV=development
   ```
4. Start the API server:
   ```bash
   npm start
   ```
5. (Optional) create an admin account:
   ```bash
   node seed.js
   ```

### Frontend

1. Open a terminal in `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (copy `.env.example`):
   ```env
   PORT=3002
   REACT_APP_API_URL=http://localhost:5001/api
   ```
4. Start the React app:
   ```bash
   npm start
   ```
5. Visit `http://localhost:3002`

## Important Endpoints

### Public pages
- `http://localhost:3002/register`
- `http://localhost:3002/login`

### API
- `POST /api/auth/register` - create a new account
- `POST /api/auth/login` - authenticate and receive token
- `GET /api/auth/me` - current user (authenticated)
- `GET /api/health` - API health check
- `POST /api/files/upload` - upload files (authenticated)
- `GET /api/files/:id/download` - download file (authenticated, owner-only)
- `GET /api/files/:id/preview` - preview file (authenticated, owner-only)

## MongoDB Atlas

To use Atlas, set the backend environment variable `MONGODB_URI` to your Atlas connection string.
The backend also supports `MONGO_URI` for compatibility with local MongoDB.

Example Atlas URI:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
```

If your network blocks DNS SRV lookups or you see `querySrv ECONNREFUSED`, use a direct connection string instead:

```env
MONGODB_URI=mongodb://<username>:<password>@cluster1-shard-00-00.anhdhvx.mongodb.net:27017,cluster1-shard-00-01.anhdhvx.mongodb.net:27017,cluster1-shard-00-02.anhdhvx.mongodb.net:27017/filelocker?replicaSet=atlas-xxxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

## Deploying to Vercel

### Frontend
- Create a `frontend/.env` file in Vercel with:
```env
REACT_APP_API_URL=https://<your-backend-url>/api
```
- Build command: `npm run build`
- Output directory: `frontend/build`

### Backend
- If you want to host the backend on Vercel, note that the current Express/Node app is designed for a persistent server process. Vercel is best suited for frontend and serverless functions, so a separate host like Render, Railway, Fly, or Heroku is recommended for the backend.
- If you do use Vercel for backend hosting, set these environment variables:
```env
MONGODB_URI=your-atlas-connection-string
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
FRONTEND_URL=https://<your-frontend-url>
NODE_ENV=production
```

### Recommended production setup
- Deploy the frontend to Vercel.
- Deploy the backend to a provider that supports long-running Node/Express servers.
- In the frontend Vercel settings, set `REACT_APP_API_URL` to the backend API base URL.

## Notes

- The app allows public user signup and login; each user only sees and can access their own files (uploads and downloads are scoped to `owner`).
- Admin-only functionality (user management dashboard) is optional and not required for normal user flows.
- The frontend uses CRA route fallback in development so direct `/login` and `/register` URLs work. In production, serve the built `frontend/build` folder with a static server configured to fall back to `index.html` for unknown paths — a ready-made `frontend/serve.json` is included for use with [`serve`](https://www.npmjs.com/package/serve) (`npx serve -s build -c serve.json`), and equivalent rewrites should be configured for nginx/Apache/other hosts.

## What was fixed from the original codebase

The uploaded project was actually built as a private, admin-invite-only vault (no `/register` route or page existed anywhere, login page read "Admin access only", and the only way to create a user was through the admin panel or `seed.js`). To match this README's public-signup design, the following was added/fixed:

- Added `POST /api/auth/register` on the backend (rate-limited, validated, always creates a non-admin user).
- Added the missing `frontend/src/pages/Register.js` page and wired it into routing (`App.js`) and `AuthContext.js`.
- Updated `Login.js` copy/links to reflect public signup instead of "admin access only".
- Raised the upload limit from 500MB to the 1.5GB this README specifies, and updated the matching error message.
- Replaced the `multer-gridfs-storage` package with a small custom multer storage engine that streams uploads directly into GridFS. The old package's peer dependency conflicted with the pinned `multer` version and made `npm install` fail outright; it also buffered files in a way that's risky at a 1.5GB limit.
- Added the `mongodb` package as an explicit dependency (it was required directly in code but only present transitively via `mongoose`), and upgraded `multer` to 2.x to avoid known 1.x CVEs.
- Fixed image preview/thumbnails, which were requesting the authenticated `/preview` endpoint from a raw `<img src>`/browser tab with no Authorization header and so always failed with 401 — now fetched via an authenticated request and rendered from a blob URL.
- Fixed a few `react-scripts build` failures (`CI=true`, which most hosting platforms set automatically, turns ESLint warnings into hard build failures): an unused variable and two `useEffect` missing-dependency warnings.
- Fixed env var/port mismatches between the README and `.env.example` files (`MONGODB_URI` naming, `5001`/`3002` ports).

The backend and frontend were verified with a clean `npm install` and `npm run build` (`CI=true`) in this environment.
