import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI, visioniaAPI, bookingAPI } from '../api/endpoints';
import { buildImageUrl } from '../api/client';
import './OwnerDashboard.css';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [visiinias, setVisiinias] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [showAddVisinia, setShowAddVisinia] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    logo: null,
  });

  const [visioniaData, setVisioniaData] = useState({
    name: '',
    description: '',
    price: '',
    restaurant: '',
    image: null,
  });

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
        const res = await restaurantAPI.myRestaurants();
        setRestaurants(res.data);
      } else if (tab === 'visiinias') {
        const res = await visioniaAPI.list();
        const ownerRes = await restaurantAPI.myRestaurants();
        const ownerIds = ownerRes.data.map(r => r.id);
        setVisiinias(res.data.filter(v => ownerIds.includes(v.restaurant)));
      } else if (tab === 'bookings') {
        const res = await bookingAPI.list();
        setBookings(res.data);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.name || !formData.address || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('address', formData.address);
      data.append('phone', formData.phone);
      if (formData.logo) data.append('logo', formData.logo);

      await restaurantAPI.create(data);
      setFormData({ name: '', description: '', address: '', phone: '', logo: null });
      setShowAddRestaurant(false);
      setSuccess('Restaurant added successfully!');
      fetchData('restaurants');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add restaurant');
    }
  };

  const handleAddVisinia = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!visioniaData.name || !visioniaData.price || !visioniaData.restaurant) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const data = new FormData();
      data.append('name', visioniaData.name);
      data.append('description', visioniaData.description);
      data.append('price', visioniaData.price);
      data.append('restaurant', visioniaData.restaurant);
      if (visioniaData.image) data.append('image', visioniaData.image);

      await visioniaAPI.create(data);
      setVisioniaData({ name: '', description: '', price: '', restaurant: '', image: null });
      setShowAddVisinia(false);
      setSuccess('Menu item added successfully!');
      fetchData('visiinias');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add menu item');
    }
  };

  const handleConfirmBooking = async (id) => {
    try {
      await bookingAPI.confirm(id);
      setSuccess('Order confirmed!');
      fetchData('bookings');
    } catch (err) {
      setError('Failed to confirm order');
    }
  };

  const handleCompleteBooking = async (id) => {
    try {
      await bookingAPI.complete(id);
      setSuccess('Order completed!');
      fetchData('bookings');
    } catch (err) {
      setError('Failed to complete order');
    }
  };

  return (
    <div className="owner-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="brand">
            <span className="brand-icon">🍽️</span>
            <span className="brand-text">Kisinia Owner</span>
          </div>
          <div className="user-section">
            <span className="user-name">{user.username}</span>
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
              className={`nav-item ${activeTab === 'visiinias' ? 'active' : ''}`}
              onClick={() => setActiveTab('visiinias')}
            >
              <span className="nav-icon">🍽️</span>
              <span>Menu Items</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <span className="nav-icon">📋</span>
              <span>Orders</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeTab === 'restaurants' && (
            <div className="content-section">
              <div className="section-header">
                <h1>My Restaurants</h1>
                <button 
                  className="add-btn"
                  onClick={() => setShowAddRestaurant(true)}
                >
                  <span>+</span>
                  <span>Add Restaurant</span>
                </button>
              </div>

              {loading ? (
                <div className="loading-state">Loading...</div>
              ) : restaurants.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏪</div>
                  <h3>No restaurants yet</h3>
                  <p>Add your first restaurant to get started</p>
                </div>
              ) : (
                <div className="restaurants-grid">
                  {restaurants.map(restaurant => (
                    <div key={restaurant.id} className="restaurant-card">
                      <div className="card-image">
                        {restaurant.logo ? (
                          <img src={buildImageUrl(restaurant.logo)} alt={restaurant.name} />
                        ) : (
                          <div className="image-placeholder">🏪</div>
                        )}
                      </div>
                      <div className="card-content">
                        <h3>{restaurant.name}</h3>
                        <p className="address">📍 {restaurant.address}</p>
                        <p className="phone">📞 {restaurant.phone}</p>
                        {restaurant.description && (
                          <p className="description">{restaurant.description}</p>
                        )}
                        <div className="card-status">
                          <span className={`status-badge ${restaurant.is_active ? 'active' : 'inactive'}`}>
                            {restaurant.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'visiinias' && (
            <div className="content-section">
              <div className="section-header">
                <h1>Menu Items</h1>
                <button 
                  className="add-btn"
                  onClick={() => setShowAddVisinia(true)}
                  disabled={restaurants.length === 0}
                >
                  <span>+</span>
                  <span>Add Menu Item</span>
                </button>
              </div>

              {restaurants.length === 0 && (
                <div className="info-message">
                  Add a restaurant first before creating menu items
                </div>
              )}

              {loading ? (
                <div className="loading-state">Loading...</div>
              ) : visiinias.length === 0 && restaurants.length > 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🍽️</div>
                  <h3>No menu items yet</h3>
                  <p>Add your first menu item to your restaurant</p>
                </div>
              ) : (
                <div className="items-grid">
                  {visiinias.map(visinia => (
                    <div key={visinia.id} className="item-card">
                      <div className="card-image">
                        {visinia.image ? (
                          <img src={buildImageUrl(visinia.image)} alt={visinia.name} />
                        ) : (
                          <div className="image-placeholder">🍽️</div>
                        )}
                      </div>
                      <div className="card-content">
                        <h3>{visinia.name}</h3>
                        <p className="price">${visinia.price}</p>
                        {visinia.description && (
                          <p className="description">{visinia.description}</p>
                        )}
                        <div className="card-status">
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

          {activeTab === 'bookings' && (
            <div className="content-section">
              <div className="section-header">
                <h1>Orders</h1>
              </div>

              {loading ? (
                <div className="loading-state">Loading...</div>
              ) : bookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No orders yet</h3>
                  <p>Orders will appear here when customers place them</p>
                </div>
              ) : (
                <div className="orders-table">
                  <div className="table-header">
                    <div>Order ID</div>
                    <div>Customer</div>
                    <div>Status</div>
                    <div>Total</div>
                    <div>Actions</div>
                  </div>
                  <div className="table-body">
                    {bookings.map(booking => (
                      <div key={booking.id} className="table-row">
                        <div className="order-id">#{booking.id}</div>
                        <div className="customer">{booking.customer?.username || 'Unknown'}</div>
                        <div>
                          <span className={`status-badge ${booking.status.toLowerCase()}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="total">${booking.total_price}</div>
                        <div className="actions">
                          {booking.status === 'PENDING' && (
                            <button 
                              className="action-btn confirm"
                              onClick={() => handleConfirmBooking(booking.id)}
                            >
                              Confirm
                            </button>
                          )}
                          {booking.status === 'CONFIRMED' && (
                            <button 
                              className="action-btn complete"
                              onClick={() => handleCompleteBooking(booking.id)}
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Add Restaurant Modal */}
      {showAddRestaurant && (
        <div className="modal-overlay" onClick={() => setShowAddRestaurant(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Restaurant</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowAddRestaurant(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddRestaurant} className="modal-form">
              <div className="form-group">
                <label>Restaurant Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Enter restaurant name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your restaurant"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  required
                  placeholder="Enter address"
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({...formData, logo: e.target.files[0]})}
                  className="file-input"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddRestaurant(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {showAddVisinia && (
        <div className="modal-overlay" onClick={() => setShowAddVisinia(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Menu Item</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowAddVisinia(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddVisinia} className="modal-form">
              <div className="form-group">
                <label>Restaurant *</label>
                <select
                  value={visioniaData.restaurant}
                  onChange={(e) => setVisioniaData({...visioniaData, restaurant: e.target.value})}
                  required
                >
                  <option value="">Select Restaurant</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  value={visioniaData.name}
                  onChange={(e) => setVisioniaData({...visioniaData, name: e.target.value})}
                  required
                  placeholder="Enter item name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={visioniaData.description}
                  onChange={(e) => setVisioniaData({...visioniaData, description: e.target.value})}
                  placeholder="Describe the menu item"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={visioniaData.price}
                  onChange={(e) => setVisioniaData({...visioniaData, price: e.target.value})}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setVisioniaData({...visioniaData, image: e.target.files[0]})}
                  className="file-input"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddVisinia(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
