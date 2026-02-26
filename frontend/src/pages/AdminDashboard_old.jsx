import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, restaurantAPI, visioniaAPI, bookingAPI } from '../api/endpoints';
import { buildImageUrl } from '../api/client';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [visiinias, setVisiinias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const [failedImages, setFailedImages] = useState({});
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'restaurants') {
        const res = await restaurantAPI.list();
        setRestaurants(res.data);
      } else if (tab === 'users') {
        const res = await userAPI.list();
        setUsers(res.data);
      } else if (tab === 'bookings') {
        const res = await bookingAPI.list();
        setBookings(res.data);
      } else if (tab === 'visiinias') {
        const res = await visioniaAPI.list();
        setVisiinias(res.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleDeleteRestaurant = async (id) => {
    if (window.confirm('Delete this restaurant?')) {
      try {
        await restaurantAPI.delete(id);
        setRestaurants(restaurants.filter(r => r.id !== id));
      } catch (err) {
        alert('Error deleting restaurant');
      }
    }
  };

  const handleCompleteBooking = async (id) => {
    try {
      await bookingAPI.complete(id);
      fetchData('bookings');
    } catch (err) {
      alert('Error completing booking');
    }
  };

  const handleCancelBooking = async (id) => {
    try {
      await bookingAPI.cancel(id);
      fetchData('bookings');
    } catch (err) {
      alert('Error canceling booking');
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">🍽️ Kisinia - Admin Dashboard</div>
        <div className="navbar-user">
          <span>{user.username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-container">
        <aside className="sidebar">
          <ul className="nav-menu">
            <li>
              <button 
                className={`nav-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
                onClick={() => setActiveTab('restaurants')}
              >
                🏪 Restaurants
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                👥 Users
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                📋 Bookings
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeTab === 'visiinias' ? 'active' : ''}`}
                onClick={() => setActiveTab('visiinias')}
              >
                🍽️ Menu Items
              </button>
            </li>
          </ul>
        </aside>

        <main className="content">
          {activeTab === 'restaurants' && (
            <section>
              <h2>Restaurants Management</h2>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Phone</th>
                        <th>Active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurants.map(restaurant => (
                        <tr key={restaurant.id}>
                          <td>{restaurant.id}</td>
                          <td>{restaurant.name}</td>
                          <td>{restaurant.address}</td>
                          <td>{restaurant.phone}</td>
                          <td>{restaurant.is_active ? '✓' : '✗'}</td>
                          <td>
                            <button 
                              className="btn-delete"
                              onClick={() => handleDeleteRestaurant(restaurant.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'users' && (
            <section>
              <h2>Users</h2>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Is Staff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td>{u.username}</td>
                          <td>{u.email}</td>
                          <td>{u.is_staff ? '✓' : '✗'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'bookings' && (
            <section>
              <h2>All Bookings</h2>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Restaurant</th>
                        <th>Status</th>
                        <th>Total Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(booking => (
                        <tr key={booking.id}>
                          <td>{booking.id}</td>
                          <td>{booking.customer_name}</td>
                          <td>{booking.restaurant_name}</td>
                          <td><span className={`status ${booking.status.toLowerCase()}`}>{booking.status}</span></td>
                          <td>${booking.total_price}</td>
                          <td>
                            {booking.status !== 'COMPLETED' && (
                              <button 
                                className="btn-complete"
                                onClick={() => handleCompleteBooking(booking.id)}
                              >
                                Complete
                              </button>
                            )}
                            {booking.status !== 'CANCELLED' && (
                              <button 
                                className="btn-cancel"
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'visiinias' && (
            <section>
              <h2>Menu Items</h2>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="items-grid">
                  {visiinias.map(visinia => (
                    <div key={visinia.id} className="item-card">
                      <div className="item-image-container">
                        {visinia.image && visinia.image.trim() ? (
                          <>
                            {!loadedImages[`visinia-${visinia.id}`] && (
                              <div className="item-image-placeholder">🍽️</div>
                            )}
                            <img
                              src={buildImageUrl(visinia.image)}
                              alt={visinia.name}
                              className="item-image"
                              onLoad={() => setLoadedImages(prev => ({ ...prev, [`visinia-${visinia.id}`]: true }))}
                              onError={(e) => { console.error(`Menu image failed to load: ${e.target.src}`); setFailedImages(prev => ({ ...prev, [`visinia-${visinia.id}`]: true })); }}
                              style={{ display: failedImages[`visinia-${visinia.id}`] ? 'none' : 'block' }}
                            />
                          </>
                        ) : (
                          <div className="item-image-placeholder">🍽️</div>
                        )}
                      </div>
                      <h3>{visinia.name}</h3>
                      <p className="description">{visinia.description}</p>
                      <p className="restaurant">Restaurant: {visinia.restaurant_name}</p>
                      <p className="price">${visinia.price}</p>
                      <p className="availability">
                        {visinia.is_available ? '✓ Available' : '✗ Not Available'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
