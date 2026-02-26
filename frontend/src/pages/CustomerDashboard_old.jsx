import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI, visioniaAPI, bookingAPI } from '../api/endpoints';
import { buildImageUrl } from '../api/client';
import './CustomerDashboard.css';

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
      } else if (tab === 'bookings') {
        const res = await bookingAPI.myBookings();
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setLoading(true);
    try {
      const res = await visioniaAPI.byRestaurant(restaurant.id);
      setVisiinias(res.data);
    } catch (err) {
      console.error('Error fetching visiinias:', err);
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
    setCart(cart.filter(item => item.id !== visioniaId));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      const items = cart.map(item => ({ [item.id]: item.quantity }));
      await bookingAPI.create({
        restaurant_id: selectedRestaurant.id,
        items,
        notes: bookingNotes,
      });
      alert('Order placed successfully!');
      setCart([]);
      setShowBookingForm(false);
      setBookingNotes('');
      setActiveTab('bookings');
      fetchData('bookings');
    } catch (err) {
      alert('Error placing order');
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">🍽️ Kisinia - Customer</div>
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
                🏪 Browse
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                📋 My Orders
              </button>
            </li>
            {cart.length > 0 && (
              <li>
                <button 
                  className="nav-btn cart-btn"
                  onClick={() => setShowBookingForm(true)}
                >
                  🛒 Cart ({cart.length})
                </button>
              </li>
            )}
          </ul>
        </aside>

        <main className="content">
          {activeTab === 'restaurants' && (
            <section>
              {!selectedRestaurant ? (
                <>
                  <h2>Browse Restaurants</h2>
                  {loading ? (
                    <p>Loading...</p>
                  ) : (
                    <div className="restaurants-grid">
                      {restaurants.map(restaurant => (
                        <div 
                          key={restaurant.id}
                          className="restaurant-card clickable"
                          onClick={() => handleSelectRestaurant(restaurant)}
                        >
                          <div className="item-image-container">
                            {restaurant.logo && restaurant.logo.trim() ? (
                              <>
                                {!loadedImages[`restaurant-${restaurant.id}`] && (
                                  <div className="item-image-placeholder">🏪</div>
                                )}
                                <img
                                  src={buildImageUrl(restaurant.logo)} 
                                  alt={restaurant.name} 
                                  className="item-image" 
                                  onLoad={() => setLoadedImages({...loadedImages, [`restaurant-${restaurant.id}`]: true})}
                                  onError={() => setFailedImages({...failedImages, [`restaurant-${restaurant.id}`]: true})}
                                  style={{display: failedImages[`restaurant-${restaurant.id}`] ? 'none' : 'block'}}
                                />
                              </>
                            ) : (
                              <div className="item-image-placeholder">🏪</div>
                            )}
                          </div>
                          <h3>{restaurant.name}</h3>
                          <p className="address">📍 {restaurant.address}</p>
                          <p className="phone">📞 {restaurant.phone}</p>
                          <p className="description">{restaurant.description}</p>
                          <button className="btn-browse">View Menu →</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="restaurant-header">
                    <button 
                      className="btn-back"
                      onClick={() => {
                        setSelectedRestaurant(null);
                        setCart([]);
                      }}
                    >
                      ← Back to Restaurants
                    </button>
                    <h2>{selectedRestaurant.name}</h2>
                    {cart.length > 0 && (
                      <div className="cart-summary">
                        <span>Items in cart: {cart.length}</span>
                        <span className="total">Total: ${getTotalPrice()}</span>
                      </div>
                    )}
                  </div>

                  {loading ? (
                    <p>Loading menu...</p>
                  ) : (
                    <div className="menu-grid">
                      {visiinias.map(visinia => (
                        <div key={visinia.id} className="menu-item">
                          <div className="item-image-container">
                            <div className="item-image-placeholder">🍽️</div>
                            {visinia.image && visinia.image.trim() ? (
                              <>
                                {!loadedImages[`visinia-${visinia.id}`] && (
                                  <div className="item-image-placeholder">🍽️</div>
                                )}
                                <img
                                  src={buildImageUrl(visinia.image)} 
                                  alt={visinia.name} 
                                  className="item-image" 
                                  onLoad={() => setLoadedImages({...loadedImages, [`visinia-${visinia.id}`]: true})}
                                  onError={() => setFailedImages({...failedImages, [`visinia-${visinia.id}`]: true})}
                                  style={{display: failedImages[`visinia-${visinia.id}`] ? 'none' : 'block'}}
                                />
                              </>
                            ) : (
                              <div className="item-image-placeholder">🍽️</div>
                            )}
                          </div>
                          <h3>{visinia.name}</h3>
                          <p className="description">{visinia.description}</p>
                          <p className="price">${visinia.price}</p>
                          {visinia.is_available ? (
                            <button 
                              className="btn-add-cart"
                              onClick={() => handleAddToCart(visinia)}
                            >
                              Add to Cart
                            </button>
                          ) : (
                            <button className="btn-unavailable" disabled>Not Available</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeTab === 'bookings' && (
            <section>
              <h2>My Orders</h2>
              {loading ? (
                <p>Loading...</p>
              ) : bookings.length === 0 ? (
                <p className="no-data">No orders yet. Start browsing restaurants!</p>
              ) : (
                <div className="bookings-grid">
                  {bookings.map(booking => (
                    <div key={booking.id} className="booking-card">
                      <h3>Order #{booking.id}</h3>
                      <p><strong>Restaurant:</strong> {booking.restaurant_name}</p>
                      <p><strong>Status:</strong> <span className={`status ${booking.status.toLowerCase()}`}>{booking.status}</span></p>
                      <p><strong>Total:</strong> ${booking.total_price}</p>
                      <p className="notes"><strong>Notes:</strong> {booking.notes || 'None'}</p>
                      {booking.status === 'PENDING' && (
                        <p className="info">Waiting for restaurant confirmation</p>
                      )}
                      {booking.status === 'CONFIRMED' && (
                        <p className="info">Restaurant is preparing your order</p>
                      )}
                      {booking.status === 'COMPLETED' && (
                        <p className="info success">Your order is ready!</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {showBookingForm && (
            <div className="modal-overlay" onClick={() => setShowBookingForm(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Review Your Order</h3>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div>
                        <strong>{item.name}</strong>
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
                        className="btn-remove"
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

                <form onSubmit={handlePlaceOrder}>
                  <textarea
                    placeholder="Add special requests or notes"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                  />
                  <div className="modal-buttons">
                    <button type="submit" className="btn-success">Place Order</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowBookingForm(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
