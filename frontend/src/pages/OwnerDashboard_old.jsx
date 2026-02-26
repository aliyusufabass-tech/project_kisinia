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
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loadedImages, setLoadedImages] = useState({});
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

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'restaurants') {
        const res = await restaurantAPI.myRestaurants();
        setRestaurants(res.data);
      } else if (tab === 'visiinias') {
        const res = await visioniaAPI.list();
        // Filter for owner's restaurants
        const ownerRes = await restaurantAPI.myRestaurants();
        const ownerIds = ownerRes.data.map(r => r.id);
        setVisiinias(res.data.filter(v => ownerIds.includes(v.restaurant)));
      } else if (tab === 'bookings') {
        const res = await bookingAPI.list();
        setBookings(res.data);
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

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
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
      fetchData('restaurants');
    } catch (err) {
      alert('Error adding restaurant');
    }
  };

  const handleAddVisinia = async (e) => {
    e.preventDefault();
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
      fetchData('visiinias');
    } catch (err) {
      alert('Error adding menu item');
    }
  };

  const handleConfirmBooking = async (id) => {
    try {
      await bookingAPI.confirm(id);
      fetchData('bookings');
    } catch (err) {
      alert('Error confirming booking');
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

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">🍽️ Kisinia - Restaurant Owner</div>
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
                🏪 My Restaurants
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
            <li>
              <button 
                className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                📋 Orders
              </button>
            </li>
          </ul>
        </aside>

        <main className="content">
          {activeTab === 'restaurants' && (
            <section>
              <div className="section-header">
                <h2>My Restaurants</h2>
                <button 
                  className="btn-primary"
                  onClick={() => setShowAddRestaurant(true)}
                >
                  + Add Restaurant
                </button>
              </div>

              {showAddRestaurant && (
                <div className="modal-overlay" onClick={() => setShowAddRestaurant(false)}>
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <h3>Add New Restaurant</h3>
                    <form onSubmit={handleAddRestaurant}>
                      <input
                        type="text"
                        placeholder="Restaurant Name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                      <textarea
                        placeholder="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                      <input
                        type="text"
                        placeholder="Address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                      />
                      <input
                        type="file"
                        onChange={(e) => setFormData({...formData, logo: e.target.files[0]})}
                      />
                      <div className="modal-buttons">
                        <button type="submit" className="btn-success">Add</button>
                        <button type="button" className="btn-secondary" onClick={() => setShowAddRestaurant(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="restaurants-grid">
                  {restaurants.map(restaurant => (
                    <div key={restaurant.id} className="restaurant-card">
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
                      <p className="status">
                        {restaurant.is_active ? '✓ Active' : '✗ Inactive'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'visiinias' && (
            <section>
              <div className="section-header">
                <h2>Menu Items</h2>
                <button 
                  className="btn-primary"
                  onClick={() => setShowAddVisinia(true)}
                >
                  + Add Menu Item
                </button>
              </div>

              {showAddVisinia && (
                <div className="modal-overlay" onClick={() => setShowAddVisinia(false)}>
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <h3>Add Menu Item</h3>
                    <form onSubmit={handleAddVisinia}>
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
                      <input
                        type="text"
                        placeholder="Item Name"
                        value={visioniaData.name}
                        onChange={(e) => setVisioniaData({...visioniaData, name: e.target.value})}
                        required
                      />
                      <textarea
                        placeholder="Description"
                        value={visioniaData.description}
                        onChange={(e) => setVisioniaData({...visioniaData, description: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        step="0.01"
                        value={visioniaData.price}
                        onChange={(e) => setVisioniaData({...visioniaData, price: e.target.value})}
                        required
                      />
                      <input
                        type="file"
                        onChange={(e) => setVisioniaData({...visioniaData, image: e.target.files[0]})}
                      />
                      <div className="modal-buttons">
                        <button type="submit" className="btn-success">Add</button>
                        <button type="button" className="btn-secondary" onClick={() => setShowAddVisinia(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="items-grid">
                  {visiinias.map(visinia => (
                    <div key={visinia.id} className="item-card">
                      <div className="item-image-container">
                        {visinia.image ? (
                          <img src={buildImageUrl(visinia.image)} alt={visinia.name} className="item-image" />
                        ) : (
                          <div className="item-image-placeholder">🍽️</div>
                        )}
                      </div>
                      <h3>{visinia.name}</h3>
                      <p className="description">{visinia.description}</p>
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

          {activeTab === 'bookings' && (
            <section>
              <h2>Orders</h2>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(booking => (
                        <tr key={booking.id}>
                          <td>#{booking.id}</td>
                          <td>{booking.customer_name}</td>
                          <td><span className={`status ${booking.status.toLowerCase()}`}>{booking.status}</span></td>
                          <td>${booking.total_price}</td>
                          <td>
                            {booking.status === 'PENDING' && (
                              <button 
                                className="btn-confirm"
                                onClick={() => handleConfirmBooking(booking.id)}
                              >
                                Confirm
                              </button>
                            )}
                            {booking.status === 'CONFIRMED' && (
                              <button 
                                className="btn-complete"
                                onClick={() => handleCompleteBooking(booking.id)}
                              >
                                Complete
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
        </main>
      </div>
    </div>
  );
}
