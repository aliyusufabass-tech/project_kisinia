# Kisinia Frontend - Full Dashboard

A complete React + Vite dashboard for the Kisinia restaurant and food ordering system with role-based access control for Admin, Restaurant Owners, and Customers.

## Features

### 🔐 Authentication
- **JWT-based login** with automatic token management
- **Role-based access control** redirects users to appropriate dashboards
- **Automatic token refresh** using refresh tokens
- **Session persistence** using localStorage

### 👨‍💼 Admin Dashboard
- **Restaurant Management**: View all restaurants, delete restaurants
- **User Management**: View all users and their details
- **Order Management**: Complete, cancel, or track all system bookings
- **Menu Management**: View all menu items across all restaurants

### 🏪 Restaurant Owner Dashboard
- **My Restaurants**: Create and manage owned restaurants
- **Menu Items**: Add, edit menu items with images and pricing
- **Orders**: Confirm and complete customer orders
- **Order Status**: Real-time order tracking

### 👥 Customer Dashboard
- **Browse Restaurants**: Discover all available restaurants
- **View Menus**: Browse menu items for selected restaurants
- **Shopping Cart**: Add items, adjust quantities, remove items
- **Place Orders**: Checkout with special requests/notes
- **Order History**: Track all placed orders and their status

## Tech Stack

- **React 19.2** - UI framework
- **Vite 7.3** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client with JWT interceptors
- **CSS3** - Responsive styling

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.js           # Axios instance with JWT interceptors
│   │   └── endpoints.js        # API service functions
│   ├── components/
│   │   └── ProtectedRoute.jsx  # Protected route wrapper
│   ├── pages/
│   │   ├── Login.jsx & Login.css
│   │   ├── AdminDashboard.jsx & AdminDashboard.css
│   │   ├── OwnerDashboard.jsx & OwnerDashboard.css
│   │   └── CustomerDashboard.jsx & CustomerDashboard.css
│   ├── App.jsx                 # Main routing setup
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── package.json
├── vite.config.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js 22.x
- npm 10.x
- Django backend running on `http://127.0.0.1:8000/api`

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

Server runs at: **http://localhost:5173**

### Build for Production
```bash
npm run build
```

## Demo Credentials

Use these accounts to test each role:

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Admin dashboard at `/admin`

### Restaurant Owner Account
- **Username**: `owner_a`
- **Password**: `owneradmin123`
- **Access**: Owner dashboard at `/owner`

### Customer Account (Option 1)
- **Username**: `customer_b`
- **Password**: `customerb123`
- **Access**: Customer dashboard at `/customer`

### Customer Account (Option 2)
- **Username**: `customer_c`
- **Password**: `customerc123`
- **Access**: Customer dashboard at `/customer`

## API Integration

The frontend uses Axios with automatic JWT authentication. Key features:

- **Automatic token injection** in all requests via interceptors
- **Token refresh** on 401 responses
- **Redirect to login** when refresh fails
- **API Base URL**: `http://127.0.0.1:8000/api`

### Available Endpoints Used

```
POST   /token/                    - Login
POST   /token/refresh/            - Refresh JWT token
GET    /users/me/                 - Get current user
GET    /profiles/                 - Get user profile
GET    /restaurants/              - List restaurants
POST   /restaurants/              - Create restaurant
GET    /restaurants/{id}/         - Get restaurant details
GET    /restaurants/my_restaurants/ - Get owner's restaurants
GET    /visiinias/                - List menu items
POST   /visiinias/                - Add menu item
GET    /visiinias/by_restaurant/  - Get items by restaurant
GET    /bookings/                 - List bookings
POST   /bookings/                 - Create booking
GET    /bookings/my_bookings/     - Get customer's bookings
POST   /bookings/{id}/confirm/    - Confirm booking
POST   /bookings/{id}/complete/   - Complete booking
POST   /bookings/{id}/cancel/     - Cancel booking
```

## User Workflows

### Admin Flow
1. Login with admin credentials
2. View/manage restaurants (delete)
3. View all users
4. Monitor all bookings (complete, cancel)
5. View system-wide menu items

### Restaurant Owner Flow
1. Login with owner credentials
2. Create/manage restaurants
3. Add menu items with images and pricing
4. Monitor customer orders
5. Confirm and complete orders

### Customer Flow
1. Login with customer credentials
2. Browse available restaurants
3. Select restaurant and view menu
4. Add items to cart, adjust quantities
5. Checkout with special requests
6. Track order status in history

## Authentication Flow

1. **Login Page**: User enters credentials
2. **JWT Tokens**: Backend returns access & refresh tokens
3. **Storage**: Tokens saved to localStorage
4. **Routing**: User redirected based on role
5. **Requests**: Axios automatically adds `Authorization: Bearer <token>` header
6. **Refresh**: If access token expires, refresh token is used to get new access token
7. **Logout**: Clear localStorage and redirect to login

## Styling Features

- **Responsive Grid Layouts**: Adapts to all screen sizes
- **Gradient Headers**: Purple to violet gradient navbar
- **Status Badges**: Color-coded order statuses (pending, confirmed, completed, cancelled)
- **Modal Forms**: Add restaurants/menu items with modal dialogs
- **Hover Effects**: Interactive cards with scale transforms
- **Color Scheme**:
  - Primary: `#667eea` (Purple)
  - Secondary: `#764ba2` (Violet)
  - Success: `#28a745` (Green)
  - Warning: `#ffc107` (Yellow)
  - Danger: `#dc3545` (Red)

## Common Issues & Solutions

### Frontend won't load?
- Ensure backend is running on port 8000
- Check browser console for CORS errors
- Verify API_BASE_URL in `src/api/client.js`

### Login fails?
- Verify backend API is accessible
- Check credentials match those in `python manage.py seed_users`
- Look for 401 errors in network tab

### Token issues?
- Clear localStorage: `localStorage.clear()`
- Refresh the page manually
- Re-login to get new tokens

### API calls failing?
- Ensure Django backend is running
- Check `http://127.0.0.1:8000/api/token/` is accessible
- Verify CORS settings on backend

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Build and preview
npm run preview

# Lint code
npm run lint
```

## Performance Notes

- Lazy loading of dashboard components via route-based code splitting (Vite)
- Image uploads handled via FormData for multipart requests
- Minimal re-renders using React hooks efficiently
- Caching of API responses in component state

## Future Enhancements

- [ ] Add pagination for large lists
- [ ] Implement search/filter functionality
- [ ] Add restaurant ratings and reviews
- [ ] Real-time order notifications (WebSockets)
- [ ] Payment integration
- [ ] Dark mode theme
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard

## Support

For issues or questions:
1. Check the console for error messages
2. Verify backend is running and accessible
3. Ensure all dependencies are installed
4. Clear cache and localStorage if needed

---

**Happy ordering with Kisinia! 🍽️**
