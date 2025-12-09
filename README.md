# Music Collection API

A full-stack music collection management system with React frontend and RESTful API backend powered by Express.js and PostgreSQL.

## 🎵 Project Overview

This application allows users to:
- Browse and search albums and artists
- Create and manage personal album collections
- Rate and review albums
- Admin capabilities for managing content

## 📁 Project Structure

```
music/
├── api/                      # Backend API
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   ├── routes/
│   │   ├── auth.js          # User authentication
│   │   ├── albums.js        # Album CRUD operations
│   │   ├── artists.js       # Artist management
│   │   ├── collections.js   # User collections
│   │   └── reviews.js       # Album reviews
│   └── server.js            # Express server
├── database/
│   ├── db.js                # PostgreSQL connection
│   └── schema.sql           # Database schema
├── src/                     # React frontend
│   ├── App.js
│   ├── Card.js
│   └── index.js
├── DESIGN_DOCUMENT.md       # Complete design & ER diagram
├── TESTING_GUIDE.md         # API testing instructions
├── DEPLOYMENT_GUIDE.md      # Setup & deployment guide
├── SCREENSHOT_GUIDE.md      # Postman screenshot checklist
├── postman_collection.json  # Postman API collection
└── vercel.json              # Vercel configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v14+)
- npm or yarn

### Installation

1. **Clone and install dependencies**:
```powershell
Set-Location 'C:\Users\navar\OneDrive\Desktop\CST-391\music'
npm install
```

2. **Set up environment variables**:
```powershell
Copy-Item .env.example .env
```

Edit `.env` with your database credentials:
```
DATABASE_URL=postgresql://username:password@localhost:5432/music_db
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
```

3. **Set up database**:
```powershell
psql -U postgres -d music_db -f database/schema.sql
```

4. **Run the application**:
```powershell
# Backend only
npm run server

# Frontend only
npm start

# Both concurrently
npm run dev
```

Backend: `http://localhost:5000/api`  
Frontend: `http://localhost:3000`

## 📊 Database Schema

PostgreSQL database with 6 tables:
- `users` - User accounts (admin/customer roles)
- `artists` - Music artists
- `albums` - Album information
- `tracks` - Individual songs
- `user_collections` - User's saved albums
- `reviews` - Album ratings and reviews

See **DESIGN_DOCUMENT.md** for complete ER diagram and schema details.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Albums
- `GET /api/albums` - List all albums (paginated)
- `GET /api/albums/:id` - Get album details
- `POST /api/albums` - Create album (admin only)
- `PUT /api/albums/:id` - Update album (admin only)
- `DELETE /api/albums/:id` - Delete album (admin only)

### Artists
- `GET /api/artists` - List all artists
- `GET /api/artists/:id` - Get artist with albums
- `POST /api/artists` - Create artist (admin only)

### Collections
- `GET /api/collections` - Get user's collection
- `POST /api/collections` - Add album to collection
- `DELETE /api/collections/:albumId` - Remove from collection

### Reviews
- `GET /api/albums/:id/reviews` - Get album reviews
- `POST /api/reviews` - Create/update review
- `DELETE /api/reviews/:id` - Delete review

**Complete API documentation**: See **TESTING_GUIDE.md**

## 🧪 Testing

### Using Postman

1. Import `postman_collection.json` into Postman
2. Set up environment with `base_url`, `admin_token`, `customer_token`
3. Follow **TESTING_GUIDE.md** for test scenarios
4. Capture screenshots per **SCREENSHOT_GUIDE.md**

### Access Control Testing

- **Unauthenticated**: Can browse albums, artists, reviews
- **Customer**: Can manage collection, create reviews
- **Admin**: Full CRUD on albums and artists

## 🌐 Deployment

### Vercel Deployment

1. Install Vercel CLI:
```powershell
npm install -g vercel
```

2. Login and deploy:
```powershell
vercel login
vercel --prod
```

3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`

4. Connect PostgreSQL database (Vercel Postgres or external)

**Full deployment instructions**: See **DEPLOYMENT_GUIDE.md**

## 📚 Documentation Files

| File | Description |
|------|-------------|
| **DESIGN_DOCUMENT.md** | Feature description, ER diagram, API specs, references |
| **TESTING_GUIDE.md** | Comprehensive API testing guide with examples |
| **DEPLOYMENT_GUIDE.md** | Local setup, database config, Vercel deployment |
| **SCREENSHOT_GUIDE.md** | Postman screenshot checklist (26 required tests) |
| **postman_collection.json** | Import-ready Postman collection |

## 🎯 Deliverables Checklist

- [x] Design document with ER diagram
- [x] PostgreSQL database schema
- [x] RESTful API implementation (all routes)
- [x] Authentication & authorization (JWT)
- [x] API documentation
- [x] Postman collection
- [ ] Postman screenshots (26 tests - see SCREENSHOT_GUIDE.md)
- [ ] Video walkthrough (code + API demo)
- [ ] Vercel deployment (live URL)

## 🛠️ Technologies

**Frontend**:
- React 18.2.0
- Bootstrap 5

**Backend**:
- Node.js + Express.js
- PostgreSQL 14+
- JWT authentication
- bcrypt password hashing

**Deployment**:
- Vercel (frontend + serverless API)
- PostgreSQL (Vercel Postgres or external)

## 📹 Video Demonstration

**Part 1 - Code Walkthrough** (2-3 min):
- Explain one endpoint in detail (e.g., `POST /api/collections`)
- Show authentication middleware
- Highlight error handling and REST conventions

**Part 2 - Postman Demo** (2-3 min):
- Show authentication flow
- Demonstrate successful API calls
- Show error scenarios (401, 403, 409)

See **DEPLOYMENT_GUIDE.md** for detailed video recording guidance.

## 🔧 Troubleshooting

**Database connection errors**:
- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running

**Authentication errors**:
- Login again for fresh token
- Check `JWT_SECRET` matches

**Port conflicts**:
```powershell
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

## 📖 References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [JWT.io](https://jwt.io/)
- [Vercel Documentation](https://vercel.com/docs)

## 👤 Author

CST-391 Music Collection API Project

## 📄 License

This project is created for educational purposes.

---

**Next Steps**: 
1. Review **DESIGN_DOCUMENT.md** 
2. Set up database with `schema.sql`
3. Test API with Postman (follow **TESTING_GUIDE.md**)
4. Capture screenshots (see **SCREENSHOT_GUIDE.md**)
5. Record video demonstration
6. Deploy to Vercel
