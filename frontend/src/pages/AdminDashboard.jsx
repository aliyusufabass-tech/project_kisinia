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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadedImages, setLoadedImages] = useState({});
  const [failedImages, setFailedImages] = useState({});
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState({ title: '', content: '' });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
      setError('Failed to load data');
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
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        await restaurantAPI.delete(id);
        setSuccess('Restaurant deleted successfully!');
        fetchData('restaurants');
      } catch (err) {
        setError('Failed to delete restaurant');
      }
    }
  };

  const handleCompleteBooking = async (id) => {
    try {
      await bookingAPI.complete(id);
      setSuccess('Booking marked as completed!');
      fetchData('bookings');
    } catch (err) {
      setError('Failed to complete booking');
    }
  };

  const handleCancelBooking = async (id) => {
    try {
      await bookingAPI.cancel(id);
      setSuccess('Booking cancelled successfully!');
      fetchData('bookings');
    } catch (err) {
      setError('Failed to cancel booking');
    }
  };

  const truncateDescription = (description, maxLines = 3) => {
    if (!description) return '';
    
    const lines = description.split('\n');
    if (lines.length <= maxLines) return description;
    
    return lines.slice(0, maxLines).join('\n');
  };

  const shouldShowViewMore = (description, maxLines = 3) => {
    if (!description) return false;
    return description.split('\n').length > maxLines;
  };

  const handleViewDescription = (title, content) => {
    setSelectedDescription({ title, content });
    setShowDescriptionModal(true);
  };

  const getStats = () => {
    return {
      totalRestaurants: restaurants.length,
      activeRestaurants: restaurants.filter(r => r.is_active).length,
      totalUsers: users.length,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
      totalMenuItems: visiinias.length,
      availableItems: visiinias.filter(v => v.is_available).length
    };
  };

  const stats = getStats();

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="brand">
            <span className="brand-icon">🛡️</span>
            <span className="brand-text">Kisinia Admin</span>
          </div>
          <div className="user-section">
            <span className="user-name">{user.username}</span>
            <span className="admin-badge">SUPERUSER</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {error && <div className="notification error">{error}</div>}
      {success && <div className="notification success">{success}</div>}

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="nav-menu">
            <button 
              className={`nav-item ${activeTab === 'restaurants' ? 'active' : ''}`}
              onClick={() => setActiveTab('restaurants')}
            >
              <span className="nav-icon">🏪</span>
              <span>Restaurants</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="nav-icon">👥</span>
              <span>Users</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <span className="nav-icon">📋</span>
              <span>Bookings</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'visiinias' ? 'active' : ''}`}
              onClick={() => setActiveTab('visiinias')}
            >
              <span className="nav-icon">🍽️</span>
              <span>Menu Items</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Stats Overview */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏪</div>
              <div className="stat-content">
                <h3>{stats.totalRestaurants}</h3>
                <p>Total Restaurants</p>
                <span className="stat-detail">{stats.activeRestaurants} Active</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{stats.totalUsers}</h3>
                <p>Total Users</p>
                <span className="stat-detail">Registered accounts</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <h3>{stats.totalBookings}</h3>
                <p>Total Bookings</p>
                <span className="stat-detail">{stats.pendingBookings} Pending</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🍽️</div>
              <div className="stat-content">
                <h3>{stats.totalMenuItems}</h3>
                <p>Menu Items</p>
                <span className="stat-detail">{stats.availableItems} Available</span>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="content-section">
            {activeTab === 'restaurants' && (
              <div>
                <div className="section-header">
                  <h1>Restaurants Management</h1>
                </div>
                {loading ? (
                  <div className="loading-state">Loading restaurants...</div>
                ) : (
                  <div className="data-table">
                    <div className="table-header">
                      <div className="table-row">
                        <div className="table-cell">Restaurant</div>
                        <div className="table-cell">Contact</div>
                        <div className="table-cell">Status</div>
                        <div className="table-cell">Actions</div>
                      </div>
                    </div>
                    <div className="table-body">
                      {restaurants.map(restaurant => (
                        <div key={restaurant.id} className="table-row">
                          <div className="table-cell">
                            <div className="restaurant-info">
                              <div className="restaurant-avatar">
                                {restaurant.logo ? (
                                  <img src={buildImageUrl(restaurant.logo)} alt={restaurant.name} />
                                ) : (
                                  <span>🏪</span>
                                )}
                              </div>
                              <div className="restaurant-details">
                                <h4>{restaurant.name}</h4>
                                <p>{restaurant.address}</p>
                              </div>
                            </div>
                          </div>
                          <div className="table-cell">
                            <div className="contact-info">
                              <span className="phone">📞 {restaurant.phone}</span>
                              <span className="owner">👤 {restaurant.owner?.username}</span>
                            </div>
                          </div>
                          <div className="table-cell">
                            <span className={`status-badge ${restaurant.is_active ? 'active' : 'inactive'}`}>
                              {restaurant.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="table-cell">
                            <button 
                              className="action-btn delete"
                              onClick={() => handleDeleteRestaurant(restaurant.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="section-header">
                  <h1>Users Management</h1>
                </div>
                {loading ? (
                  <div className="loading-state">Loading users...</div>
                ) : (
                  <div className="data-table">
                    <div className="table-header">
                      <div className="table-row">
                        <div className="table-cell">User</div>
                        <div className="table-cell">Contact</div>
                        <div className="table-cell">Role</div>
                        <div className="table-cell">Status</div>
                      </div>
                    </div>
                    <div className="table-body">
                      {users.map(u => (
                        <div key={u.id} className="table-row">
                          <div className="table-cell">
                            <div className="user-info">
                              <div className="user-avatar">
                                {u.profile?.avatar ? (
                                  <img src={buildImageUrl(u.profile.avatar)} alt={u.username} />
                                ) : (
                                  <span>👤</span>
                                )}
                              </div>
                              <div className="user-details">
                                <h4>{u.username}</h4>
                                <p>{u.first_name} {u.last_name}</p>
                              </div>
                            </div>
                          </div>
                          <div className="table-cell">
                            <div className="contact-info">
                              <span className="email">📧 {u.email}</span>
                              <span className="phone">📞 {u.profile?.phone || 'Not provided'}</span>
                            </div>
                          </div>
                          <div className="table-cell">
                            <span className={`role-badge ${u.profile?.role?.toLowerCase() || 'customer'}`}>
                              {u.profile?.role || 'CUSTOMER'}
                            </span>
                          </div>
                          <div className="table-cell">
                            <div className="status-badges">
                              {u.is_superuser && <span className="status-badge admin">SUPERUSER</span>}
                              {u.is_staff && <span className="status-badge staff">STAFF</span>}
                              {!u.is_superuser && !u.is_staff && <span className="status-badge normal">USER</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <div className="section-header">
                  <h1>Bookings Management</h1>
                </div>
                {loading ? (
                  <div className="loading-state">Loading bookings...</div>
                ) : (
                  <div className="data-table">
                    <div className="table-header">
                      <div className="table-row">
                        <div className="table-cell">Booking</div>
                        <div className="table-cell">Customer</div>
                        <div className="table-cell">Restaurant</div>
                        <div className="table-cell">Status</div>
                        <div className="table-cell">Total</div>
                        <div className="table-cell">Actions</div>
                      </div>
                    </div>
                    <div className="table-body">
                      {bookings.map(booking => (
                        <div key={booking.id} className="table-row">
                          <div className="table-cell">
                            <div className="booking-info">
                              <h4>#{booking.id}</h4>
                              <p>{new Date(booking.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="table-cell">
                            <span className="customer-name">{booking.customer_name}</span>
                          </div>
                          <div className="table-cell">
                            <span className="restaurant-name">{booking.restaurant_name}</span>
                          </div>
                          <div className="table-cell">
                            <span className={`status-badge ${booking.status.toLowerCase()}`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="table-cell">
                            <span className="price">${booking.total_price}</span>
                          </div>
                          <div className="table-cell">
                            <div className="action-buttons">
                              {booking.status !== 'COMPLETED' && (
                                <button 
                                  className="action-btn complete"
                                  onClick={() => handleCompleteBooking(booking.id)}
                                >
                                  Complete
                                </button>
                              )}
                              {booking.status !== 'CANCELLED' && (
                                <button 
                                  className="action-btn cancel"
                                  onClick={() => handleCancelBooking(booking.id)}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'visiinias' && (
              <div>
                <div className="section-header">
                  <h1>Menu Items Management</h1>
                </div>
                {loading ? (
                  <div className="loading-state">Loading menu items...</div>
                ) : (
                  <div className="menu-grid">
                    {visiinias.map(visinia => (
                      <div key={visinia.id} className="menu-item-card">
                        <div className="card-image">
                          {visinia.image && !failedImages[`visinia-${visinia.id}`] ? (
                            <img
                              src={buildImageUrl(visinia.image)} 
                              alt={visinia.name} 
                              onLoad={() => setLoadedImages({...loadedImages, [`visinia-${visinia.id}`]: true})}
                              onError={() => setFailedImages({...failedImages, [`visinia-${visinia.id}`]: true})}
                            />
                          ) : (
                            <div className="image-placeholder">🍽️</div>
                          )}
                        </div>
                        <div className="card-content">
                          <h3>{visinia.name}</h3>
                          <p className="price">${visinia.price}</p>
                          <p className="restaurant">📍 {visinia.restaurant_name}</p>
                          {visinia.description && (
                            <div className="description-section">
                              <p className="description">
                                {truncateDescription(visinia.description)}
                              </p>
                              {shouldShowViewMore(visinia.description) && (
                                <button 
                                  className="view-more-btn"
                                  onClick={() => handleViewDescription(visinia.name, visinia.description)}
                                >
                                  View More
                                </button>
                              )}
                            </div>
                          )}
                          <div className="card-footer">
                            <span className={`status-badge ${visinia.is_available ? 'available' : 'unavailable'}`}>
                              {visinia.is_available ? 'Available' : 'Not Available'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="modal-overlay" onClick={() => setShowDescriptionModal(false)}>
          <div className="description-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDescription.title}</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowDescriptionModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="description-content">
                {selectedDescription.content.split('\n').map((line, index) => (
                  <p key={index} className="description-line">
                    {line || <br />}
                  </p>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-primary" 
                onClick={() => setShowDescriptionModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
