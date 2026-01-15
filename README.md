# 🏠 Home Services Platform

A full-stack home services application where users can discover nearby service providers, book services, and leave reviews.

## Features

- 📍 **GPS-based Location** - Automatic location detection via browser geolocation
- 🔍 **Nearby Search** - Find providers sorted by distance using MongoDB geospatial queries
- 📋 **Easy Booking** - Book services with a simple form
- ⭐ **Reviews System** - Leave reviews for completed bookings
- 📱 **Responsive UI** - Works on desktop and mobile devices

## Tech Stack

- **Backend:** Node.js, Express.js, MongoDB with Mongoose
- **Frontend:** Vanilla HTML, CSS, JavaScript (No frameworks)
- **Database:** MongoDB with 2dsphere geospatial indexing

## Prerequisites

- Node.js v18 or higher
- MongoDB (local installation or MongoDB Atlas)

## Installation & Setup

### 1. Clone or create the project structure

```
home-services/
├── backend/
│   ├── package.json
│   ├── .env
│   ├── server.js
│   ├── config/db.js
│   ├── models/
│   ├── routes/
│   └── seed/
└── frontend/
    ├── index.html
    ├── provider-register.html
    ├── bookings.html
    ├── css/styles.css
    └── js/
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Start MongoDB

Make sure MongoDB is running locally on port 27017, or update the `.env` file with your MongoDB URI.

```bash
# For local MongoDB
mongod
```

### 4. Seed Sample Data (Optional)

```bash
cd backend
npm run seed
```

### 5. Start the Server

```bash
npm start
```

## Access the Application

Once the server is running:

| Page | URL |
|------|-----|
| 🏠 **Home / Find Services** | http://localhost:5000 |
| 🛠️ **Provider Registration** | http://localhost:5000/provider-register |
| 📋 **My Bookings** | http://localhost:5000/bookings |
| 🔌 **API Health Check** | http://localhost:5000/api/health |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/providers/categories` | Get service categories |
| POST | `/api/providers/register` | Register new provider |
| GET | `/api/providers/nearby` | Search nearby providers |
| GET | `/api/providers/:id` | Get provider details |
| POST | `/api/bookings` | Create new booking |
| GET | `/api/bookings/user/:userId` | Get user's bookings |
| PUT | `/api/bookings/:id/status` | Update booking status |
| POST | `/api/reviews` | Submit a review |
| GET | `/api/reviews/provider/:id` | Get provider reviews |

## How It Works

### Location Handling

1. User clicks "Use My GPS Location" button
2. Browser captures latitude & longitude via Geolocation API
3. Coordinates are sent to backend for distance calculations
4. Address is obtained via reverse geocoding (OpenStreetMap Nominatim)
5. Frontend displays human-readable addresses only

### Provider Search

1. MongoDB 2dsphere index enables geospatial queries
2. `$geoNear` aggregation returns providers sorted by distance
3. Distance is calculated in kilometers and displayed to user

## Testing the Application

1. **Register a Provider:**
   - Go to `/provider-register`
   - Fill in details and click "Capture GPS Location"
   - Submit the form

2. **Find Providers:**
   - Go to `/` (home page)
   - Click "Use My GPS Location"
   - Browse providers sorted by distance
   - Click "Book Now" to create a booking

3. **Manage Bookings:**
   - Go to `/bookings`
   - Enter your phone number
   - View, complete, or cancel bookings
   - Leave reviews for completed bookings

## Troubleshooting

- **MongoDB Connection Error:** Ensure MongoDB is running on `localhost:27017`
- **GPS Not Working:** Allow location access in your browser
- **No Providers Found:** Run `npm run seed` to add sample data

## License

MIT License

---

## 🚀 Quick Start Commands

```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Setup and run the app
cd home-services/backend
npm install
npm run seed    # Add sample providers
npm start       # Start server on port 5000
```

## 🌐 Access URLs

| Page | URL |
|------|-----|
| **Find Services** | http://localhost:5000 |
| **Register Provider** | http://localhost:5000/provider-register |
| **My Bookings** | http://localhost:5000/bookings |
| **API Health** | http://localhost:5000/api/health |
