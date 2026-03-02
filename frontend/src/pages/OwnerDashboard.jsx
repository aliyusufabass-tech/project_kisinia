import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI, visioniaAPI, bookingAPI } from '../api/endpoints';
import { buildImageUrl } from '../api/client';
import './OwnerDashboard.css';

const RESTAURANT_LOGO_OPTIONS = [
  { value: 'restaurants/poaz_logo.jpg', label: 'Poaz Logo' },
  { value: 'restaurants/taste_me.jpeg', label: 'Taste Me Logo' },
  { value: 'restaurants/al_noor_food_beverage_logo.png', label: 'AL NOOR Food & Beverage Logo' },
];

const VISINIA_IMAGE_OPTIONS = [
  { value: 'visiinias/seafood_fried_rice.jpeg', label: 'Seafood Fried Rice' },
  { value: 'visiinias/seafood_rice_1pax.jpeg', label: 'Seafood Rice (1 Pax)' },
  { value: 'visiinias/kidebe_seafood_2pax.jpeg', label: 'Kidebe Seafood (2 Pax)' },
  { value: 'visiinias/seafood_kidebe_1pax.jpeg', label: 'Seafood Kidebe (1 Pax)' },
  { value: 'visiinias/goat_biriyan.jpeg', label: 'Goat Biryani' },
  { value: 'visiinias/chicken_biriyan.jpeg', label: 'Chicken Biryani' },
  { value: 'visiinias/vegetable_biriyan.jpeg', label: 'Vegetable Biryani' },
  { value: 'visiinias/shrimp.jpeg', label: 'Shrimp Rice Plate' },
];

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [visiinias, setVisiinias] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditRestaurant, setShowEditRestaurant] = useState(false);
  const [showAddVisinia, setShowAddVisinia] = useState(false);
  const [showEditVisinia, setShowEditVisinia] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editingVisinia, setEditingVisinia] = useState(null);
  const [failedImages, setFailedImages] = useState({});
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    logo_choice: '',
  });

  const [visioniaData, setVisioniaData] = useState({
    name: '',
    description: '',
    price: '',
    restaurant: '',
    image_choice: '__auto__',
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

  const parseApiError = (err, fallback) => {
    const errorData = err.response?.data;
    if (!errorData) return fallback;
    if (typeof errorData === 'string') return errorData;
    if (typeof errorData.detail === 'string') return errorData.detail;
    return Object.entries(errorData)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
      .join('\n');
  };

  const handleEditRestaurant = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.name || !formData.address || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await restaurantAPI.update(editingRestaurant.id, {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        logo_choice: formData.logo_choice,
      });
      setFormData({ name: '', description: '', address: '', phone: '', logo_choice: '' });
      setEditingRestaurant(null);
      setShowEditRestaurant(false);
      setSuccess('Restaurant updated successfully!');
      fetchData('restaurants');
    } catch (err) {
      setError(parseApiError(err, 'Failed to update restaurant'));
    }
  };

  const handleToggleRestaurantStatus = async (id, currentStatus) => {
    try {
      const data = {
        name: restaurants.find(r => r.id === id).name,
        description: restaurants.find(r => r.id === id).description,
        address: restaurants.find(r => r.id === id).address,
        phone: restaurants.find(r => r.id === id).phone,
        is_active: !currentStatus
      };
      
      await restaurantAPI.update(id, data);
      setSuccess(`Restaurant ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchData('restaurants');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to toggle restaurant status');
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this restaurant? This will also delete all menu items associated with it.')) {
      return;
    }

    try {
      await restaurantAPI.delete(id);
      setSuccess('Restaurant deleted successfully!');
      fetchData('restaurants');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete restaurant');
    }
  };

  const openEditRestaurant = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      description: restaurant.description || '',
      address: restaurant.address,
      phone: restaurant.phone,
      logo_choice: '',
    });
    setShowEditRestaurant(true);
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
      await visioniaAPI.create({
        name: visioniaData.name,
        description: visioniaData.description,
        price: visioniaData.price,
        restaurant: visioniaData.restaurant,
        image_choice: visioniaData.image_choice,
      });
      setVisioniaData({ name: '', description: '', price: '', restaurant: '', image_choice: '__auto__' });
      setShowAddVisinia(false);
      setSuccess('Menu item added successfully!');
      fetchData('visiinias');
    } catch (err) {
      setError(parseApiError(err, 'Failed to add menu item'));
    }
  };

  const handleEditVisinia = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!visioniaData.name || !visioniaData.price || !visioniaData.restaurant) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await visioniaAPI.update(editingVisinia.id, {
        name: visioniaData.name,
        description: visioniaData.description,
        price: visioniaData.price,
        restaurant: visioniaData.restaurant,
        image_choice: visioniaData.image_choice,
      });
      setVisioniaData({ name: '', description: '', price: '', restaurant: '', image_choice: '__auto__' });
      setEditingVisinia(null);
      setShowEditVisinia(false);
      setSuccess('Menu item updated successfully!');
      fetchData('visiinias');
    } catch (err) {
      setError(parseApiError(err, 'Failed to update menu item'));
    }
  };

  const handleToggleVisiniaAvailability = async (id, currentAvailability) => {
    try {
      const data = {
        name: visiinias.find(v => v.id === id).name,
        description: visiinias.find(v => v.id === id).description,
        price: visiinias.find(v => v.id === id).price,
        restaurant: visiinias.find(v => v.id === id).restaurant,
        is_available: !currentAvailability
      };
      
      await visioniaAPI.update(id, data);
      setSuccess(`Menu item ${!currentAvailability ? 'made available' : 'made unavailable'} successfully!`);
      fetchData('visiinias');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to toggle menu item availability');
    }
  };

  const handleDeleteVisinia = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await visioniaAPI.delete(id);
      setSuccess('Menu item deleted successfully!');
      fetchData('visiinias');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete menu item');
    }
  };

  const openEditVisinia = (visinia) => {
    setEditingVisinia(visinia);
    setVisioniaData({
      name: visinia.name,
      description: visinia.description || '',
      price: visinia.price,
      restaurant: visinia.restaurant,
      image_choice: '',
    });
    setShowEditVisinia(true);
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

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await bookingAPI.cancel(id);
      setSuccess('Order cancelled!');
      fetchData('bookings');
    } catch (err) {
      setError('Failed to cancel order');
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
              </div>

              {loading ? (
                <div className="loading-state">Loading...</div>
              ) : restaurants.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏪</div>
                  <h3>No restaurants yet</h3>
                  <p>Admin will assign restaurants to owners.</p>
                </div>
              ) : (
                <div className="restaurants-grid">
                  {restaurants.map(restaurant => (
                    <div key={restaurant.id} className="restaurant-card">
                      <div className="card-image">
                        {(restaurant.logo || restaurant.logo_file_url) && !failedImages[`restaurant-${restaurant.id}`] ? (
                          <img
                            src={buildImageUrl(restaurant.logo || restaurant.logo_file_url)}
                            alt={restaurant.name}
                            onError={() => setFailedImages((prev) => ({ ...prev, [`restaurant-${restaurant.id}`]: true }))}
                          />
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
                          <div className="status-toggle">
                            <span className={`status-badge ${restaurant.is_active ? 'active' : 'inactive'}`}>
                              {restaurant.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={restaurant.is_active}
                                onChange={() => handleToggleRestaurantStatus(restaurant.id, restaurant.is_active)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </div>
                        </div>
                        <div className="card-actions">
                          <button 
                            className="action-btn edit"
                            onClick={() => openEditRestaurant(restaurant)}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteRestaurant(restaurant.id)}
                          >
                            🗑️ Delete
                          </button>
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
                        {(visinia.image || visinia.image_file_url) && !failedImages[`visinia-${visinia.id}`] ? (
                          <img
                            src={buildImageUrl(visinia.image || visinia.image_file_url)}
                            alt={visinia.name}
                            onError={() => setFailedImages((prev) => ({ ...prev, [`visinia-${visinia.id}`]: true }))}
                          />
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
                          <div className="status-toggle">
                            <span className={`status-badge ${visinia.is_available ? 'available' : 'unavailable'}`}>
                              {visinia.is_available ? 'Available' : 'Not Available'}
                            </span>
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={visinia.is_available}
                                onChange={() => handleToggleVisiniaAvailability(visinia.id, visinia.is_available)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </div>
                        </div>
                        <div className="card-actions">
                          <button 
                            className="action-btn edit"
                            onClick={() => openEditVisinia(visinia)}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteVisinia(visinia.id)}
                          >
                            🗑️ Delete
                          </button>
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
                            <>
                              <button 
                                className="action-btn confirm"
                                onClick={() => handleConfirmBooking(booking.id)}
                              >
                                Confirm
                              </button>
                              <button 
                                className="action-btn cancel"
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                Cancel
                              </button>
                            </>
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


      {/* Edit Restaurant Modal */}
      {showEditRestaurant && (
        <div className="modal-overlay" onClick={() => setShowEditRestaurant(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Restaurant</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowEditRestaurant(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditRestaurant} className="modal-form">
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
                <label>Logo (optional)</label>
                <select
                  value={formData.logo_choice}
                  onChange={(e) => setFormData({ ...formData, logo_choice: e.target.value })}
                >
                  <option value="">Keep current logo</option>
                  <option value="__auto__">Auto choose logo</option>
                  {RESTAURANT_LOGO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {(formData.logo_choice && formData.logo_choice !== '__auto__') && (
                  <img
                    src={buildImageUrl(formData.logo_choice)}
                    alt="Selected logo preview"
                    style={{ marginTop: 8, width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                <p className="auto-image-note">Select a logo from available images or keep the current one.</p>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditRestaurant(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Restaurant
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
                <label>Image (optional)</label>
                <select
                  value={visioniaData.image_choice}
                  onChange={(e) => setVisioniaData({ ...visioniaData, image_choice: e.target.value })}
                >
                  <option value="__auto__">Auto choose image</option>
                  {VISINIA_IMAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {(visioniaData.image_choice && visioniaData.image_choice !== '__auto__') && (
                  <img
                    src={buildImageUrl(visioniaData.image_choice)}
                    alt="Selected menu preview"
                    style={{ marginTop: 8, width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                <p className="auto-image-note">Select an image from the available menu images.</p>
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

      {/* Edit Menu Item Modal */}
      {showEditVisinia && (
        <div className="modal-overlay" onClick={() => setShowEditVisinia(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Menu Item</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowEditVisinia(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditVisinia} className="modal-form">
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
                <label>Image (optional)</label>
                <select
                  value={visioniaData.image_choice}
                  onChange={(e) => setVisioniaData({ ...visioniaData, image_choice: e.target.value })}
                >
                  <option value="">Keep current image</option>
                  <option value="__auto__">Auto choose image</option>
                  {VISINIA_IMAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {(visioniaData.image_choice && visioniaData.image_choice !== '__auto__') && (
                  <img
                    src={buildImageUrl(visioniaData.image_choice)}
                    alt="Selected menu preview"
                    style={{ marginTop: 8, width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                <p className="auto-image-note">Select a new image or keep the current one.</p>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditVisinia(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}



