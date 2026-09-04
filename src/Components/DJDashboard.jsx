import React, { useEffect, useMemo, useState } from "react";
import "./DJDashboard.css";
import {
  FaBell,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaEdit,
  FaHeart,
  FaMapMarkerAlt,
  FaMusic,
  FaPhone,
  FaShare,
  FaSignOutAlt,
  FaStar,
  FaUpload,
  FaUser,
} from "react-icons/fa";

const initialGigs = [
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
    clientPhone: "+27 82 123 4567",
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
    clientPhone: "+27 83 456 7890",
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
    clientPhone: "+27 84 789 0123",
  },
];

const initialEmergencyRequests = [
  {
    id: 101,
    eventName: "Birthday Party",
    location: "Sea Point, Cape Town",
    timeNeeded: "2 hours from now",
    budget: 2000,
    requirements: "Amapiano, Gqom",
    distance: "2.5 km away",
    postedTime: "5 minutes ago",
  },
  {
    id: 102,
    eventName: "Last Minute Club Night",
    location: "Long Street, Cape Town",
    timeNeeded: "4 hours from now",
    budget: 2500,
    requirements: "House, Techno",
    distance: "1.8 km away",
    postedTime: "15 minutes ago",
  },
];

const portfolioItems = [
  {
    id: 1,
    type: "photo",
    url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80",
    title: "Wedding Set",
  },
  {
    id: 2,
    type: "photo",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    title: "Club Performance",
  },
  {
    id: 3,
    type: "video",
    url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    title: "Live Mix Demo",
  },
];

function formatCurrency(value) {
  return `R${Number(value).toLocaleString("en-ZA")}`;
}

function DJDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [availability, setAvailability] = useState(
    localStorage.getItem("djAvailability") || "available",
  );
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
    successRate: 98,
  });
  const [gigs, setGigs] = useState(initialGigs);
  const [emergencyRequests, setEmergencyRequests] = useState(
    initialEmergencyRequests,
  );

  const earnings = useMemo(() => {
    const total = gigs.reduce((sum, gig) => sum + gig.budget, 3500);
    const pending = gigs
      .filter((gig) => gig.status === "pending")
      .reduce((sum, gig) => sum + gig.budget, 0);
    const thisMonth = gigs
      .filter((gig) => gig.status !== "pending")
      .reduce((sum, gig) => sum + gig.budget, 0);

    return { total, pending, thisMonth };
  }, [gigs]);

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");

    setDjProfile((prev) => ({
      ...prev,
      email: userEmail || prev.email,
      name: userName || prev.name,
    }));
  }, []);

  const navItems = [
    { id: "dashboard", label: "Overview", icon: <FaDollarSign /> },
    { id: "emergency", label: "Emergency", icon: <FaClock /> },
    { id: "mygigs", label: "Bookings", icon: <FaCalendarAlt /> },
    { id: "portfolio", label: "Portfolio", icon: <FaUpload /> },
    { id: "profile", label: "Profile", icon: <FaUser /> },
    { id: "earnings", label: "Earnings", icon: <FaDollarSign /> },
  ];

  const handleAcceptEmergency = (requestId) => {
    if (
      window.confirm(
        "Accept this emergency gig? You must arrive at the location within the specified time.",
      )
    ) {
      setEmergencyRequests((requests) =>
        requests.filter((request) => request.id !== requestId),
      );
      alert("Emergency gig accepted. The client will be notified.");
    }
  };

  const handleUpdateAvailability = (status) => {
    setAvailability(status);
    localStorage.setItem("djAvailability", status);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const StatCard = ({ icon, label, value, tone }) => (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div>
        <p>{label}</p>
        <h3>{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="dj-dashboard">
      <header className="top-nav">
        <div className="nav-container">
          <button
            className="brand-lockup"
            type="button"
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="brand-mark">G</span>
            <span>
              <strong>GIGZA</strong>
              <small>DJ Portal</small>
            </span>
          </button>

          <nav className="nav-links" aria-label="Dashboard sections">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-link ${activeTab === item.id ? "active" : ""}`}
                type="button"
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === "emergency" && emergencyRequests.length > 0 && (
                  <span className="nav-badge">{emergencyRequests.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="nav-actions">
            <button
              className={`availability-pill ${availability}`}
              type="button"
              onClick={() =>
                handleUpdateAvailability(
                  availability === "available" ? "offline" : "available",
                )
              }
            >
              <span className="status-dot" />
              {availability === "available" ? "Available" : "Offline"}
            </button>

            <button
              className="icon-button notification-trigger"
              type="button"
              onClick={() => setShowNotifications((isOpen) => !isOpen)}
              aria-label="Toggle emergency notifications"
            >
              <FaBell />
              {emergencyRequests.length > 0 && (
                <span className="notification-badge">
                  {emergencyRequests.length}
                </span>
              )}
            </button>

            <button className="logout-btn" type="button" onClick={handleLogout}>
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </header>

      {showNotifications && (
        <aside className="notification-dropdown">
          <div className="notification-header">
            <h3>Emergency Requests</h3>
            <button type="button" onClick={() => setShowNotifications(false)}>
              x
            </button>
          </div>
          {emergencyRequests.map((request) => (
            <div key={request.id} className="notification-item">
              <div className="notification-meta">
                <span>Urgent</span>
                <small>{request.postedTime}</small>
              </div>
              <h4>{request.eventName}</h4>
              <p>
                <FaMapMarkerAlt /> {request.location} - {request.distance}
              </p>
              <strong>{formatCurrency(request.budget)}</strong>
              <button
                type="button"
                onClick={() => handleAcceptEmergency(request.id)}
              >
                Accept Gig
              </button>
            </div>
          ))}
        </aside>
      )}

      <main className="main-content">
        {activeTab === "dashboard" && (
          <section className="dashboard-view">
            <div className="dashboard-hero">
              <div>
                <p className="eyebrow">DJ Dashboard</p>
                <h1>Welcome back, {djProfile.name.split(" ")[0]}</h1>
                <p>
                  Track bookings, emergency requests, profile strength, and
                  monthly earnings from one polished workspace.
                </p>
              </div>
              <div className="hero-metric">
                <span>Total earnings</span>
                <strong>{formatCurrency(earnings.total)}</strong>
                <small>+23% vs last period</small>
              </div>
            </div>

            <div className="stats-grid">
              <StatCard
                icon={<FaStar />}
                label="Rating"
                value={djProfile.rating}
                tone="rating"
              />
              <StatCard
                icon={<FaCalendarAlt />}
                label="Total Gigs"
                value={djProfile.totalGigs}
                tone="gigs"
              />
              <StatCard
                icon={<FaDollarSign />}
                label="This Month"
                value={formatCurrency(earnings.thisMonth)}
                tone="earnings"
              />
              <StatCard
                icon={<FaCheckCircle />}
                label="Success Rate"
                value={`${djProfile.successRate}%`}
                tone="success"
              />
            </div>

            <div className="dashboard-grid">
              <section className="panel panel-wide">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">Schedule</p>
                    <h2>Recent Gigs</h2>
                  </div>
                  <button type="button" onClick={() => setActiveTab("mygigs")}>
                    View all
                  </button>
                </div>
                <div className="recent-gigs">
                  {gigs
                    .filter((gig) => gig.status !== "pending")
                    .map((gig) => (
                      <article key={gig.id} className="recent-gig-card">
                        <span className={`status-badge ${gig.status}`}>
                          {gig.status}
                        </span>
                        <h3>{gig.eventName}</h3>
                        <p>
                          <FaCalendarAlt /> {gig.date} at {gig.time}
                        </p>
                        <p>
                          <FaMapMarkerAlt /> {gig.location}
                        </p>
                      </article>
                    ))}
                </div>
              </section>

              <section className="panel">
                <p className="eyebrow">Quick Actions</p>
                <h2>Next Moves</h2>
                <div className="action-list">
                  <button type="button" onClick={() => setActiveTab("emergency")}>
                    Review emergency gigs
                  </button>
                  <button type="button" onClick={() => setActiveTab("profile")}>
                    Update profile
                  </button>
                  <button type="button" onClick={() => setActiveTab("portfolio")}>
                    Add portfolio media
                  </button>
                </div>
              </section>
            </div>
          </section>
        )}

        {activeTab === "emergency" && (
          <section className="page-view">
            <div className="page-header">
              <div>
                <p className="eyebrow">Instant requests</p>
                <h1>Emergency Gigs</h1>
              </div>
              <button
                className="primary-action"
                type="button"
                onClick={() => handleUpdateAvailability("available")}
              >
                Go available
              </button>
            </div>

            {emergencyRequests.length === 0 ? (
              <div className="empty-state">
                <FaCheckCircle />
                <h2>No emergency gigs right now</h2>
                <p>Keep your availability on to receive instant requests.</p>
              </div>
            ) : (
              <div className="emergency-grid">
                {emergencyRequests.map((request) => (
                  <article key={request.id} className="emergency-card">
                    <span className="emergency-badge">Accept now</span>
                    <h2>{request.eventName}</h2>
                    <div className="detail-list">
                      <p>
                        <FaMapMarkerAlt /> {request.location}
                      </p>
                      <p>
                        <FaClock /> {request.timeNeeded}
                      </p>
                      <p>
                        <FaDollarSign /> {formatCurrency(request.budget)}
                      </p>
                      <p>
                        <FaMusic /> {request.requirements}
                      </p>
                    </div>
                    <div className="button-row">
                      <button
                        className="accept-btn"
                        type="button"
                        onClick={() => handleAcceptEmergency(request.id)}
                      >
                        Accept Gig
                      </button>
                      <button className="secondary-btn" type="button">
                        Decline
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "mygigs" && (
          <section className="page-view">
            <div className="page-header">
              <div>
                <p className="eyebrow">Confirmed and pending</p>
                <h1>My Gigs</h1>
              </div>
              <div className="filter-buttons">
                <button className="filter-btn active" type="button">
                  All
                </button>
                <button className="filter-btn" type="button">
                  Upcoming
                </button>
                <button className="filter-btn" type="button">
                  Completed
                </button>
              </div>
            </div>

            <div className="gigs-list">
              {gigs.map((gig) => (
                <article key={gig.id} className="gig-card">
                  <div className="gig-card-header">
                    <div>
                      <h2>{gig.eventName}</h2>
                      <p>{gig.clientName}</p>
                    </div>
                    <span className={`status-badge ${gig.status}`}>
                      {gig.status}
                    </span>
                  </div>
                  <div className="gig-card-body">
                    <p>
                      <FaCalendarAlt /> {gig.date} | {gig.time}
                    </p>
                    <p>
                      <FaMapMarkerAlt /> {gig.location}
                    </p>
                    <p>
                      <FaMusic /> {gig.requirements}
                    </p>
                    <p className="budget">
                      <FaDollarSign /> {formatCurrency(gig.budget)}
                    </p>
                  </div>
                  {gig.status === "confirmed" && (
                    <div className="gig-card-actions">
                      <span>
                        <FaPhone /> {gig.clientPhone}
                      </span>
                      <button type="button">Message Client</button>
                    </div>
                  )}
                  {gig.status === "pending" && (
                    <div className="gig-card-actions">
                      <button
                        className="accept-offer"
                        type="button"
                        onClick={() =>
                          setGigs((items) =>
                            items.map((item) =>
                              item.id === gig.id
                                ? { ...item, status: "confirmed" }
                                : item,
                            ),
                          )
                        }
                      >
                        Accept Offer
                      </button>
                      <button className="secondary-btn" type="button">
                        Decline
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "portfolio" && (
          <section className="page-view">
            <div className="page-header">
              <div>
                <p className="eyebrow">Media library</p>
                <h1>Portfolio</h1>
              </div>
              <button className="primary-action" type="button">
                <FaUpload /> Add Content
              </button>
            </div>
            <div className="portfolio-grid">
              {portfolioItems.map((item) => (
                <article key={item.id} className="portfolio-card">
                  <img src={item.url} alt={item.title} />
                  <div className="portfolio-overlay">
                    <p>{item.title}</p>
                    <div className="portfolio-actions">
                      <button type="button">
                        <FaHeart />
                      </button>
                      <button type="button">
                        <FaShare />
                      </button>
                      <button type="button">
                        <FaEdit />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="page-view">
            <div className="page-header">
              <div>
                <p className="eyebrow">Public details</p>
                <h1>DJ Profile</h1>
              </div>
            </div>
            <div className="profile-container">
              <aside className="profile-sidebar">
                <div className="profile-avatar-large">
                  <FaUser />
                </div>
                <h2>{djProfile.name}</h2>
                <p>{djProfile.email || "No email added"}</p>
                <div className="profile-rating">
                  <FaStar /> {djProfile.rating} rating
                </div>
              </aside>

              <form className="profile-form">
                <label>
                  Display Name
                  <input
                    type="text"
                    value={djProfile.name}
                    onChange={(event) =>
                      setDjProfile({ ...djProfile, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  Phone Number
                  <input
                    type="tel"
                    value={djProfile.phone}
                    placeholder="+27 XX XXX XXXX"
                    onChange={(event) =>
                      setDjProfile({ ...djProfile, phone: event.target.value })
                    }
                  />
                </label>
                <label>
                  Location
                  <input
                    type="text"
                    value={djProfile.location}
                    onChange={(event) =>
                      setDjProfile({
                        ...djProfile,
                        location: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Price per Hour
                  <input
                    type="number"
                    value={djProfile.pricePerHour}
                    onChange={(event) =>
                      setDjProfile({
                        ...djProfile,
                        pricePerHour: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Bio
                  <textarea
                    rows="4"
                    value={djProfile.bio}
                    onChange={(event) =>
                      setDjProfile({ ...djProfile, bio: event.target.value })
                    }
                  />
                </label>
                <button className="primary-action" type="button">
                  Save Changes
                </button>
              </form>
            </div>
          </section>
        )}

        {activeTab === "earnings" && (
          <section className="page-view">
            <div className="page-header">
              <div>
                <p className="eyebrow">Payouts</p>
                <h1>My Earnings</h1>
              </div>
              <button className="primary-action" type="button">
                Withdraw Earnings
              </button>
            </div>

            <div className="earnings-summary">
              <div className="earning-card total">
                <p>Total Earnings</p>
                <strong>{formatCurrency(earnings.total)}</strong>
              </div>
              <div className="earning-card pending">
                <p>Pending Payout</p>
                <strong>{formatCurrency(earnings.pending)}</strong>
              </div>
              <div className="earning-card monthly">
                <p>This Month</p>
                <strong>{formatCurrency(earnings.thisMonth)}</strong>
              </div>
            </div>

            <section className="panel">
              <h2>Recent Transactions</h2>
              <div className="transaction-table">
                <div className="table-row table-head">
                  <span>Date</span>
                  <span>Event</span>
                  <span>Amount</span>
                  <span>Status</span>
                </div>
                {gigs.map((gig) => (
                  <div key={gig.id} className="table-row">
                    <span>{gig.date}</span>
                    <span>{gig.eventName}</span>
                    <span>{formatCurrency(gig.budget)}</span>
                    <span className={`status-text ${gig.status}`}>
                      {gig.status === "completed" ? "paid" : gig.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}

export default DJDashboard;
