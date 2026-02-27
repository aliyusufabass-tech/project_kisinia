import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI, visioniaAPI, bookingAPI } from '../api/endpoints';
import { buildImageUrl } from '../api/client';
import './CustomerDashboard.css';

const AUTO_RESTAURANT_IMAGES = [
  '/media/restaurants/Image_fx_3.png',
  '/media/restaurants/Image_fx_4.png',
  '/media/restaurants/Image_fx_9.png',
  '/media/restaurants/poaz_logo.jpg',
  '/media/restaurants/taste_me.jpeg',
];

const AUTO_MENU_IMAGES = [
  '/media/visiinias/kisinia_cha_kushiba.png',
  '/media/visiinias/kisinia_cha_kujiramba.png',
  '/media/visiinias/kisinia_cha_mzuka.png',
  '/media/visiinias/kisinia_cha_poaz.png',
  '/media/visiinias/kisinia_cha_washkaji.png',
  '/media/visiinias/Image_fx_11.png',
  '/media/visiinias/Image_fx_7.png',
];

function hashSeed(value) {
  const text = String(value || '');
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickAutoImage(imagePool, seed) {
  if (!imagePool.length) {
    return null;
  }
  return imagePool[hashSeed(seed) % imagePool.length];
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [visiinias, setVisiinias] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [failedImages, setFailedImages] = useState({});
  const [failedFallbackImages, setFailedFallbackImages] = useState({});
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState({ title: '', content: '' });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      setError('Please log in to continue');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // Verify user is a customer or superuser
    try {
      const parsedUser = JSON.parse(userData);
      const role = localStorage.getItem('role');
      
      // Allow superusers and customers
      if (parsedUser.is_superuser) {
        // Superuser accessing customer dashboard - allow but show warning
        setError('Superuser detected. You can access customer dashboard, but admin features are available at /admin');
        setTimeout(() => setError(''), 5000);
      } else if (role !== 'CUSTOMER') {
        setError('Access denied. Customer account required.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
    } catch {
      setError('Invalid session. Please log in again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
  }, [navigate]);

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
        setRestaurants(res.data.filter(r => r.is_active));
      } else if (tab === 'bookings') {
        const res = await bookingAPI.myBookings();
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setLoading(true);
    try {
      const res = await visioniaAPI.byRestaurant(restaurant.id);
      setVisiinias(res.data.filter(v => v.is_available));
    } catch (err) {
      console.error('Error fetching visiinias:', err);
      setError(err.response?.data?.detail || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (visinia) => {
    const existingItem = cart.find(item => item.id === visinia.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === visinia.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...visinia, quantity: 1 }]);
    }
    setSuccess(`${visinia.name} added to cart!`);
  };

  const handleUpdateQuantity = (visioniaId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(visioniaId);
    } else {
      setCart(cart.map(item =>
        item.id === visioniaId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const handleRemoveFromCart = (visioniaId) => {
    const item = cart.find(item => item.id === visioniaId);
    setCart(cart.filter(item => item.id !== visioniaId));
    setSuccess(`${item.name} removed from cart`);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError('Cart is empty!');
      return;
    }

    try {
      const items = cart.map(item => ({ [item.id]: item.quantity }));
      await bookingAPI.create({
        restaurant_id: selectedRestaurant.id,
        items,
        notes: bookingNotes,
      });
      setSuccess('Order placed successfully!');
      setCart([]);
      setShowBookingForm(false);
      setBookingNotes('');
      setSelectedRestaurant(null);
      setActiveTab('bookings');
      fetchData('bookings');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place order');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const truncateDescription = (description, maxLines = 5) => {
    if (!description) return '';
    
    const lines = description.split('\n');
    if (lines.length <= maxLines) return description;
    
    return lines.slice(0, maxLines).join('\n');
  };

  const shouldShowViewMore = (description, maxLines = 5) => {
    if (!description) return false;
    return description.split('\n').length > maxLines;
  };

  const handleViewDescription = (title, content) => {
    setSelectedDescription({ title, content });
    setShowDescriptionModal(true);
  };

  const getRestaurantImageData = (restaurant) => {
    const key = `restaurant-${restaurant.id}`;
    const primaryPath = restaurant.logo_file_url || restaurant.logo;
    const fallbackPath = pickAutoImage(AUTO_RESTAURANT_IMAGES, `${restaurant.id}-${restaurant.name}`);
    const usePrimary = Boolean(primaryPath) && !failedImages[key];
    const srcPath = usePrimary ? primaryPath : fallbackPath;

    return {
      key,
      src: srcPath ? buildImageUrl(srcPath) : null,
      usePrimary,
      fallbackFailed: Boolean(failedFallbackImages[key]),
    };
  };

  const getVisiniaImageData = (visinia) => {
    const key = `visinia-${visinia.id}`;
    const primaryPath = visinia.image_file_url || visinia.image;
    const fallbackPath = pickAutoImage(AUTO_MENU_IMAGES, `${visinia.id}-${visinia.name}`);
    const usePrimary = Boolean(primaryPath) && !failedImages[key];
    const srcPath = usePrimary ? primaryPath : fallbackPath;

    return {
      key,
      src: srcPath ? buildImageUrl(srcPath) : null,
      usePrimary,
      fallbackFailed: Boolean(failedFallbackImages[key]),
    };
  };

  return (
    <div className="customer-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="brand">
            <span className="brand-icon">🍽️</span>
            <span className="brand-text">Kisinia Customer</span>
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
              <span>Browse</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <span className="nav-icon">📋</span>
              <span>My Orders</span>
            </button>
            {cart.length > 0 && (
              <button 
                className="nav-item cart-btn"
                onClick={() => setShowBookingForm(true)}
              >
                <span className="nav-icon">🛒</span>
                <span>Cart ({getCartItemCount()})</span>
              </button>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeTab === 'restaurants' && (
            <div className="content-section">
              {!selectedRestaurant ? (
                <>
                  <div className="section-header">
                    <h1>Browse Restaurants</h1>
                  </div>

                  {loading ? (
                    <div className="loading-state">Loading restaurants...</div>
                  ) : restaurants.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🏪</div>
                      <h3>No restaurants available</h3>
                      <p>Check back later for available restaurants</p>
                    </div>
                  ) : (
                    <div className="restaurants-grid">
                      {restaurants.map(restaurant => {
                        const imageData = getRestaurantImageData(restaurant);
                        return (
                        <div 
                          key={restaurant.id}
                          className="restaurant-card clickable"
                          onClick={() => handleSelectRestaurant(restaurant)}
                        >
                          <div className="card-image">
                            {imageData.src ? (
                              <img
                                src={imageData.src} 
                                alt={restaurant.name} 
                                onError={() => {
                                  if (imageData.usePrimary) {
                                    setFailedImages((prev) => ({ ...prev, [imageData.key]: true }));
                                  } else {
                                    setFailedFallbackImages((prev) => ({
                                      ...prev,
                                      [imageData.key]: true,
                                    }));
                                  }
                                }}
                              />
                            ) : null}
                            {(imageData.fallbackFailed || !imageData.src) && (
                              <div className="image-placeholder">🏪</div>
                            )}
                          </div>
                          <div className="card-content">
                            <h3>{restaurant.name}</h3>
                            <p className="address">📍 {restaurant.address}</p>
                            <p className="phone">📞 {restaurant.phone}</p>
                            {restaurant.description && (
                              <div className="description-section">
                                <p className="description">
                                  {truncateDescription(restaurant.description)}
                                </p>
                                {shouldShowViewMore(restaurant.description) && (
                                  <button 
                                    className="view-more-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDescription(restaurant.name, restaurant.description);
                                    }}
                                  >
                                    View More
                                  </button>
                                )}
                              </div>
                            )}
                            <button className="browse-btn">
                              View Menu →
                            </button>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="restaurant-header">
                    <button 
                      className="back-btn"
                      onClick={() => {
                        setSelectedRestaurant(null);
                        setCart([]);
                      }}
                    >
                      ← Back to Restaurants
                    </button>
                    <h1>{selectedRestaurant.name}</h1>
                    {cart.length > 0 && (
                      <div className="cart-summary">
                        <span>Items: {getCartItemCount()}</span>
                        <span className="total">Total: ${getTotalPrice()}</span>
                      </div>
                    )}
                  </div>

                  {loading ? (
                    <div className="loading-state">Loading menu...</div>
                  ) : visiinias.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🍽️</div>
                      <h3>No menu items available</h3>
                      <p>This restaurant doesn't have any available items</p>
                    </div>
                  ) : (
                    <div className="menu-grid">
                      {visiinias.map(visinia => {
                        const imageData = getVisiniaImageData(visinia);
                        return (
                        <div key={visinia.id} className="menu-item-card">
                          <div className="card-image">
                            {imageData.src ? (
                              <img
                                src={imageData.src} 
                                alt={visinia.name} 
                                onError={() => {
                                  if (imageData.usePrimary) {
                                    setFailedImages((prev) => ({ ...prev, [imageData.key]: true }));
                                  } else {
                                    setFailedFallbackImages((prev) => ({
                                      ...prev,
                                      [imageData.key]: true,
                                    }));
                                  }
                                }}
                              />
                            ) : null}
                            {(imageData.fallbackFailed || !imageData.src) && (
                              <div className="image-placeholder">🍽️</div>
                            )}
                          </div>
                          <div className="card-content">
                            <h3>{visinia.name}</h3>
                            <p className="price">${visinia.price}</p>
                            {visinia.description && (
                              <div className="description-section">
                                <p className="description">
                                  {truncateDescription(visinia.description)}
                                </p>
                                {shouldShowViewMore(visinia.description) && (
                                  <button 
                                    className="view-more-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDescription(visinia.name, visinia.description);
                                    }}
                                  >
                                    View More
                                  </button>
                                )}
                              </div>
                            )}
                            <button 
                              className="add-cart-btn"
                              onClick={() => handleAddToCart(visinia)}
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="content-section">
              <div className="section-header">
                <h1>My Orders</h1>
              </div>

              {loading ? (
                <div className="loading-state">Loading orders...</div>
              ) : bookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No orders yet</h3>
                  <p>Start browsing restaurants to place your first order</p>
                </div>
              ) : (
                <div className="bookings-grid">
                  {bookings.map(booking => (
                    <div key={booking.id} className="booking-card">
                      <div className="card-content">
                        <h3>Order #{booking.id}</h3>
                        <p className="restaurant-name">
                          <strong>Restaurant:</strong> {booking.restaurant_name}
                        </p>
                        <div className="status-section">
                          <span className={`status-badge ${booking.status.toLowerCase()}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="total-price">
                          <strong>Total:</strong> ${booking.total_price}
                        </p>
                        {booking.notes && (
                          <p className="notes">
                            <strong>Notes:</strong> {booking.notes}
                          </p>
                        )}
                        <div className="status-message">
                          {booking.status === 'PENDING' && (
                            <p className="message pending">⏰ Waiting for restaurant confirmation</p>
                          )}
                          {booking.status === 'CONFIRMED' && (
                            <p className="message confirmed">👨‍🍳 Restaurant is preparing your order</p>
                          )}
                          {booking.status === 'COMPLETED' && (
                            <p className="message completed">✅ Your order is ready!</p>
                          )}
                          {booking.status === 'CANCELLED' && (
                            <p className="message cancelled">❌ Order has been cancelled</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Cart Modal */}
      {showBookingForm && (
        <div className="modal-overlay" onClick={() => setShowBookingForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Your Order</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowBookingForm(false)}
              >
                ×
              </button>
            </div>
            
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p className="item-price">${item.price} x {item.quantity}</p>
                  </div>
                  <div className="quantity-control">
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="order-total">
              <strong>Total: ${getTotalPrice()}</strong>
            </div>

            <form onSubmit={handlePlaceOrder} className="modal-form">
              <div className="form-group">
                <textarea
                  placeholder="Add special requests or notes (optional)"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowBookingForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Place Order
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

