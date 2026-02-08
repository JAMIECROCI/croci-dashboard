import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── Configuration ────────────────────────────────────────────────────
const OPENWEATHER_API_KEY = "YOUR_API_KEY_HERE"; // Replace with your OpenWeatherMap API key
const WEATHER_ENABLED = OPENWEATHER_API_KEY !== "YOUR_API_KEY_HERE";
const WEATHER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const USE_MOCK_DATA = true; // Set to false when real API is available

// ── Password Protection ─────────────────────────────────────────────
const PASSWORD_PROTECTED = true; // Set to false to disable password gate
const SITE_PASSWORD = "CrociTeam2025"; // Change this to your desired password

// ── Venue Coordinate Registry ────────────────────────────────────────
const VENUE_COORDINATES = {
  "The O2 Arena, London": { lat: 51.5033, lng: 0.0032 },
  "Manchester Central": { lat: 53.4762, lng: -2.2467 },
  "NEC Birmingham": { lat: 52.4539, lng: -1.7246 },
  "SEC Glasgow": { lat: 55.8607, lng: -4.2872 },
  "Olympia London": { lat: 51.4960, lng: -0.2098 },
  "ExCeL London": { lat: 51.5085, lng: 0.0295 },
  "Brighton Centre": { lat: 50.8218, lng: -0.1392 },
  "RDS Dublin": { lat: 53.3270, lng: -6.2290 },
  "Cork City Hall": { lat: 51.8969, lng: -8.4707 },
  "Galway Racecourse": { lat: 53.2830, lng: -8.9890 },
  "Convention Centre Dublin": { lat: 53.3478, lng: -6.2388 },
  "Limerick Milk Market": { lat: 52.6610, lng: -8.6303 },
  "Javits Center, NYC": { lat: 40.7575, lng: -74.0021 },
  "McCormick Place, Chicago": { lat: 41.8517, lng: -87.6155 },
  "LA Convention Center": { lat: 34.0400, lng: -118.2696 },
  "Georgia World Congress, Atlanta": { lat: 33.7590, lng: -84.3957 },
  "Boston Convention Center": { lat: 42.3456, lng: -71.0446 },
};

// ── Mock Data Constants ──────────────────────────────────────────────
const COUNTRIES = ["United Kingdom", "Ireland", "United States"];
const CAMPAIGNS = ["Spring Wellness Push", "Summer Box Blitz", "Pet Nutrition Drive", "Starter Kit Promo"];
const PRODUCTS = {
  feedingPlans: ["Puppy Growth Plan", "Adult Maintenance", "Senior Vitality", "Weight Management", "Raw Boost"],
  boxTypes: ["Starter Box", "Premium Box", "Family Pack", "Trial Box", "Mega Bundle"],
};
const NAMES_UK = ["James Hartley", "Sophie Brennan", "Liam O'Connor", "Chloe Watts", "Aiden Clarke", "Megan Taylor", "Ryan Patel", "Emma Hughes", "Nathan Brooks", "Isla Ferreira"];
const NAMES_IE = ["Ciara Murphy", "Sean Gallagher", "Niamh Doyle", "Conor Byrne", "Aoife Kelly", "Padraig Walsh", "Sinead Nolan", "Declan Healy", "Roisin Daly", "Eoin Fitzgerald"];
const NAMES_US = ["Marcus Johnson", "Ashley Rivera", "Tyler Chen", "Brittany Williams", "Jordan Campbell", "Kayla Nguyen", "Brandon Mitchell", "Samantha Hayes", "Derek Morales", "Megan Foster"];
const SALES_NAMES = { "United Kingdom": NAMES_UK, "Ireland": NAMES_IE, "United States": NAMES_US };
const FLAGS = { "United Kingdom": "🇬🇧", "Ireland": "🇮🇪", "United States": "🇺🇸" };

const VENUES_UK = ["The O2 Arena, London", "Manchester Central", "NEC Birmingham", "SEC Glasgow", "Olympia London", "ExCeL London", "Brighton Centre"];
const VENUES_IE = ["RDS Dublin", "Cork City Hall", "Galway Racecourse", "Convention Centre Dublin", "Limerick Milk Market"];
const VENUES_US = ["Javits Center, NYC", "McCormick Place, Chicago", "LA Convention Center", "Georgia World Congress, Atlanta", "Boston Convention Center"];
const VENUES = { "United Kingdom": VENUES_UK, "Ireland": VENUES_IE, "United States": VENUES_US };

// ── Utility Functions ────────────────────────────────────────────────
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return +(Math.random() * (max - min) + min).toFixed(2); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// ── Data Generators ──────────────────────────────────────────────────
function generateEvents(country, count, weekOffset = 0) {
  const venueList = VENUES[country];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const monday = new Date(baseDate);
  monday.setDate(monday.getDate() - monday.getDay() + 1);

  return Array.from({ length: count }, (_, i) => {
    const eventDate = new Date(monday);
    eventDate.setDate(eventDate.getDate() + randInt(0, 6));
    return {
      id: `${country}-${weekOffset}-${i}`,
      name: `${pick(CAMPAIGNS)} - ${country}`,
      venue: venueList[i % venueList.length],
      date: eventDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
      rawDate: eventDate,
      ticketsSold: randInt(40, 380),
      revenue: randInt(2800, 28000),
      target: randInt(300, 500),
      status: pick(["live", "live", "live", "upcoming", "completed"]),
      campaign: pick(CAMPAIGNS),
      country,
    };
  }).sort((a, b) => a.rawDate - b.rawDate);
}

function generateSalespeople(country, period) {
  const names = SALES_NAMES[country];
  return CAMPAIGNS.map(campaign => ({
    campaign,
    top3: shuffle(names).slice(0, 3).map((name, i) => ({
      name,
      sales: period === "day" ? randInt(4, 32) : randInt(18, 160),
      revenue: period === "day" ? randInt(280, 3200) : randInt(1400, 16000),
      conversionRate: randFloat(12, 48),
      rank: i + 1,
    })).sort((a, b) => b.sales - a.sales).map((p, i) => ({ ...p, rank: i + 1 })),
  }));
}

function generateCampaignBreakdown() {
  return CAMPAIGNS.map(campaign => ({
    campaign,
    products: PRODUCTS.feedingPlans.map(plan => ({
      name: plan,
      type: "Feeding Plan",
      unitsSold: randInt(20, 400),
      revenue: randInt(1400, 28000),
      avgOrderValue: randFloat(28, 120),
      returnRate: randFloat(0.5, 6),
    })).concat(PRODUCTS.boxTypes.map(box => ({
      name: box,
      type: "Box Type",
      unitsSold: randInt(15, 320),
      revenue: randInt(900, 22000),
      avgOrderValue: randFloat(18, 95),
      returnRate: randFloat(0.8, 5),
    }))),
    totalRevenue: randInt(12000, 80000),
    totalUnits: randInt(200, 2400),
  }));
}

function generateLiveSale(events) {
  const liveEvents = events.flat().filter(e => e.status === "live");
  if (!liveEvents.length) return null;
  const event = pick(liveEvents);
  return {
    id: Date.now() + Math.random(),
    eventName: event.name,
    venue: event.venue,
    product: pick([...PRODUCTS.feedingPlans, ...PRODUCTS.boxTypes]),
    amount: randFloat(18, 120),
    time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function generateNotification(events, salesData) {
  const templates = [
    () => {
      const liveEvts = events.flat().filter(e => e.status === "live");
      const event = liveEvts.length ? pick(liveEvts) : null;
      if (!event) return null;
      return { type: "milestone", message: `${event.name} at ${event.venue} hit ${event.ticketsSold} sales!` };
    },
    () => {
      const allSales = Object.values(salesData).flatMap(camps => camps.flatMap(c => c.top3));
      const top = allSales.sort((a, b) => b.sales - a.sales)[0];
      if (!top) return null;
      return { type: "highPerformer", message: `${top.name} is leading with ${top.sales} sales today` };
    },
    () => {
      const upcoming = events.flat().filter(e => e.status === "upcoming");
      const event = upcoming.length ? pick(upcoming) : null;
      if (!event) return null;
      return { type: "eventAlert", message: `${event.name} at ${event.venue} starting soon` };
    },
    () => {
      const liveEvts = events.flat().filter(e => e.status === "live");
      const event = liveEvts.length ? pick(liveEvts) : null;
      if (!event) return null;
      const pct = Math.round((event.ticketsSold / event.target) * 100);
      if (pct > 80) return { type: "milestone", message: `${event.venue} is at ${pct}% of target!` };
      if (pct < 30) return { type: "warning", message: `${event.venue} only at ${pct}% of target — needs attention` };
      return { type: "info", message: `${event.venue} currently at ${pct}% of daily target` };
    },
    () => {
      const liveEvts = events.flat().filter(e => e.status === "live");
      if (!liveEvts.length) return null;
      const totalRev = liveEvts.reduce((s, e) => s + e.revenue, 0);
      return { type: "info", message: `Total live revenue across all events: £${totalRev.toLocaleString()}` };
    },
  ];

  const template = pick(templates);
  const result = template();
  if (!result) return null;

  return {
    id: Date.now() + Math.random(),
    ...result,
    timestamp: new Date(),
    read: false,
  };
}

// ── Notification Types ───────────────────────────────────────────────
const NOTIFICATION_TYPES = {
  milestone: { icon: "🎯", color: "#f59e0b", label: "Milestone" },
  highPerformer: { icon: "⭐", color: "#a78bfa", label: "Achievement" },
  eventAlert: { icon: "📡", color: "#34d399", label: "Event" },
  warning: { icon: "⚠️", color: "#ef4444", label: "Alert" },
  info: { icon: "ℹ️", color: "#60a5fa", label: "Info" },
};

// ── Custom Hooks ─────────────────────────────────────────────────────
function useStableData() {
  const dataRef = useRef(null);
  if (!dataRef.current) {
    dataRef.current = {
      thisWeekEvents: COUNTRIES.reduce((acc, c) => ({ ...acc, [c]: generateEvents(c, randInt(3, 5), 0) }), {}),
      nextWeekEvents: COUNTRIES.reduce((acc, c) => ({ ...acc, [c]: generateEvents(c, randInt(3, 5), 1) }), {}),
      dailySales: COUNTRIES.reduce((acc, c) => ({ ...acc, [c]: generateSalespeople(c, "day") }), {}),
      weeklySales: COUNTRIES.reduce((acc, c) => ({ ...acc, [c]: generateSalespeople(c, "week") }), {}),
      campaignBreakdown: generateCampaignBreakdown(),
    };
  }
  return { data: dataRef.current, loading: false, error: null };
}

function useLiveSales(thisWeekEvents) {
  const [liveSales, setLiveSales] = useState([]);
  const eventsRef = useRef(thisWeekEvents);
  eventsRef.current = thisWeekEvents;

  useEffect(() => {
    const interval = setInterval(() => {
      const allEvents = Object.values(eventsRef.current);
      const sale = generateLiveSale(allEvents);
      if (sale) setLiveSales(prev => [sale, ...prev].slice(0, 20));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return liveSales;
}

function useNotifications(events, salesData) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventsRef = useRef(events);
  const salesRef = useRef(salesData);
  eventsRef.current = events;
  salesRef.current = salesData;

  useEffect(() => {
    const genInterval = () => randInt(8000, 15000);
    let timeout;

    const tick = () => {
      const notification = generateNotification(
        Object.values(eventsRef.current),
        salesRef.current
      );
      if (notification) {
        setNotifications(prev => [notification, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
      }
      timeout = setTimeout(tick, genInterval());
    };

    timeout = setTimeout(tick, genInterval());
    return () => clearTimeout(timeout);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  return { notifications, unreadCount, markAllRead, markRead };
}

function useWeatherData(venues) {
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef({});

  useEffect(() => {
    if (!WEATHER_ENABLED || !venues.length) return;

    const fetchWeather = async () => {
      setLoading(true);
      const results = {};
      const now = Date.now();
      const uniqueVenues = [...new Set(venues)];

      for (const venue of uniqueVenues) {
        const cached = cacheRef.current[venue];
        if (cached && (now - cached.timestamp) < WEATHER_CACHE_TTL) {
          results[venue] = cached.data;
          continue;
        }

        const coords = VENUE_COORDINATES[venue];
        if (!coords) continue;

        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&appid=${OPENWEATHER_API_KEY}&units=metric`
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          const weatherInfo = {
            temp: Math.round(data.main.temp),
            icon: data.weather[0]?.icon,
            description: data.weather[0]?.description,
          };
          results[venue] = weatherInfo;
          cacheRef.current[venue] = { data: weatherInfo, timestamp: now };
        } catch {
          results[venue] = { error: true };
        }
      }

      setWeatherData(results);
      setLoading(false);
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, WEATHER_CACHE_TTL);
    return () => clearInterval(interval);
  }, [venues.join(",")]);

  return { weatherData, weatherLoading: loading };
}

function useLeafletLoader() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.L) {
      setLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLoaded(true);
    script.onerror = () => setError("Failed to load map library");
    document.head.appendChild(script);
  }, []);

  return { leafletLoaded: loaded, leafletError: error };
}

// ── Presentational Components ────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const colors = {
    live: { bg: "#0f2d1a", text: "#34d399", dot: "#34d399" },
    upcoming: { bg: "#1e1b2e", text: "#a78bfa", dot: "#a78bfa" },
    completed: { bg: "#1a1a2e", text: "#64748b", dot: "#64748b" },
  };
  const c = colors[status] || colors.upcoming;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: c.bg, color: c.text, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
      {status === "live" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, animation: "pulse 1.5s infinite" }} />}
      {status}
    </span>
  );
};

const ProgressBar = ({ value, max, color = "#34d399" }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ width: "100%", height: 6, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 3, transition: "width 0.6s ease" }} />
    </div>
  );
};

const RankBadge = ({ rank }) => {
  const icons = { 1: "🥇", 2: "🥈", 3: "🥉" };
  return <span style={{ fontSize: 18 }}>{icons[rank]}</span>;
};

const SectionHeader = ({ children, icon, subtitle }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 20 }}>{icon}</span> {children}
    </h2>
    {subtitle && <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0 30px", fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</p>}
  </div>
);

const CountryTab = ({ country, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: "8px 18px", borderRadius: 8, border: active ? "1px solid #34d39944" : "1px solid #1e293b",
    background: active ? "linear-gradient(135deg, #0f2d1a, #0a1628)" : "transparent",
    color: active ? "#34d399" : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6,
    transition: "all 0.2s ease",
  }}>
    <span style={{ fontSize: 16 }}>{FLAGS[country]}</span> {country}
  </button>
);

const Card = ({ children, style = {}, accentColor }) => (
  <div style={{
    background: "linear-gradient(135deg, #0d1117 0%, #111827 100%)",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: 22,
    ...(accentColor ? { borderTop: `2px solid ${accentColor}` } : {}),
    ...style,
  }}>
    {children}
  </div>
);

const LiveSaleTicker = ({ sales }) => {
  if (!sales.length) return null;
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, position: "relative" }}>
      {sales.slice(0, 8).map((sale, i) => (
        <div key={sale.id} style={{
          minWidth: 220, padding: "10px 14px", background: "linear-gradient(135deg, #0f2d1a, #0a1628)",
          border: "1px solid #34d39922", borderRadius: 10, animation: i === 0 ? "slideIn 0.4s ease" : "none",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ color: "#34d399", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>£{sale.amount.toFixed(2)}</span>
            <span style={{ color: "#475569", fontSize: 10 }}>{sale.time}</span>
          </div>
          <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{sale.product}</div>
          <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>{sale.venue}</div>
        </div>
      ))}
    </div>
  );
};

const WeatherCell = ({ venue, weatherData, loading }) => {
  if (!WEATHER_ENABLED) return null;

  if (loading) {
    return <span style={{ color: "#475569", fontSize: 11, display: "inline-block", width: 60, height: 16, background: "linear-gradient(90deg, #1a1a2e 25%, #252540 50%, #1a1a2e 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", borderRadius: 4 }} />;
  }

  const weather = weatherData[venue];
  if (!weather || weather.error) {
    return <span style={{ color: "#334155", fontSize: 11 }}>--</span>;
  }

  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}.png`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <img src={iconUrl} alt={weather.description} style={{ width: 24, height: 24 }} />
      <span style={{ fontSize: 12, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
        {weather.temp}°C
      </span>
    </div>
  );
};

const NotificationBell = ({ unreadCount, onClick }) => (
  <button onClick={onClick} style={{
    position: "relative", background: "none", border: "none",
    cursor: "pointer", fontSize: 20, color: "#94a3b8",
    padding: 4, transition: "transform 0.2s ease",
  }}>
    {"🔔"}
    {unreadCount > 0 && (
      <span style={{
        position: "absolute", top: -4, right: -6,
        minWidth: 18, height: 18, borderRadius: 9,
        background: "#ef4444", color: "#fff",
        fontSize: 9, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 4px",
        animation: "pulse 1.5s infinite",
        boxShadow: "0 0 8px rgba(239, 68, 68, 0.5)",
      }}>
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    )}
  </button>
);

const NotificationItem = ({ notification, onMarkRead }) => {
  const typeInfo = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
  return (
    <div
      onClick={() => onMarkRead(notification.id)}
      style={{
        display: "flex", gap: 12, padding: "12px 16px",
        borderLeft: `3px solid ${typeInfo.color}`,
        background: notification.read ? "transparent" : "#0d1117",
        cursor: "pointer",
        borderBottom: "1px solid #111827",
        transition: "background 0.2s ease",
        animation: "notificationSlide 0.3s ease",
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{typeInfo.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: notification.read ? "#64748b" : "#e2e8f0", margin: 0, lineHeight: 1.5 }}>
          {notification.message}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: typeInfo.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {typeInfo.label}
          </span>
          <span style={{ fontSize: 10, color: "#475569" }}>{timeAgo(notification.timestamp)}</span>
        </div>
      </div>
      {!notification.read && (
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: typeInfo.color, flexShrink: 0, marginTop: 6 }} />
      )}
    </div>
  );
};

const NotificationPanel = ({ notifications, isOpen, onClose, onMarkAllRead, onMarkRead }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    const timer = setTimeout(() => document.addEventListener("click", handleClickOutside), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={panelRef} style={{
      position: "fixed", top: 70, right: 32,
      width: 380, maxHeight: "70vh",
      background: "linear-gradient(135deg, #0d1117, #111827)",
      border: "1px solid #1e293b",
      borderRadius: 14,
      boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      zIndex: 200,
      overflow: "hidden",
      animation: "slideDown 0.2s ease",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px", borderBottom: "1px solid #1e293b",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>Notifications</span>
        <button onClick={onMarkAllRead} style={{
          background: "none", border: "none", color: "#34d399", fontSize: 11,
          cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
        }}>
          Mark all read
        </button>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {notifications.length === 0 ? (
          <p style={{ color: "#475569", fontSize: 13, padding: 20, textAlign: "center", margin: 0 }}>No notifications yet</p>
        ) : (
          notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onMarkRead={onMarkRead} />
          ))
        )}
      </div>
    </div>
  );
};

const EventMap = ({ events, leafletLoaded, leafletError }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    }).setView([48.0, -10.0], 3);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OSM © CARTO",
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const countryColors = {
      "United Kingdom": "#60a5fa",
      "Ireland": "#34d399",
      "United States": "#f59e0b",
    };

    events.forEach(event => {
      const coords = VENUE_COORDINATES[event.venue];
      if (!coords) return;

      const statusColor = {
        live: "#34d399",
        upcoming: "#a78bfa",
        completed: "#64748b",
      }[event.status] || "#64748b";

      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: event.status === "live" ? 10 : 7,
        fillColor: statusColor,
        color: countryColors[event.country] || statusColor,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(map);

      const statusLabel = event.status.charAt(0).toUpperCase() + event.status.slice(1);
      const statusDot = event.status === "live" ? '<span style="color:#34d399">●</span>' : event.status === "upcoming" ? '<span style="color:#a78bfa">●</span>' : '<span style="color:#64748b">●</span>';

      marker.bindPopup(
        `<div style="font-family:'DM Sans',sans-serif;min-width:180px">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:#f1f5f9">${event.name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">📍 ${event.venue}</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:8px">📆 ${event.date}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:11px">${statusDot} ${statusLabel}</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-top:1px solid #1e293b;padding-top:6px;margin-top:4px">
            <span style="font-size:12px;color:#60a5fa;font-weight:600">${event.ticketsSold} sales</span>
            <span style="font-size:12px;color:#34d399;font-weight:600">£${event.revenue.toLocaleString()}</span>
          </div>
        </div>`,
        { className: "croci-popup" }
      );

      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.2));
    }
  }, [events, leafletLoaded]);

  if (leafletError) {
    return (
      <Card style={{ marginBottom: 28 }}>
        <SectionHeader icon="🗺️" subtitle="Geographic overview of all event locations">Event Map</SectionHeader>
        <p style={{ color: "#ef4444", fontSize: 13 }}>Map unavailable: {leafletError}</p>
      </Card>
    );
  }

  if (!leafletLoaded) {
    return (
      <Card style={{ marginBottom: 28 }}>
        <SectionHeader icon="🗺️" subtitle="Geographic overview of all event locations">Event Map</SectionHeader>
        <div style={{
          width: "100%", height: 400, borderRadius: 10, overflow: "hidden",
          background: "linear-gradient(90deg, #0a0f1a 25%, #111827 50%, #0a0f1a 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: "#475569", fontSize: 13 }}>Loading map...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 28 }}>
      <SectionHeader icon="🗺️" subtitle="Geographic overview of all event locations">Event Map</SectionHeader>
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11, color: "#64748b" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#34d399", display: "inline-block" }} /> Live
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} /> Upcoming
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#64748b", display: "inline-block" }} /> Completed
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "#475569", marginLeft: "auto" }}>
          <span>Border: </span>
          {COUNTRIES.map(c => {
            const cc = { "United Kingdom": "#60a5fa", "Ireland": "#34d399", "United States": "#f59e0b" };
            return (
              <span key={c} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 12, height: 3, background: cc[c], display: "inline-block", borderRadius: 2 }} /> {FLAGS[c]}
              </span>
            );
          })}
        </div>
      </div>
      <div ref={mapRef} style={{
        width: "100%",
        height: 400,
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid #1e293b",
      }} />
    </Card>
  );
};

// ── Main Dashboard ───────────────────────────────────────────────────
// ── Password Gate Component ──────────────────────────────────────────
function PasswordGate({ children }) {
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem("croci_auth") === "true";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  if (!PASSWORD_PROTECTED || authenticated) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      sessionStorage.setItem("croci_auth", "true");
      setAuthenticated(true);
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setPassword("");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #060a10 0%, #0a0f1a 40%, #080d16 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }
      `}</style>
      <div style={{
        animation: shaking ? "shake 0.5s ease" : "fadeUp 0.6s ease",
        textAlign: "center", padding: 40,
        background: "linear-gradient(135deg, #0d111788, #0a0f1a88)",
        border: "1px solid #1e293b", borderRadius: 20,
        backdropFilter: "blur(20px)",
        width: "100%", maxWidth: 400,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: "0 auto 20px",
          background: "linear-gradient(135deg, #34d399, #059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: 700, color: "#000",
          fontFamily: "'Playfair Display', serif",
        }}>C</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px" }}>
          Croci Collective
        </h1>
        <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 28px", letterSpacing: 1.5, textTransform: "uppercase" }}>
          Operations Portal
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter team password"
            autoFocus
            style={{
              width: "100%", padding: "14px 18px",
              background: "#0a0f1a", border: `1px solid ${error ? "#ef4444" : "#1e293b"}`,
              borderRadius: 10, color: "#f1f5f9", fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              outline: "none", transition: "border-color 0.2s ease",
              marginBottom: 12,
            }}
            onFocus={(e) => { if (!error) e.target.style.borderColor = "#34d399"; }}
            onBlur={(e) => { if (!error) e.target.style.borderColor = "#1e293b"; }}
          />
          {error && (
            <p style={{ color: "#ef4444", fontSize: 12, margin: "0 0 12px" }}>
              Incorrect password. Please try again.
            </p>
          )}
          <button type="submit" style={{
            width: "100%", padding: "14px 0",
            background: "linear-gradient(135deg, #34d399, #059669)",
            border: "none", borderRadius: 10,
            color: "#000", fontSize: 14, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", transition: "opacity 0.2s ease",
          }}
            onMouseEnter={(e) => e.target.style.opacity = "0.9"}
            onMouseLeave={(e) => e.target.style.opacity = "1"}
          >
            Access Dashboard
          </button>
        </form>
        <p style={{ fontSize: 10, color: "#334155", margin: "20px 0 0" }}>
          Internal use only. Contact your manager for access.
        </p>
      </div>
    </div>
  );
}

export default function CrociPortal() {
  const [activeCountry, setActiveCountry] = useState("United Kingdom");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data } = useStableData();
  const { thisWeekEvents, nextWeekEvents, dailySales, weeklySales, campaignBreakdown } = data;

  const liveSales = useLiveSales(thisWeekEvents);
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(thisWeekEvents, dailySales);
  const { leafletLoaded, leafletError } = useLeafletLoader();

  const allVenues = useMemo(() => {
    const venues = new Set();
    Object.values(thisWeekEvents).flat().forEach(e => venues.add(e.venue));
    Object.values(nextWeekEvents).flat().forEach(e => venues.add(e.venue));
    return [...venues];
  }, [thisWeekEvents, nextWeekEvents]);

  const { weatherData, weatherLoading } = useWeatherData(allVenues);

  const allThisWeekEvents = useMemo(() =>
    Object.values(thisWeekEvents).flat().sort((a, b) => a.rawDate - b.rawDate),
    [thisWeekEvents]
  );

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalRevToday = Object.values(thisWeekEvents).flat().reduce((s, e) => s + e.revenue, 0);
  const totalSalesToday = Object.values(thisWeekEvents).flat().reduce((s, e) => s + e.ticketsSold, 0);
  const liveCount = Object.values(thisWeekEvents).flat().filter(e => e.status === "live").length;

  const thisWeekHeaders = WEATHER_ENABLED
    ? ["Event", "Venue", "Date", "Weather", "Status", "Sales", "Revenue", "Progress"]
    : ["Event", "Venue", "Date", "Status", "Sales", "Revenue", "Progress"];

  return (
    <PasswordGate>
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #060a10 0%, #0a0f1a 40%, #080d16 100%)",
      color: "#e2e8f0",
      fontFamily: "'DM Sans', sans-serif",
      padding: 0,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes notificationSlide { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0f1a; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        * { box-sizing: border-box; }
        .leaflet-popup-content-wrapper { background: #0d1117 !important; border: 1px solid #1e293b; border-radius: 10px !important; color: #e2e8f0; font-family: 'DM Sans', sans-serif; box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important; }
        .leaflet-popup-tip { background: #0d1117 !important; }
        .leaflet-popup-content { margin: 12px 16px !important; font-size: 12px; line-height: 1.6; }
        .leaflet-popup-close-button { color: #64748b !important; }
        .leaflet-popup-close-button:hover { color: #e2e8f0 !important; }
        .leaflet-control-attribution { background: rgba(10,15,26,0.8) !important; color: #475569 !important; font-size: 9px !important; }
        .leaflet-control-attribution a { color: #64748b !important; }
        .leaflet-control-zoom a { background: #0d1117 !important; color: #94a3b8 !important; border-color: #1e293b !important; }
        .leaflet-control-zoom a:hover { background: #111827 !important; color: #e2e8f0 !important; }
      `}</style>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{
        padding: "20px clamp(16px, 3vw, 32px)",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(90deg, #060a1088, #0d111788)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, #34d399, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, color: "#000",
            fontFamily: "'Playfair Display', serif",
          }}>C</div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, margin: 0, color: "#f1f5f9" }}>
              Croci Collective
            </h1>
            <p style={{ fontSize: 11, color: "#64748b", margin: 0, letterSpacing: 1.5, textTransform: "uppercase" }}>Operations Portal</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <NotificationBell unreadCount={unreadCount} onClick={(e) => { e.stopPropagation(); setNotifOpen(prev => !prev); }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>LIVE</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>
              {currentTime.toLocaleTimeString("en-GB")}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {currentTime.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>
      </header>

      {/* ── Notification Panel ────────────────────────── */}
      <NotificationPanel
        notifications={notifications}
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onMarkAllRead={markAllRead}
        onMarkRead={markRead}
      />

      <div style={{ padding: "24px clamp(16px, 3vw, 32px)", maxWidth: 1440, margin: "0 auto" }}>

        {/* ── KPI Strip ────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Live Events", value: liveCount, color: "#34d399", icon: "📡" },
            { label: "Sales Today", value: totalSalesToday.toLocaleString(), color: "#60a5fa", icon: "🛒" },
            { label: "Revenue Today", value: `£${(totalRevToday).toLocaleString()}`, color: "#f59e0b", icon: "💰" },
            { label: "Active Countries", value: COUNTRIES.length, color: "#a78bfa", icon: "🌍" },
          ].map((kpi, i) => (
            <Card key={i} accentColor={kpi.color} style={{ animation: `fadeUp 0.5s ease ${i * 0.1}s both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>{kpi.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: kpi.color, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{kpi.value}</p>
                </div>
                <span style={{ fontSize: 24 }}>{kpi.icon}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Event Map ───────────────────────────────── */}
        <EventMap events={allThisWeekEvents} leafletLoaded={leafletLoaded} leafletError={leafletError} />

        {/* ── Live Sales Ticker ────────────────────────── */}
        <Card style={{ marginBottom: 28, boxShadow: "0 0 30px rgba(52, 211, 153, 0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#34d399", textTransform: "uppercase", letterSpacing: 1 }}>Live Sales Feed</span>
          </div>
          <LiveSaleTicker sales={liveSales} />
          {liveSales.length === 0 && <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Waiting for incoming sales...</p>}
        </Card>

        {/* ══════════════════════════════════════════════════
            SECTION 1: THIS WEEK'S EVENTS BY COUNTRY
        ══════════════════════════════════════════════════ */}
        <Card style={{ marginBottom: 28, animation: "scaleIn 0.4s ease" }}>
          <SectionHeader icon="📅" subtitle="All live and scheduled events with real-time sales data">This Week's Events</SectionHeader>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {COUNTRIES.map(c => <CountryTab key={c} country={c} active={activeCountry === c} onClick={() => setActiveCountry(c)} />)}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
              <thead>
                <tr>
                  {thisWeekHeaders.map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, borderBottom: "1px solid #1e293b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {thisWeekEvents[activeCountry]?.map((event, i) => (
                  <tr key={event.id} style={{
                    animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                    transition: "background 0.2s ease",
                    cursor: "default",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#0d1117"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{event.name}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{event.venue}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{event.date}</td>
                    {WEATHER_ENABLED && (
                      <td style={{ padding: "12px 14px" }}>
                        <WeatherCell venue={event.venue} weatherData={weatherData} loading={weatherLoading} />
                      </td>
                    )}
                    <td style={{ padding: "12px 14px" }}><StatusBadge status={event.status} /></td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700, color: "#60a5fa", fontVariantNumeric: "tabular-nums" }}>{event.ticketsSold}</td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>£{event.revenue.toLocaleString()}</td>
                    <td style={{ padding: "12px 14px", minWidth: 120 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ProgressBar value={event.ticketsSold} max={event.target} />
                        <span style={{ fontSize: 10, color: "#64748b", whiteSpace: "nowrap" }}>{Math.round((event.ticketsSold / event.target) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ══════════════════════════════════════════════════
            SECTION 2: TOP 3 SALESPERSONS PER CAMPAIGN — TODAY
        ══════════════════════════════════════════════════ */}
        <Card style={{ marginBottom: 28, animation: "scaleIn 0.4s ease 0.1s both" }}>
          <SectionHeader icon="🏆" subtitle="Top performers by campaign — updated in real-time">Today's Leaderboard</SectionHeader>
          {COUNTRIES.map(country => (
            <div key={country} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <span>{FLAGS[country]}</span> {country}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {dailySales[country]?.map(camp => (
                  <div key={camp.campaign} style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 10, padding: 14, transition: "border-color 0.2s ease" }}>
                    <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{camp.campaign}</p>
                    {camp.top3.map(person => (
                      <div key={person.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #111827" }}>
                        <RankBadge rank={person.rank} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{person.name}</p>
                          <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{person.sales} sales · {person.conversionRate}% conv.</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>£{person.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>

        {/* ══════════════════════════════════════════════════
            SECTION 3: TOP 3 SALESPERSONS PER CAMPAIGN — THIS WEEK
        ══════════════════════════════════════════════════ */}
        <Card style={{ marginBottom: 28, animation: "scaleIn 0.4s ease 0.15s both" }}>
          <SectionHeader icon="📊" subtitle="Cumulative weekly performance across all active campaigns">This Week's Leaderboard</SectionHeader>
          {COUNTRIES.map(country => (
            <div key={country} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <span>{FLAGS[country]}</span> {country}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {weeklySales[country]?.map(camp => (
                  <div key={camp.campaign} style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 10, padding: 14, transition: "border-color 0.2s ease" }}>
                    <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{camp.campaign}</p>
                    {camp.top3.map(person => (
                      <div key={person.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #111827" }}>
                        <RankBadge rank={person.rank} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{person.name}</p>
                          <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{person.sales} sales · {person.conversionRate}% conv.</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>£{person.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>

        {/* ══════════════════════════════════════════════════
            SECTION 4: CAMPAIGN BREAKDOWN — PRODUCT STATS
        ══════════════════════════════════════════════════ */}
        <Card style={{ marginBottom: 28, animation: "scaleIn 0.4s ease 0.2s both" }}>
          <SectionHeader icon="📦" subtitle="Detailed breakdown by feeding plan and box type for each campaign">Campaign Product Breakdown</SectionHeader>
          {campaignBreakdown.map((camp, ci) => (
            <div key={camp.campaign} style={{ marginBottom: 16 }}>
              <button
                onClick={() => setExpandedCampaign(expandedCampaign === ci ? null : ci)}
                style={{
                  width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 18px", background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 10,
                  cursor: "pointer", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif",
                  transition: "background 0.2s ease, border-color 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#0d1117"; e.currentTarget.style.borderColor = "#2d3748"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#0a0f1a"; e.currentTarget.style.borderColor = "#1e293b"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{camp.campaign}</span>
                  <span style={{ fontSize: 12, color: "#64748b", background: "#111827", padding: "2px 10px", borderRadius: 12 }}>
                    {camp.products.length} products
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <span style={{ fontSize: 13, color: "#34d399", fontWeight: 600 }}>£{camp.totalRevenue.toLocaleString()}</span>
                  <span style={{ fontSize: 13, color: "#60a5fa" }}>{camp.totalUnits.toLocaleString()} units</span>
                  <span style={{ fontSize: 18, color: "#64748b", transition: "transform 0.2s", transform: expandedCampaign === ci ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                </div>
              </button>
              {expandedCampaign === ci && (
                <div style={{ animation: "fadeUp 0.3s ease", marginTop: 4 }}>
                  {["Feeding Plan", "Box Type"].map(type => (
                    <div key={type} style={{ marginTop: 8 }}>
                      <p style={{ fontSize: 11, color: "#64748b", padding: "8px 18px", margin: 0, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{type}s</p>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            {["Product", "Units Sold", "Revenue", "Avg Order Value", "Return Rate"].map(h => (
                              <th key={h} style={{ padding: "6px 18px", textAlign: "left", fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {camp.products.filter(p => p.type === type).map((product, pi) => (
                            <tr key={product.name} style={{
                              borderBottom: "1px solid #111827",
                              background: pi % 2 === 0 ? "transparent" : "#0a0f1a08",
                              transition: "background 0.2s ease",
                            }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#0d1117"}
                              onMouseLeave={(e) => e.currentTarget.style.background = pi % 2 === 0 ? "transparent" : "#0a0f1a08"}
                            >
                              <td style={{ padding: "10px 18px", fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{product.name}</td>
                              <td style={{ padding: "10px 18px", fontSize: 13, fontWeight: 600, color: "#60a5fa", fontVariantNumeric: "tabular-nums" }}>{product.unitsSold}</td>
                              <td style={{ padding: "10px 18px", fontSize: 13, fontWeight: 600, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>£{product.revenue.toLocaleString()}</td>
                              <td style={{ padding: "10px 18px", fontSize: 13, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>£{product.avgOrderValue}</td>
                              <td style={{ padding: "10px 18px" }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: product.returnRate > 4 ? "#ef4444" : product.returnRate > 2 ? "#f59e0b" : "#34d399" }}>
                                  {product.returnRate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>

        {/* ══════════════════════════════════════════════════
            SECTION 5: NEXT WEEK'S EVENTS
        ══════════════════════════════════════════════════ */}
        <Card style={{ marginBottom: 40, animation: "scaleIn 0.4s ease 0.25s both" }}>
          <SectionHeader icon="🔮" subtitle="Upcoming events scheduled for next week across all territories">Next Week's Events</SectionHeader>
          {COUNTRIES.map(country => (
            <div key={country} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
                <span>{FLAGS[country]}</span> {country}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                {nextWeekEvents[country]?.map(event => (
                  <div key={event.id} style={{
                    background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 10, padding: 14,
                    display: "flex", flexDirection: "column", gap: 6,
                    transition: "border-color 0.2s ease, transform 0.2s ease",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2d3748"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{event.name}</p>
                      <StatusBadge status="upcoming" />
                    </div>
                    <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>📍 {event.venue}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>📆 {event.date}</span>
                      <span style={{ fontSize: 11, color: "#475569" }}>Target: {event.target} sales</span>
                    </div>
                    {WEATHER_ENABLED && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid #111827", paddingTop: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: "#475569" }}>☀️</span>
                        <WeatherCell venue={event.venue} weatherData={weatherData} loading={weatherLoading} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>

        {/* ── Footer ───────────────────────────────────── */}
        <div style={{ textAlign: "center", padding: "20px 0 40px", borderTop: "1px solid #111827" }}>
          <p style={{ fontSize: 11, color: "#334155", margin: 0 }}>Croci Collective Operations Portal · Prototype Dashboard · Data is simulated for demonstration</p>
        </div>
      </div>
    </div>
    </PasswordGate>
  );
}
