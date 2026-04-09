import React from "react";
import "./Dashboard.css";

const stats = [
  { label: "Verified DJs", value: "240", note: "+18 this week" },
  { label: "Active bookings", value: "32", note: "12 scheduled" },
  { label: "Avg. response time", value: "7 min", note: "Emergency mode" },
];

const urgentRequests = [
  {
    title: "Backyard party DJ",
    location: "Khayelitsha",
    time: "Starts in 2 hours",
    budget: "R1,200 - R1,800",
  },
  {
    title: "Corporate mixer",
    location: "Century City",
    time: "Tonight, 19:00",
    budget: "R2,500",
  },
  {
    title: "Wedding afterparty",
    location: "Stellenbosch",
    time: "Tomorrow, 21:00",
    budget: "R3,200",
  },
];

const upcomingBookings = [
  {
    title: "Sip and Paint",
    date: "Sat, 12 Apr",
    dj: "DJ Moyo",
    status: "Deposit paid",
  },
  {
    title: "Tech launch",
    date: "Fri, 18 Apr",
    dj: "Luna Beats",
    status: "Confirmed",
  },
  {
    title: "Community festival",
    date: "Sun, 20 Apr",
    dj: "Kay Vibe",
    status: "Awaiting final brief",
  },
];

const topDjs = [
  { name: "DJ Kumo", rating: "4.9", tag: "Afro house" },
  { name: "Zee Pulse", rating: "4.8", tag: "Amapiano" },
  { name: "Nova Nox", rating: "4.7", tag: "Hip hop" },
];

const reviews = [
  {
    client: "Layla M.",
    text: "On time, professional, and the dance floor stayed full all night.",
  },
  {
    client: "Thabo S.",
    text: "Super easy to book. Quick responses and great sound setup.",
  },
];

function Dashboard() {
  return (
    <div className="dash">
      <header className="dash__header">
        <div className="brand">
          <div className="brand__mark">GZ</div>
          <div>
            <p className="brand__name">Gigza</p>
            <p className="brand__tag">Your Gig Starts Here</p>
          </div>
        </div>

        <div className="dash__actions">
          <span className="pill">Cape Town, ZA</span>
          <button className="btn btn--ghost">Post a gig</button>
          <button className="btn btn--primary">Request Emergency DJ</button>
        </div>
      </header>

      <main className="dash__main">
        <section className="card card--hero">
          <div>
            <p className="eyebrow">Emergency Gig Mode</p>
            <h1 className="hero__title">Find a verified DJ in minutes.</h1>
            <p className="hero__copy">
              Submit a request and nearby professionals can accept instantly.
              Secure deposits, verified profiles, and live availability reduce
              last-minute stress.
            </p>
            <div className="hero__cta">
              <button className="btn btn--primary">Request now</button>
              <button className="btn btn--ghost">Schedule booking</button>
            </div>
            <div className="hero__badges">
              <span className="badge">Verified profiles</span>
              <span className="badge">Live availability</span>
              <span className="badge">Secure payments</span>
            </div>
          </div>

          <div className="hero__panel">
            <div className="panel__title">Live requests</div>
            <div className="panel__item">
              <div>
                <p className="panel__name">Garden lounge set</p>
                <p className="panel__meta">Sea Point · Needs now</p>
              </div>
              <span className="panel__pill">R1,500</span>
            </div>
            <div className="panel__item">
              <div>
                <p className="panel__name">Sunset rooftop</p>
                <p className="panel__meta">CBD · 90 min</p>
              </div>
              <span className="panel__pill">R2,200</span>
            </div>
            <div className="panel__item">
              <div>
                <p className="panel__name">Birthday vibe</p>
                <p className="panel__meta">Milnerton · Tonight</p>
              </div>
              <span className="panel__pill">R1,800</span>
            </div>
            <button className="btn btn--dark">View all requests</button>
          </div>
        </section>

        <section className="stats">
          {stats.map((stat) => (
            <div className="card stat" key={stat.label}>
              <p className="stat__label">{stat.label}</p>
              <p className="stat__value">{stat.value}</p>
              <p className="stat__note">{stat.note}</p>
            </div>
          ))}
        </section>

        <section className="grid">
          <div className="card">
            <div className="card__head">
              <h2>Urgent requests</h2>
              <span className="pill pill--accent">Emergency</span>
            </div>
            <div className="list">
              {urgentRequests.map((item) => (
                <div className="list__item" key={item.title}>
                  <div>
                    <p className="list__title">{item.title}</p>
                    <p className="list__meta">
                      {item.location} · {item.time}
                    </p>
                  </div>
                  <p className="list__price">{item.budget}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__head">
              <h2>Upcoming bookings</h2>
              <button className="link">View calendar</button>
            </div>
            <div className="list">
              {upcomingBookings.map((item) => (
                <div className="list__item" key={item.title}>
                  <div>
                    <p className="list__title">{item.title}</p>
                    <p className="list__meta">
                      {item.date} · {item.dj}
                    </p>
                  </div>
                  <span className="pill">{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__head">
              <h2>Top DJs near you</h2>
              <button className="link">Browse all</button>
            </div>
            <div className="list">
              {topDjs.map((item) => (
                <div className="list__item" key={item.name}>
                  <div>
                    <p className="list__title">{item.name}</p>
                    <p className="list__meta">{item.tag}</p>
                  </div>
                  <span className="pill pill--rating">{item.rating}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__head">
              <h2>Recent reviews</h2>
              <button className="link">See all</button>
            </div>
            <div className="review">
              {reviews.map((item) => (
                <div className="review__item" key={item.client}>
                  <p className="review__text">"{item.text}"</p>
                  <p className="review__client">{item.client}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
