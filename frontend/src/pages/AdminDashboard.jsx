import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, userAPI, restaurantAPI, visioniaAPI, bookingAPI } from '../api/endpoints';
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
  const [ownerSubmitting, setOwnerSubmitting] = useState(false);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [restaurantSubmitting, setRestaurantSubmitting] = useState(false);
  const [ownerUsers, setOwnerUsers] = useState([]);
  const [ownerForm, setOwnerForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
  });
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    owner_id: '',
    logo: null,
  });
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
        const [restaurantRes, usersRes] = await Promise.all([
          restaurantAPI.list(),
          userAPI.list()
        ]);
        setRestaurants(restaurantRes.data);
        setOwnerUsers(usersRes.data.filter(u => u.profile?.role === 'RESTAURANT_OWNER'));
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

  const handleRestaurantInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'logo') {
      setRestaurantForm((prev) => ({ ...prev, logo: files?.[0] || null }));
      return;
    }
    setRestaurantForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminAddRestaurant = async (e) => {
    e.preventDefault();
    setRestaurantSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const data = new FormData();
      data.append('name', restaurantForm.name);
      data.append('description', restaurantForm.description || '');
      data.append('address', restaurantForm.address);
      data.append('phone', restaurantForm.phone);
      data.append('owner_id', restaurantForm.owner_id);
      if (restaurantForm.logo) data.append('logo', restaurantForm.logo);

      await restaurantAPI.create(data);
      setSuccess('Restaurant added successfully!');
      setShowAddRestaurant(false);
      setRestaurantForm({
        name: '',
        description: '',
        address: '',
        phone: '',
        owner_id: '',
        logo: null,
      });
      fetchData('restaurants');
    } catch (err) {
      setError(parseApiError(err, 'Failed to add restaurant'));
    } finally {
      setRestaurantSubmitting(false);
    }
  };

  const handleDeleteUser = async (userRecord) => {
    if (userRecord?.is_superuser) {
      setError('Superuser accounts cannot be deleted from this panel.');
      return;
    }

    if (userRecord?.id === user?.id) {
      setError('You cannot delete your own account.');
      return;
    }

    const role = userRecord?.profile?.role || 'CUSTOMER';
    const accountType = role === 'RESTAURANT_OWNER' ? 'restaurant owner' : 'user';
    if (!window.confirm(`Are you sure you want to delete this ${accountType} account?`)) {
      return;
    }

    try {
      await userAPI.delete(userRecord.id);
      setSuccess('Account deleted successfully!');
      fetchData('users');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || 'Failed to delete account');
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

  const handleOwnerInputChange = (e) => {
    const { name, value } = e.target;
    setOwnerForm((prev) => ({ ...prev, [name]: value }));
  };

  const parseApiError = (err, fallback) => {
    const errorData = err.response?.data;
    if (!errorData) return fallback;
    if (typeof errorData === 'string') return errorData;
    if (typeof errorData.detail === 'string') return errorData.detail;
    return Object.entries(errorData)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
      .join('\n');
  };

  const handleOwnerRegistration = async (e) => {
    e.preventDefault();
    setOwnerSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await authAPI.registerOwner(ownerForm);
      setSuccess('Restaurant owner registered successfully!');
      setOwnerForm({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        password_confirm: '',
      });
      fetchData('users');
    } catch (err) {
      setError(parseApiError(err, 'Failed to register restaurant owner'));
    } finally {
      setOwnerSubmitting(false);
    }
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
                  <button className="action-btn complete" onClick={() => setShowAddRestaurant(true)}>
                    Add Restaurant
                  </button>
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
                                {(restaurant.logo_file_url || restaurant.logo) ? (
                                  <img src={buildImageUrl(restaurant.logo_file_url || restaurant.logo)} alt={restaurant.name} />
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
                <div className="owner-form-card">
                  <h2>Register Restaurant Owner</h2>
                  <form className="owner-form" onSubmit={handleOwnerRegistration}>
                    <div className="owner-form-grid">
                      <input
                        type="text"
                        name="first_name"
                        placeholder="First name"
                        value={ownerForm.first_name}
                        onChange={handleOwnerInputChange}
                        required
                      />
                      <input
                        type="text"
                        name="last_name"
                        placeholder="Last name"
                        value={ownerForm.last_name}
                        onChange={handleOwnerInputChange}
                        required
                      />
                      <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={ownerForm.username}
                        onChange={handleOwnerInputChange}
                        required
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={ownerForm.email}
                        onChange={handleOwnerInputChange}
                        required
                      />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone (optional)"
                        value={ownerForm.phone}
                        onChange={handleOwnerInputChange}
                      />
                      <input
                        type="password"
                        name="password"
                        placeholder="Password (min 8 chars)"
                        value={ownerForm.password}
                        onChange={handleOwnerInputChange}
                        minLength="8"
                        required
                      />
                      <input
                        type="password"
                        name="password_confirm"
                        placeholder="Confirm password"
                        value={ownerForm.password_confirm}
                        onChange={handleOwnerInputChange}
                        minLength="8"
                        required
                      />
                    </div>
                    <div className="owner-form-actions">
                      <button
                        type="submit"
                        className="action-btn complete"
                        disabled={ownerSubmitting}
                      >
                        {ownerSubmitting ? 'Registering...' : 'Register Owner'}
                      </button>
                    </div>
                  </form>
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
                            {!u.is_superuser && u.id !== user?.id && (
                              <div style={{ marginTop: '8px' }}>
                                <button
                                  className="action-btn delete"
                                  onClick={() => handleDeleteUser(u)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
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
                          {(visinia.image_file_url || visinia.image) && !failedImages[`visinia-${visinia.id}`] ? (
                            <img
                              src={buildImageUrl(visinia.image_file_url || visinia.image)} 
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
      {showAddRestaurant && (
        <div className="modal-overlay" onClick={() => setShowAddRestaurant(false)}>
          <div className="description-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Restaurant (Admin)</h2>
              <button className="close-btn" onClick={() => setShowAddRestaurant(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleAdminAddRestaurant} className="modal-content">
              <div className="owner-form-grid">
                <input
                  type="text"
                  name="name"
                  placeholder="Restaurant name"
                  value={restaurantForm.name}
                  onChange={handleRestaurantInputChange}
                  required
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={restaurantForm.address}
                  onChange={handleRestaurantInputChange}
                  required
                />
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone"
                  value={restaurantForm.phone}
                  onChange={handleRestaurantInputChange}
                  required
                />
                <select
                  name="owner_id"
                  value={restaurantForm.owner_id}
                  onChange={handleRestaurantInputChange}
                  required
                >
                  <option value="">Select owner</option>
                  {ownerUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
                <textarea
                  name="description"
                  placeholder="Description (optional)"
                  value={restaurantForm.description}
                  onChange={handleRestaurantInputChange}
                  rows={3}
                />
                <input
                  type="file"
                  name="logo"
                  accept="image/*"
                  onChange={handleRestaurantInputChange}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-primary" onClick={() => setShowAddRestaurant(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={restaurantSubmitting}>
                  {restaurantSubmitting ? 'Adding...' : 'Add Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

