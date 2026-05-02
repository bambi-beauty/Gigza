import React, { useState, useEffect } from "react";
import "./DJDashboard.css";
import { 
  FaBell, FaUser, FaCalendarAlt, FaMapMarkerAlt, 
  FaMusic, FaStar, FaDollarSign, FaChartLine, 
  FaEdit, FaUpload, FaCheckCircle, FaClock, 
  FaTimesCircle, FaEnvelope, FaPhone, FaSignOutAlt,
  FaCamera, FaVideo, FaHeadphones, FaHeart, FaShare
} from "react-icons/fa";

function DJDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [djProfile, setDjProfile] = useState({
    name: "DJ SpinMaster",
    email: "",
    phone: "",
    location: "Cape Town, SA",
    experience: "5+ years",
    genres: ["House", "Afrobeat", "Amapiano", "Hip Hop"],
    pricePerHour: 1500,
    bio: "Professional DJ with 5+ years experience in weddings, corporate events, and clubs.",
    rating: 4.8,
    totalGigs: 47,
    successRate: 98
  });

  const [gigs, setGigs] = useState([
    {
      id: 1,
      eventName: "Sunset Beach Party",
      clientName: "Ocean View Events",
      location: "Camps Bay, Cape Town",
      date: "2026-05-15",
      time: "18:00 - 22:00",
      budget: 2500,
      status: "confirmed",
      requirements: "Deep house, Afrohouse",
      clientPhone: "+27 82 123 4567"
    },
    {
      id: 2,
      eventName: "Wedding Reception",
      clientName: "Sarah & Michael",
      location: "Stellenbosch, WC",
      date: "2026-05-20",
      time: "16:00 - 20:00",
      budget: 3000,
      status: "pending",
      requirements: "Soft house, R&B, slow songs for dinner",
      clientPhone: "+27 83 456 7890"
    },
    {
      id: 3,
      eventName: "Corporate Gala Dinner",
      clientName: "TechCorp SA",
      location: "Century City, Cape Town",
      date: "2026-05-10",
      time: "19:00 - 23:00",
      budget: 3500,
      status: "completed",
      requirements: "Corporate background music, jazz, lounge",
      clientPhone: "+27 84 789 0123"
    }
  ]);

  const [emergencyRequests, setEmergencyRequests] = useState([
    {
      id: 101,
      eventName: "URGENT: Birthday Party",
      location: "Sea Point, Cape Town",
      timeNeeded: "2 hours from now",
      budget: 2000,
      requirements: "Amapiano, Gqom",
      distance: "2.5 km away",
      postedTime: "5 minutes ago"
    },
    {
      id: 102,
      eventName: "Last Minute Club Night",
      location: "Long Street, Cape Town",
      timeNeeded: "4 hours from now",
      budget: 2500,
      requirements: "House, Techno",
      distance: "1.8 km away",
      postedTime: "15 minutes ago"
    }
  ]);

  const [portfolio, setPortfolio] = useState([
    { id: 1, type: "photo", url: "https://via.placeholder.com/300", title: "Wedding Set" },
    { id: 2, type: "photo", url: "https://via.placeholder.com/300", title: "Club Performance" },
    { id: 3, type: "video", url: "https://via.placeholder.com/300", title: "Live Mix Demo" }
  ]);

  const [reviews, setReviews] = useState([
    {
      id: 1,
      clientName: "John D.",
      rating: 5,
      comment: "Amazing DJ! Kept the crowd dancing all night.",
      date: "2026-05-01"
    },
    {
      id: 2,
      clientName: "Lisa M.",
      rating: 4.5,
      comment: "Professional and punctual. Great music selection.",
      date: "2026-04-28"
    }
  ]);

  const [earnings, setEarnings] = useState({
    total: 12500,
    pending: 3000,
    thisMonth: 5500
  });

  useEffect(() => {
    // Load user data from localStorage
    const userEmail = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");
    if (userEmail) setDjProfile(prev => ({ ...prev, email: userEmail }));
    if (userName) setDjProfile(prev => ({ ...prev, name: userName }));
  }, []);

  const handleAcceptEmergency = (requestId) => {
    if (window.confirm("Accept this emergency gig? You must arrive at the location within the specified time.")) {
      alert("Emergency gig accepted! The client will be notified. Navigate to the event location now.");
      setEmergencyRequests(emergencyRequests.filter(req => req.id !== requestId));
    }
  };

  const handleUpdateAvailability = (status) => {
    localStorage.setItem("djAvailability", status);
    alert(`You are now ${status === "available" ? "available for emergency gigs" : "offline"}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const StatsCard = ({ icon, title, value, color }) => (
    <div className="stats-card">
      <div className="stats-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="stats-info">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  return (
    <div className="dj-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo">
          <h1>GIGZA</h1>
          <span className="dj-badge">DJ Portal</span>
        </div>
        
        <div className="header-actions">
          <div className="availability-toggle">
            <button 
              className="avail-btn available"
              onClick={() => handleUpdateAvailability("available")}
            >
              <FaCheckCircle /> Available for Gigs
            </button>
            <button 
              className="avail-btn offline"
              onClick={() => handleUpdateAvailability("offline")}
            >
              <FaTimesCircle /> Offline
            </button>
          </div>
          
          <div className="notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
            <FaBell />
            {emergencyRequests.length > 0 && <span className="notification-badge">{emergencyRequests.length}</span>}
          </div>
          
          <div className="user-menu">
            <FaUser />
            <span>{djProfile.name}</span>
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="notification-panel">
          <h3>Emergency Requests ({emergencyRequests.length})</h3>
          {emergencyRequests.map(req => (
            <div key={req.id} className="emergency-notification">
              <div className="emergency-header">
                <span className="urgent-badge">URGENT</span>
                <span className="time-ago">{req.postedTime}</span>
              </div>
              <p className="event-name">{req.eventName}</p>
              <p className="location"><FaMapMarkerAlt /> {req.location} • {req.distance}</p>
              <p className="budget"><FaDollarSign /> {req.budget}</p>
              <p className="requirements">{req.requirements}</p>
              <button onClick={() => handleAcceptEmergency(req.id)}>Accept Gig</button>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav>
            <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
              <FaChartLine /> Dashboard
            </button>
            <button className={activeTab === "emergency" ? "active" : ""} onClick={() => setActiveTab("emergency")}>
              <FaClock /> Emergency Gigs
              {emergencyRequests.length > 0 && <span className="nav-badge">{emergencyRequests.length}</span>}
            </button>
            <button className={activeTab === "mygigs" ? "active" : ""} onClick={() => setActiveTab("mygigs")}>
              <FaCalendarAlt /> My Gigs
            </button>
            <button className={activeTab === "portfolio" ? "active" : ""} onClick={() => setActiveTab("portfolio")}>
              <FaUpload /> Portfolio
            </button>
            <button className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>
              <FaUser /> Profile
            </button>
            <button className={activeTab === "earnings" ? "active" : ""} onClick={() => setActiveTab("earnings")}>
              <FaDollarSign /> Earnings
            </button>
          </nav>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </aside>

        {/* Main Area */}
        <main className="main-area">
          {activeTab === "dashboard" && (
            <div className="dashboard-view">
              <h2>Welcome back, {djProfile.name.split(' ')[0]}! 👋</h2>
              
              {/* Stats */}
              <div className="stats-grid">
                <StatsCard icon={<FaStar />} title="Rating" value={djProfile.rating} color="#FFD700" />
                <StatsCard icon={<FaCalendarAlt />} title="Total Gigs" value={djProfile.totalGigs} color="#6C63FF" />
                <StatsCard icon={<FaDollarSign />} title="This Month" value={`R${earnings.thisMonth}`} color="#00C853" />
                <StatsCard icon={<FaCheckCircle />} title="Success Rate" value={`${djProfile.successRate}%`} color="#2196F3" />
              </div>

              {/* Recent Gigs */}
              <div className="recent-section">
                <h3>Recent Gigs</h3>
                <div className="recent-gigs">
                  {gigs.filter(g => g.status !== "pending").slice(0, 3).map(gig => (
                    <div key={gig.id} className="recent-gig-card">
                      <div className="gig-status" data-status={gig.status}>{gig.status}</div>
                      <h4>{gig.eventName}</h4>
                      <p><FaCalendarAlt /> {gig.date} at {gig.time}</p>
                      <p><FaMapMarkerAlt /> {gig.location}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button onClick={() => setActiveTab("emergency")}>View Emergency Gigs</button>
                  <button onClick={() => setActiveTab("profile")}>Update Profile</button>
                  <button onClick={() => setActiveTab("portfolio")}>Add to Portfolio</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "emergency" && (
            <div className="emergency-view">
              <h2>🔥 Emergency Gigs Available</h2>
              <p className="subtitle">Accept gigs that need a DJ immediately</p>
              
              {emergencyRequests.length === 0 ? (
                <div className="no-emergency">
                  <FaCheckCircle />
                  <h3>No emergency gigs at the moment</h3>
                  <p>Check back later or go online to receive instant notifications</p>
                </div>
              ) : (
                <div className="emergency-grid">
                  {emergencyRequests.map(req => (
                    <div key={req.id} className="emergency-card">
                      <div className="emergency-badge">URGENT - ACCEPT NOW</div>
                      <h3>{req.eventName}</h3>
                      <div className="emergency-details">
                        <p><FaMapMarkerAlt /> {req.location}</p>
                        <p><FaClock /> {req.timeNeeded}</p>
                        <p><FaDollarSign /> R{req.budget}</p>
                        <p><FaMusic /> {req.requirements}</p>
                      </div>
                      <div className="emergency-actions">
                        <button className="accept-btn" onClick={() => handleAcceptEmergency(req.id)}>
                          Accept Gig
                        </button>
                        <button className="decline-btn">Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "mygigs" && (
            <div className="gigs-view">
              <h2>My Gigs</h2>
              
              <div className="gigs-filter">
                <button className="filter-btn active">All</button>
                <button className="filter-btn">Upcoming</button>
                <button className="filter-btn">Completed</button>
                <button className="filter-btn">Cancelled</button>
              </div>

              <div className="gigs-list">
                {gigs.map(gig => (
                  <div key={gig.id} className={`gig-card ${gig.status}`}>
                    <div className="gig-header">
                      <h3>{gig.eventName}</h3>
                      <span className={`status-badge ${gig.status}`}>{gig.status}</span>
                    </div>
                    <div className="gig-body">
                      <p><FaUser /> {gig.clientName}</p>
                      <p><FaCalendarAlt /> {gig.date} | {gig.time}</p>
                      <p><FaMapMarkerAlt /> {gig.location}</p>
                      <p><FaMusic /> {gig.requirements}</p>
                      <p><FaDollarSign /> R{gig.budget}</p>
                      {gig.status === "confirmed" && (
                        <div className="client-contact">
                          <p><FaPhone /> {gig.clientPhone}</p>
                          <button className="message-btn">Message Client</button>
                        </div>
                      )}
                      {gig.status === "pending" && (
                        <div className="pending-actions">
                          <button className="accept-offer">Accept Offer</button>
                          <button className="decline-offer">Decline</button>
                        </div>
                      )}
                      {gig.status === "completed" && (
                        <button className="write-review-btn">Write Report</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="portfolio-view">
              <h2>My Portfolio</h2>
              <button className="add-portfolio-btn">
                <FaUpload /> Add New Content
              </button>
              
              <div className="portfolio-grid">
                {portfolio.map(item => (
                  <div key={item.id} className="portfolio-item">
                    <img src={item.url} alt={item.title} />
                    <div className="portfolio-overlay">
                      <p>{item.title}</p>
                      <div className="portfolio-actions">
                        <button><FaHeart /></button>
                        <button><FaShare /></button>
                        <button><FaEdit /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="profile-view">
              <h2>DJ Profile</h2>
              
              <div className="profile-form">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <FaUser />
                    <button className="change-photo">Change Photo</button>
                  </div>
                  <div className="profile-rating">
                    <FaStar /> {djProfile.rating} ★
                    <p>{djProfile.totalGigs} total gigs</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Display Name</label>
                  <input type="text" value={djProfile.name} onChange={(e) => setDjProfile({...djProfile, name: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={djProfile.email} disabled />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" value={djProfile.phone} placeholder="+27 XX XXX XXXX" onChange={(e) => setDjProfile({...djProfile, phone: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Location (City/Area)</label>
                  <input type="text" value={djProfile.location} onChange={(e) => setDjProfile({...djProfile, location: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Experience</label>
                  <select value={djProfile.experience} onChange={(e) => setDjProfile({...djProfile, experience: e.target.value})}>
                    <option>Less than 1 year</option>
                    <option>1-3 years</option>
                    <option>3-5 years</option>
                    <option>5+ years</option>
                    <option>10+ years</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Genres</label>
                  <div className="genres-select">
                    {["House", "Amapiano", "Afrobeat", "Hip Hop", "R&B", "Techno", "Deep House", "Gqom"].map(genre => (
                      <label key={genre}>
                        <input 
                          type="checkbox" 
                          checked={djProfile.genres.includes(genre)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDjProfile({...djProfile, genres: [...djProfile.genres, genre]});
                            } else {
                              setDjProfile({...djProfile, genres: djProfile.genres.filter(g => g !== genre)});
                            }
                          }}
                        />
                        {genre}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Price per Hour (R)</label>
                  <input type="number" value={djProfile.pricePerHour} onChange={(e) => setDjProfile({...djProfile, pricePerHour: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea rows="4" value={djProfile.bio} onChange={(e) => setDjProfile({...djProfile, bio: e.target.value})}></textarea>
                </div>

                <button className="save-profile-btn">Save Profile Changes</button>
              </div>
            </div>
          )}

          {activeTab === "earnings" && (
            <div className="earnings-view">
              <h2>My Earnings</h2>
              
              <div className="earnings-summary">
                <div className="earnings-card total">
                  <h3>Total Earnings</h3>
                  <p className="amount">R{earnings.total}</p>
                </div>
                <div className="earnings-card pending">
                  <h3>Pending Payout</h3>
                  <p className="amount">R{earnings.pending}</p>
                </div>
                <div className="earnings-card monthly">
                  <h3>This Month</h3>
                  <p className="amount">R{earnings.thisMonth}</p>
                </div>
              </div>

              <div className="withdraw-section">
                <h3>Withdraw Earnings</h3>
                <div className="withdraw-form">
                  <select>
                    <option>Bank Transfer</option>
                    <option>PayPal</option>
                    <option>EFT</option>
                  </select>
                  <input type="text" placeholder="Account Details" />
                  <button>Request Withdrawal</button>
                </div>
              </div>

              <div className="transaction-history">
                <h3>Recent Transactions</h3>
                <table>
                  <thead>
                    <tr><th>Date</th><th>Event</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>2026-05-10</td><td>Corporate Gala</td><td>R3500</td><td className="paid">Paid</td></tr>
                    <tr><td>2026-05-15</td><td>Beach Party</td><td>R2500</td><td className="pending">Pending</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DJDashboard;