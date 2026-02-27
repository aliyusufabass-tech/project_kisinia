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
  const [showEditRestaurant, setShowEditRestaurant] = useState(false);
  const [showAddVisinia, setShowAddVisinia] = useState(false);
  const [showEditVisinia, setShowEditVisinia] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editingVisinia, setEditingVisinia] = useState(null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
  const [failedImages, setFailedImages] = useState({});
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
      } else if (tab === 'gallery') {
        const ownerRes = await restaurantAPI.myRestaurants();
        setRestaurants(ownerRes.data);
        const ownerIds = ownerRes.data.map(r => r.id);
        const res = await visioniaAPI.list();
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

  const handleEditRestaurant = async (e) => {
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

      await restaurantAPI.update(editingRestaurant.id, data);
      setFormData({ name: '', description: '', address: '', phone: '', logo: null });
      setEditingRestaurant(null);
      setShowEditRestaurant(false);
      setSuccess('Restaurant updated successfully!');
      fetchData('restaurants');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update restaurant');
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
      logo: null,
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

  const handleEditVisinia = async (e) => {
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

      await visioniaAPI.update(editingVisinia.id, data);
      setVisioniaData({ name: '', description: '', price: '', restaurant: '', image: null });
      setEditingVisinia(null);
      setShowEditVisinia(false);
      setSuccess('Menu item updated successfully!');
      fetchData('visiinias');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update menu item');
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
      image: null,
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

  const galleryImages = [
    ...restaurants
      .filter((restaurant) => !!(restaurant.logo_file_url || restaurant.logo))
      .map((restaurant) => ({
        id: `restaurant-${restaurant.id}`,
        title: restaurant.name,
        subtitle: 'Restaurant logo',
        image: restaurant.logo_file_url || restaurant.logo,
      })),
    ...visiinias
      .filter((visinia) => !!(visinia.image_file_url || visinia.image))
      .map((visinia) => ({
        id: `visinia-${visinia.id}`,
        title: visinia.name,
        subtitle: 'Menu image',
        image: visinia.image_file_url || visinia.image,
      })),
  ];

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
            <button
              className={`nav-item ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setActiveTab('gallery')}
            >
              <span className="nav-icon">IMG</span>
              <span>Gallery</span>
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
                        {(restaurant.logo_file_url || restaurant.logo) && !failedImages[`restaurant-${restaurant.id}`] ? (
                          <img
                            src={buildImageUrl(restaurant.logo_file_url || restaurant.logo)}
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
                        {(visinia.image_file_url || visinia.image) && !failedImages[`visinia-${visinia.id}`] ? (
                          <img
                            src={buildImageUrl(visinia.image_file_url || visinia.image)}
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

          {activeTab === 'gallery' && (
            <div className="content-section">
              <div className="section-header">
                <h1>Uploaded Pictures</h1>
              </div>

              {loading ? (
                <div className="loading-state">Loading...</div>
              ) : galleryImages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">IMG</div>
                  <h3>No pictures uploaded yet</h3>
                  <p>Upload restaurant logos and menu images to see them here</p>
                </div>
              ) : (
                <div className="gallery-grid">
                  {galleryImages.map((item) => (
                    <button
                      key={item.id}
                      className="gallery-card"
                      onClick={() => setSelectedGalleryImage(item)}
                    >
                      {failedImages[`gallery-${item.id}`] ? (
                        <div className="image-placeholder">IMG</div>
                      ) : (
                        <img
                          src={buildImageUrl(item.image)}
                          alt={item.title}
                          onError={() => setFailedImages((prev) => ({ ...prev, [`gallery-${item.id}`]: true }))}
                        />
                      )}
                      <div className="gallery-meta">
                        <h4>{item.title}</h4>
                        <p>{item.subtitle}</p>
                      </div>
                    </button>
                  ))}
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
                <label>Logo (leave empty to keep current)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({...formData, logo: e.target.files[0]})}
                  className="file-input"
                />
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
                <label>Image (leave empty to keep current)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setVisioniaData({...visioniaData, image: e.target.files[0]})}
                  className="file-input"
                />
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

      {selectedGalleryImage && (
        <div className="modal-overlay" onClick={() => setSelectedGalleryImage(null)}>
          <div className="modal gallery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedGalleryImage.title}</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedGalleryImage(null)}
              >
                Close
              </button>
            </div>
            <div className="gallery-preview">
              {failedImages[`preview-${selectedGalleryImage.id}`] ? (
                <div className="image-placeholder">IMG</div>
              ) : (
                <img
                  src={buildImageUrl(selectedGalleryImage.image)}
                  alt={selectedGalleryImage.title}
                  onError={() => setFailedImages((prev) => ({ ...prev, [`preview-${selectedGalleryImage.id}`]: true }))}
                />
              )}
              <p>{selectedGalleryImage.subtitle}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



