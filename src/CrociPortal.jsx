import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── Configuration ────────────────────────────────────────────────────
const OPENWEATHER_API_KEY = "YOUR_API_KEY_HERE"; // Replace with your OpenWeatherMap API key
const WEATHER_ENABLED = OPENWEATHER_API_KEY !== "YOUR_API_KEY_HERE";
const WEATHER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const USE_MOCK_DATA = false; // Set to true to use generated demo data

// ── Google Sheets Configuration ──────────────────────────────────────
const MASTER_TRACKER_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfQ_GG1qM6ZsP2No7yQKRVmtb6UjccbcXp--jOIHEUC0bYUaN4opouQBixctbC6G-XVGZfGA28yIZ1/pub?gid=1256054786&single=true&output=csv";
const SALES_ENTRIES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTd-lneum3ekG7RcjlQX9tzk2SfYlCzXz0rDbZvYNm9uI_gRmbMXAeAd3TefiabeRl5TaeqWg6VHRs5/pub?gid=250023368&single=true&output=csv";
const REFRESH_INTERVAL = 2.5 * 60 * 1000; // 2.5 minutes

// ── Password Protection ─────────────────────────────────────────────
const PASSWORD_PROTECTED = true;
const SITE_PASSWORD = "CrociTeam2025";

// ── Venue Coordinate Registry (Mock) ─────────────────────────────────
const VENUE_COORDINATES_MOCK = {
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

// ── Venue Coordinates (Live US Data) ─────────────────────────────────
const VENUE_COORDINATES_LIVE = {
  "I-X Center": { lat: 41.4120, lng: -81.7385 },
  "Huntington Convention Center of Cleveland": { lat: 41.4993, lng: -81.6944 },
  "Charlotte Convention Center": { lat: 35.2208, lng: -80.8439 },
  "Connecticut Convention Center": { lat: 41.7668, lng: -72.6734 },
  "Ohio State Fairgrounds": { lat: 40.0076, lng: -82.9988 },
  "Kentucky Exposition Center": { lat: 38.1941, lng: -85.7415 },
  "Boston Convention & Exhibition Center": { lat: 42.3456, lng: -71.0446 },
  "Vale Fieldhouse": { lat: 41.7658, lng: -72.6734 },
  "Northern Kentucky Convention Center": { lat: 39.0812, lng: -84.5085 },
  "Pennsylvania Convention Center": { lat: 39.9546, lng: -75.1593 },
  "Meadowlands Expo Center": { lat: 40.7863, lng: -74.0712 },
  "Donald E. Stephens Convention Center": { lat: 41.9773, lng: -87.8603 },
  "Greater Philadelphia Expo Center @ Oaks": { lat: 40.1318, lng: -75.4518 },
  "Indiana State Fairgrounds": { lat: 39.8271, lng: -86.1185 },
  "Greater Fort Lauderdale Broward County Convention Center": { lat: 26.0985, lng: -80.1261 },
  "Dulles Expo Center": { lat: 38.9565, lng: -77.4483 },
  "Georgia World Congress Center": { lat: 33.7590, lng: -84.3957 },
  "Ocean Center": { lat: 29.2117, lng: -81.0239 },
  "New Jersey Convention & Expo Center": { lat: 40.6584, lng: -74.1760 },
  "Suburban Collection Showplace": { lat: 42.5252, lng: -83.3644 },
  "Devos Place": { lat: 42.9664, lng: -85.6781 },
  "Kalamazoo County Expo Center": { lat: 42.2756, lng: -85.5720 },
  "Monroeville Convention Center": { lat: 40.4278, lng: -79.7612 },
  "Walter E Washington Convention Center": { lat: 38.9029, lng: -77.0228 },
  "Greater Columbus Convention Center": { lat: 39.9712, lng: -82.9961 },
  "Miami Beach Convention Center": { lat: 25.7954, lng: -80.1340 },
  "Tampa Convention Center": { lat: 27.9428, lng: -82.4580 },
  "Javits Center": { lat: 40.7575, lng: -74.0021 },
};

// ── US State Center Coordinates (fallback) ──────────────────────────
const STATE_COORDINATES = {
  OH: { lat: 40.42, lng: -82.91 }, FL: { lat: 27.66, lng: -81.52 },
  NC: { lat: 35.76, lng: -79.02 }, VA: { lat: 37.43, lng: -78.66 },
  CT: { lat: 41.60, lng: -72.76 }, PA: { lat: 41.20, lng: -77.19 },
  NJ: { lat: 40.06, lng: -74.41 }, NY: { lat: 42.17, lng: -74.95 },
  IL: { lat: 40.63, lng: -89.40 }, IN: { lat: 40.27, lng: -86.13 },
  KY: { lat: 37.84, lng: -84.27 }, MA: { lat: 42.41, lng: -71.38 },
  GA: { lat: 33.75, lng: -84.39 }, CA: { lat: 36.78, lng: -119.42 },
  MI: { lat: 44.31, lng: -84.36 }, MD: { lat: 39.05, lng: -76.64 },
  TX: { lat: 31.97, lng: -99.90 }, DC: { lat: 38.91, lng: -77.04 },
  WI: { lat: 43.78, lng: -88.79 }, MN: { lat: 46.73, lng: -94.69 },
  TN: { lat: 35.52, lng: -86.58 }, SC: { lat: 33.84, lng: -81.16 },
  CO: { lat: 39.55, lng: -105.78 }, AZ: { lat: 34.05, lng: -111.09 },
  WA: { lat: 47.75, lng: -120.74 }, OR: { lat: 43.80, lng: -120.55 },
  MO: { lat: 38.57, lng: -92.60 }, AL: { lat: 32.32, lng: -86.90 },
  LA: { lat: 30.98, lng: -91.96 }, NV: { lat: 38.80, lng: -116.42 },
};

const ALL_VENUE_COORDINATES = { ...VENUE_COORDINATES_MOCK, ...VENUE_COORDINATES_LIVE };

// ── Mock Data Constants ──────────────────────────────────────────────
const COUNTRIES = ["United Kingdom", "Ireland", "United States"];
const ACTIVE_COUNTRIES = USE_MOCK_DATA ? COUNTRIES : ["United States"];
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

// ── CSV Parser (RFC 4180 compliant) ──────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cell += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { row.push(cell.trim()); cell = ""; }
      else if (ch === "\n" || (ch === "\r" && next === "\n")) {
        row.push(cell.trim()); rows.push(row); row = []; cell = "";
        if (ch === "\r") i++;
      } else if (ch === "\r") {
        row.push(cell.trim()); rows.push(row); row = []; cell = "";
      } else { cell += ch; }
    }
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows;
}

// ── Date & Number Parsing Helpers ────────────────────────────────────
const MONTH_MAP = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };

function parseMasterDate(str) {
  if (!str || typeof str !== "string") return null;
  const parts = str.trim().split(/\s+/);
  if (parts.length < 3) return null;
  const day = parseInt(parts[1], 10);
  const month = MONTH_MAP[parts[2]];
  if (month === undefined || isNaN(day)) return null;
  return new Date(2026, month, day);
}

function parseSalesDate(str) {
  if (!str) return null;
  const parts = str.split("-");
  if (parts.length !== 3) return null;
  const [mm, dd, yyyy] = parts.map(Number);
  if (!mm || !dd || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

function parseNumber(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9.\-]/g, "");
  return parseFloat(cleaned) || 0;
}

function parseCurrency(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[$,\s]/g, "");
  return parseFloat(cleaned) || 0;
}

function getWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekSunday(monday) {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function extractStateAbbrev(stateStr) {
  if (!stateStr) return null;
  const match = stateStr.match(/[A-Z]{2}/);
  return match ? match[0] : null;
}

function formatDateForSales(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}-${dd}-${date.getFullYear()}`;
}

// ── Process Google Sheets Data ───────────────────────────────────────
function processData(masterRows, salesRows, selectedWeek) {
  // Parse Master Tracker — skip first 3 blank/header rows, row 3 is the real header
  const masterData = masterRows.slice(4);

  const events = masterData
    .filter(row => {
      if (!row || row.length < 17) return false;
      const bookingStatus = (row[2] || "").trim().toUpperCase();
      const eventName = (row[11] || "").trim();
      if (bookingStatus !== "BOOKED") return false;
      if (!eventName || eventName.toUpperCase().includes("WEEK BREAK")) return false;
      return true;
    })
    .map((row, index) => ({
      id: `event-${index}`,
      client: (row[3] || "").trim(),
      weekNum: (row[4] || "").trim(),
      month: (row[5] || "").trim(),
      startDate: parseMasterDate(row[6]),
      endDate: parseMasterDate(row[7]),
      startDateRaw: (row[6] || "").trim(),
      endDateRaw: (row[7] || "").trim(),
      liveDays: parseNumber(row[8]),
      eventType: (row[10] || "").trim(),
      eventName: (row[11] || "").trim(),
      location: (row[12] || "").trim(),
      state: (row[13] || "").trim(),
      salesTarget: parseNumber(row[15]),
      masterSales: parseNumber(row[16]),
      expectedStaff: parseNumber(row[20]),
      totalUpfronts: parseCurrency(row[36]),
      country: "United States",
    }));

  // Parse Sales Entries — skip 2 header rows
  const salesData = salesRows.slice(2)
    .filter(row => row && row.length >= 7)
    .map(row => {
      const agentField = (row[1] || "").trim();
      const agentParts = agentField.split(/\t/);
      return {
        date: parseSalesDate(row[0]),
        dateRaw: (row[0] || "").trim(),
        agentCode: (agentParts[0] || "").trim(),
        agentName: (agentParts[1] || agentParts[0] || "Unknown").trim(),
        eventName: (row[2] || "").trim(),
        paymentCompleted: (row[6] || "").trim().toUpperCase(),
      };
    })
    .filter(s => s.paymentCompleted === "YES" && s.date);

  // Group sales by event name (case-insensitive)
  const salesByEvent = {};
  salesData.forEach(sale => {
    const key = sale.eventName.toLowerCase();
    if (!salesByEvent[key]) salesByEvent[key] = [];
    salesByEvent[key].push(sale);
  });

  // Join: compute live stats for each event
  events.forEach(event => {
    const key = event.eventName.toLowerCase();
    const eventSales = salesByEvent[key] || [];
    event.liveSalesCount = eventSales.length;
    event.uniqueAgentCodes = new Set(eventSales.map(s => s.agentCode));
    event.uniqueAgents = event.uniqueAgentCodes.size;
    event.staffFraction = `${event.uniqueAgents} / ${event.expectedStaff || "?"}`;
    event.cpa = event.liveSalesCount > 0 ? (event.totalUpfronts / event.liveSalesCount) : null;
  });

  // Merge duplicate events within the same week (e.g. two booths at same show)
  const mergeMap = {};
  events.forEach(event => {
    const mergeKey = `${event.eventName.toLowerCase()}|||${event.weekNum}`;
    if (!mergeMap[mergeKey]) {
      mergeMap[mergeKey] = { ...event, uniqueAgentCodes: new Set(event.uniqueAgentCodes || []) };
    } else {
      const merged = mergeMap[mergeKey];
      merged.salesTarget += event.salesTarget || 0;
      merged.expectedStaff += event.expectedStaff || 0;
      merged.totalUpfronts += event.totalUpfronts || 0;
      merged.masterSales += event.masterSales || 0;
      merged.liveDays = Math.max(merged.liveDays || 0, event.liveDays || 0);
      // Combine unique agent sets (sales are already counted once per event name, so no double-counting)
      if (event.uniqueAgentCodes) {
        event.uniqueAgentCodes.forEach(code => merged.uniqueAgentCodes.add(code));
      }
      // Use earliest start date and latest end date for the combined event
      if (event.startDate && (!merged.startDate || event.startDate < merged.startDate)) {
        merged.startDate = event.startDate;
        merged.startDateRaw = event.startDateRaw;
      }
      if (event.endDate && (!merged.endDate || event.endDate > merged.endDate)) {
        merged.endDate = event.endDate;
        merged.endDateRaw = event.endDateRaw;
      }
    }
  });

  // Recalculate derived fields for merged events and build final array
  const mergedEvents = Object.values(mergeMap).map(event => {
    event.uniqueAgents = event.uniqueAgentCodes.size;
    event.staffFraction = `${event.uniqueAgents} / ${event.expectedStaff || "?"}`;
    event.liveSalesCount = event.liveSalesCount || 0;
    event.cpa = event.liveSalesCount > 0 ? (event.totalUpfronts / event.liveSalesCount) : null;
    return event;
  });

  // Determine available weeks
  const weekNums = [...new Set(mergedEvents.map(e => e.weekNum).filter(Boolean))];
  weekNums.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10);
    const numB = parseInt(b.replace(/\D/g, ""), 10);
    return numA - numB;
  });

  // Determine current week by date overlap
  const today = new Date();
  const currentMonday = getWeekMonday(today);
  const currentSunday = getWeekSunday(currentMonday);
  let currentWeek = null;
  for (const event of mergedEvents) {
    if (event.startDate && event.endDate) {
      if (event.startDate <= currentSunday && event.endDate >= currentMonday) {
        currentWeek = event.weekNum;
        break;
      }
    }
  }

  const activeWeek = selectedWeek || currentWeek || weekNums[weekNums.length - 1] || "WK1";
  const activeWeekNum = parseInt((activeWeek || "").replace(/\D/g, ""), 10);
  const nextWeekLabel = `WK${activeWeekNum + 1}`;

  const thisWeekEvts = mergedEvents.filter(e => e.weekNum === activeWeek);
  const nextWeekEvts = mergedEvents.filter(e => e.weekNum === nextWeekLabel);

  // Build leaderboard from sales data
  const thisWeekEventNames = new Set(thisWeekEvts.map(e => e.eventName.toLowerCase()));
  const weekSalesForLeaderboard = salesData.filter(s =>
    thisWeekEventNames.has(s.eventName.toLowerCase())
  );

  const todayStr = formatDateForSales(today);
  const todaySalesForLeaderboard = weekSalesForLeaderboard.filter(s => s.dateRaw === todayStr);

  function buildLeaderboard(salesList) {
    const byEvent = {};
    salesList.forEach(sale => {
      if (!byEvent[sale.eventName]) byEvent[sale.eventName] = {};
      if (!byEvent[sale.eventName][sale.agentName]) {
        byEvent[sale.eventName][sale.agentName] = 0;
      }
      byEvent[sale.eventName][sale.agentName]++;
    });

    return Object.entries(byEvent).map(([eventName, agents]) => ({
      campaign: eventName,
      top3: Object.entries(agents)
        .map(([name, sales]) => ({ name, sales, revenue: 0, conversionRate: 0, rank: 0 }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 3)
        .map((p, i) => ({ ...p, rank: i + 1 })),
    }));
  }

  const dailyLeaderboard = buildLeaderboard(todaySalesForLeaderboard);
  const weeklyLeaderboard = buildLeaderboard(weekSalesForLeaderboard);

  // Transform events to dashboard shape
  function toEventShape(event) {
    let status = "upcoming";
    if (event.startDate && event.endDate) {
      if (today >= event.startDate && today <= event.endDate) status = "live";
      else if (today > event.endDate) status = "completed";
    }

    return {
      id: event.id,
      name: event.eventName,
      venue: event.location,
      location: event.location,
      state: event.state,
      date: `${event.startDateRaw} - ${event.endDateRaw}`,
      rawDate: event.startDate || new Date(),
      ticketsSold: event.liveSalesCount,
      revenue: event.totalUpfronts,
      target: event.salesTarget,
      status,
      campaign: event.client,
      country: "United States",
      staffFraction: event.staffFraction,
      uniqueAgents: event.uniqueAgents,
      expectedStaff: event.expectedStaff,
      cpa: event.cpa,
      totalUpfronts: event.totalUpfronts,
      salesTarget: event.salesTarget,
      masterSales: event.masterSales,
      weekNum: event.weekNum,
      eventType: event.eventType,
    };
  }

  // Build recent sales for live ticker
  const recentSales = salesData
    .sort((a, b) => (b.date || 0) - (a.date || 0))
    .slice(0, 20)
    .map((sale, i) => ({
      id: `sale-${i}-${sale.dateRaw}`,
      eventName: sale.eventName,
      venue: sale.eventName,
      agentName: sale.agentName,
      product: sale.agentName,
      amount: 0,
      time: sale.dateRaw,
    }));

  return {
    data: {
      thisWeekEvents: { "United States": thisWeekEvts.map(toEventShape) },
      nextWeekEvents: { "United States": nextWeekEvts.map(toEventShape) },
      dailySales: { "United States": dailyLeaderboard },
      weeklySales: { "United States": weeklyLeaderboard },
      campaignBreakdown: [],
    },
    availableWeeks: weekNums,
    currentWeek: currentWeek || weekNums[weekNums.length - 1] || "WK1",
    recentSales,
  };
}

// ── Data Generators (Mock) ───────────────────────────────────────────
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
      name: plan, type: "Feeding Plan", unitsSold: randInt(20, 400),
      revenue: randInt(1400, 28000), avgOrderValue: randFloat(28, 120), returnRate: randFloat(0.5, 6),
    })).concat(PRODUCTS.boxTypes.map(box => ({
      name: box, type: "Box Type", unitsSold: randInt(15, 320),
      revenue: randInt(900, 22000), avgOrderValue: randFloat(18, 95), returnRate: randFloat(0.8, 5),
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
  const currencySymbol = USE_MOCK_DATA ? "\u00a3" : "$";
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
      const pct = event.target > 0 ? Math.round((event.ticketsSold / event.target) * 100) : 0;
      if (pct > 80) return { type: "milestone", message: `${event.venue} is at ${pct}% of target!` };
      if (pct < 30) return { type: "warning", message: `${event.venue} only at ${pct}% of target \u2014 needs attention` };
      return { type: "info", message: `${event.venue} currently at ${pct}% of daily target` };
    },
    () => {
      const liveEvts = events.flat().filter(e => e.status === "live");
      if (!liveEvts.length) return null;
      const totalRev = liveEvts.reduce((s, e) => s + e.revenue, 0);
      return { type: "info", message: `Total live upfronts across all events: ${currencySymbol}${totalRev.toLocaleString()}` };
    },
  ];

  const template = pick(templates);
  const result = template();
  if (!result) return null;

  return { id: Date.now() + Math.random(), ...result, timestamp: new Date(), read: false };
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

function useGoogleSheetsData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const isFirstFetch = useRef(true);

  const fetchData = useCallback(async () => {
    if (USE_MOCK_DATA) return;
    try {
      if (isFirstFetch.current) setLoading(true);

      const [masterRes, salesRes] = await Promise.all([
        fetch(MASTER_TRACKER_URL),
        fetch(SALES_ENTRIES_URL),
      ]);

      if (!masterRes.ok) throw new Error(`Master tracker: HTTP ${masterRes.status}`);
      if (!salesRes.ok) throw new Error(`Sales entries: HTTP ${salesRes.status}`);

      const masterText = await masterRes.text();
      const salesText = await salesRes.text();

      const masterRows = parseCSV(masterText);
      const salesRows = parseCSV(salesText);

      const processed = processData(masterRows, salesRows, selectedWeek);

      setData(processed.data);
      setAvailableWeeks(processed.availableWeeks);
      setCurrentWeek(processed.currentWeek);
      if (!selectedWeek) setSelectedWeek(processed.currentWeek);
      setRecentSales(processed.recentSales);
      setLastUpdated(new Date());
      setError(null);
      isFirstFetch.current = false;
    } catch (err) {
      setError(err.message);
      isFirstFetch.current = false;
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, lastUpdated, availableWeeks, selectedWeek, setSelectedWeek, currentWeek, recentSales };
}

function useLiveSales(thisWeekEvents) {
  const [liveSales, setLiveSales] = useState([]);
  const eventsRef = useRef(thisWeekEvents);
  eventsRef.current = thisWeekEvents;

  useEffect(() => {
    if (!USE_MOCK_DATA) return; // Only generate fake sales in mock mode
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

        const coords = ALL_VENUE_COORDINATES[venue];
        if (!coords) {
          // Try state fallback
          continue;
        }

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
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
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

const LiveSaleTicker = ({ sales, isLive }) => {
  if (!sales.length) return null;
  const currencySymbol = USE_MOCK_DATA ? "\u00a3" : "$";
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, position: "relative" }}>
      {sales.slice(0, 8).map((sale, i) => (
        <div key={sale.id} style={{
          minWidth: 220, padding: "10px 14px", background: "linear-gradient(135deg, #0f2d1a, #0a1628)",
          border: "1px solid #34d39922", borderRadius: 10, animation: i === 0 ? "slideIn 0.4s ease" : "none",
          flexShrink: 0,
        }}>
          {USE_MOCK_DATA ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: "#34d399", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{currencySymbol}{sale.amount.toFixed(2)}</span>
                <span style={{ color: "#475569", fontSize: 10 }}>{sale.time}</span>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{sale.product}</div>
              <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>{sale.venue}</div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: "#34d399", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{sale.agentName || sale.product}</span>
                <span style={{ color: "#475569", fontSize: 10 }}>{sale.time}</span>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{sale.eventName}</div>
            </>
          )}
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

    const defaultCenter = USE_MOCK_DATA ? [48.0, -10.0] : [39.8, -98.5];
    const defaultZoom = USE_MOCK_DATA ? 3 : 4;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    }).setView(defaultCenter, defaultZoom);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "\u00a9 OSM \u00a9 CARTO",
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

    const currencySymbol = USE_MOCK_DATA ? "\u00a3" : "$";

    events.forEach(event => {
      let coords = ALL_VENUE_COORDINATES[event.venue];

      // Fallback: try state abbreviation
      if (!coords && event.state) {
        const abbrev = extractStateAbbrev(event.state);
        if (abbrev) coords = STATE_COORDINATES[abbrev];
      }

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
      const statusDot = event.status === "live" ? '<span style="color:#34d399">\u25cf</span>' : event.status === "upcoming" ? '<span style="color:#a78bfa">\u25cf</span>' : '<span style="color:#64748b">\u25cf</span>';

      marker.bindPopup(
        `<div style="font-family:'DM Sans',sans-serif;min-width:180px">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:#f1f5f9">${event.name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">\ud83d\udccd ${event.venue}</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:8px">\ud83d\udcc6 ${event.date}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:11px">${statusDot} ${statusLabel}</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-top:1px solid #1e293b;padding-top:6px;margin-top:4px">
            <span style="font-size:12px;color:#60a5fa;font-weight:600">${event.ticketsSold} sales</span>
            <span style="font-size:12px;color:#34d399;font-weight:600">${currencySymbol}${event.revenue.toLocaleString()}</span>
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

// ── World Clocks Component ───────────────────────────────────────────
function WorldClocks({ currentTime }) {
  const zones = [
    { city: "Los Angeles", tz: "America/Los_Angeles", abbr: "PT" },
    { city: "New York", tz: "America/New_York", abbr: "ET" },
    { city: "London", tz: "Europe/London", abbr: "GMT" },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      {zones.map(({ city, tz, abbr }) => {
        const localStr = currentTime.toLocaleString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", second: "2-digit", hour12: false });
        const parts = localStr.split(":");
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const s = parseInt(parts[2], 10);
        const hourDeg = ((h % 12) + m / 60) * 30;
        const minDeg = (m + s / 60) * 6;
        const secDeg = s * 6;
        const size = 52;
        const cx = size / 2;
        const cy = size / 2;

        function hand(length, deg, width, color, round) {
          const rad = ((deg - 90) * Math.PI) / 180;
          const x2 = cx + length * Math.cos(rad);
          const y2 = cy + length * Math.sin(rad);
          return (
            <line x1={cx} y1={cy} x2={x2} y2={y2}
              stroke={color} strokeWidth={width}
              strokeLinecap={round ? "round" : "butt"}
            />
          );
        }

        // Hour markers
        const markers = [];
        for (let i = 0; i < 12; i++) {
          const angle = ((i * 30 - 90) * Math.PI) / 180;
          const outer = cx - 3;
          const inner = i % 3 === 0 ? cx - 7 : cx - 5;
          markers.push(
            <line key={i}
              x1={cx + inner * Math.cos(angle)} y1={cy + inner * Math.sin(angle)}
              x2={cx + outer * Math.cos(angle)} y2={cy + outer * Math.sin(angle)}
              stroke={i % 3 === 0 ? "#94a3b8" : "#334155"}
              strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
              strokeLinecap="round"
            />
          );
        }

        const digitalTime = currentTime.toLocaleTimeString("en-US", {
          timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true,
        });

        return (
          <div key={city} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: size, height: size, borderRadius: "50%",
              background: "radial-gradient(circle at 40% 35%, #111827, #060a10)",
              border: "1.5px solid #1e293b",
              boxShadow: "0 0 12px rgba(52,211,153,0.06), inset 0 1px 2px rgba(255,255,255,0.03)",
              position: "relative",
            }}>
              <svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
                {markers}
                {hand(14, hourDeg, 2.2, "#e2e8f0", true)}
                {hand(19, minDeg, 1.5, "#94a3b8", true)}
                {hand(20, secDeg, 0.6, "#34d399", false)}
                <circle cx={cx} cy={cy} r={2} fill="#34d399" />
                <circle cx={cx} cy={cy} r={0.8} fill="#060a10" />
              </svg>
            </div>
            <div style={{ textAlign: "center", lineHeight: 1.2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.5, fontFamily: "'DM Sans', sans-serif" }}>
                {digitalTime}
              </div>
              <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Sans', sans-serif" }}>
                {city}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
          width: 60, height: 60, borderRadius: 16, margin: "0 auto 20px",
          background: "linear-gradient(135deg, #34d399, #059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 700, color: "#000",
          fontFamily: "'Playfair Display', serif",
          boxShadow: "0 4px 20px rgba(52,211,153,0.3)",
        }}>C</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px", letterSpacing: -0.3 }}>
          Croci <span style={{ color: "#34d399" }}>Collective</span>
        </h1>
        <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 28px", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
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

// ── Main Dashboard ───────────────────────────────────────────────────
export default function CrociPortal() {
  const [activeCountry, setActiveCountry] = useState("United States");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  // Data hooks — both always called (React rules), only one used
  const mockResult = useStableData();
  const sheetsResult = useGoogleSheetsData();

  const activeResult = USE_MOCK_DATA ? mockResult : sheetsResult;
  const { data, loading: sheetsLoading, error: sheetsError, lastUpdated, availableWeeks, selectedWeek, setSelectedWeek, currentWeek, recentSales } = {
    ...sheetsResult,
    ...activeResult,
    data: activeResult.data,
  };

  const { thisWeekEvents = {}, nextWeekEvents = {}, dailySales = {}, weeklySales = {}, campaignBreakdown = [] } = data || {};

  const liveSales = useLiveSales(thisWeekEvents);
  const displaySales = USE_MOCK_DATA ? liveSales : (recentSales || []);

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

  const currencySymbol = USE_MOCK_DATA ? "\u00a3" : "$";
  const totalRevToday = Object.values(thisWeekEvents).flat().reduce((s, e) => s + e.revenue, 0);
  const totalSalesToday = Object.values(thisWeekEvents).flat().reduce((s, e) => s + e.ticketsSold, 0);
  const liveCount = Object.values(thisWeekEvents).flat().filter(e => e.status === "live").length;

  const thisWeekHeaders = USE_MOCK_DATA
    ? (WEATHER_ENABLED
      ? ["Event", "Venue", "Date", "Weather", "Status", "Sales", "Revenue", "Progress"]
      : ["Event", "Venue", "Date", "Status", "Sales", "Revenue", "Progress"])
    : ["Event", "Location", "State", "Dates", "Status", "Sales / Target", "Staff", "CPA"];

  const kpis = USE_MOCK_DATA
    ? [
        { label: "Live Events", value: liveCount, color: "#34d399", icon: "📡" },
        { label: "Sales Today", value: totalSalesToday.toLocaleString(), color: "#60a5fa", icon: "🛒" },
        { label: "Revenue Today", value: `${currencySymbol}${totalRevToday.toLocaleString()}`, color: "#f59e0b", icon: "💰" },
        { label: "Active Countries", value: COUNTRIES.length, color: "#a78bfa", icon: "🌍" },
      ]
    : [
        { label: "Live Events", value: liveCount, color: "#34d399", icon: "📡" },
        { label: "Total Sales (Week)", value: totalSalesToday.toLocaleString(), color: "#60a5fa", icon: "🛒" },
        { label: "Total Upfronts", value: `$${totalRevToday.toLocaleString()}`, color: "#f59e0b", icon: "💰" },
        { label: "Events This Week", value: (thisWeekEvents["United States"] || []).length, color: "#a78bfa", icon: "📋" },
      ];

  // Loading state for live data
  if (!USE_MOCK_DATA && sheetsLoading && !data) {
    return (
      <PasswordGate>
        <div style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #060a10 0%, #0a0f1a 40%, #080d16 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 20px",
              background: "linear-gradient(135deg, #34d399, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, fontWeight: 700, color: "#000",
              fontFamily: "'Playfair Display', serif",
            }}>C</div>
            <p style={{ color: "#64748b", fontSize: 14 }}>Loading live data from Google Sheets...</p>
            <div style={{ width: 200, height: 4, background: "#1e293b", borderRadius: 2, margin: "16px auto", overflow: "hidden" }}>
              <div style={{ width: "40%", height: "100%", background: "#34d399", borderRadius: 2, animation: "shimmer 1.5s infinite" }} />
            </div>
          </div>
        </div>
      </PasswordGate>
    );
  }

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
        padding: "16px clamp(16px, 3vw, 32px)",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(90deg, #060a10ee, #0d1117ee)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexWrap: "wrap",
        gap: 12,
      }}>
        {/* Left: Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "linear-gradient(135deg, #34d399, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 700, color: "#000",
            fontFamily: "'Playfair Display', serif",
            boxShadow: "0 2px 12px rgba(52,211,153,0.25)",
          }}>C</div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, margin: 0, color: "#f1f5f9", letterSpacing: -0.3 }}>
              Croci <span style={{ color: "#34d399" }}>Collective</span>
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <p style={{ fontSize: 10, color: "#64748b", margin: 0, letterSpacing: 1.8, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>Operations Portal</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "pulse 1.5s infinite" }} />
                <span style={{ fontSize: 9, color: "#34d399", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center-Right: World Clocks */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <WorldClocks currentTime={currentTime} />

          {/* Divider */}
          <div style={{ width: 1, height: 48, background: "linear-gradient(180deg, transparent, #1e293b, transparent)" }} />

          {/* Right: Status + Date */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <NotificationBell unreadCount={unreadCount} onClick={(e) => { e.stopPropagation(); setNotifOpen(prev => !prev); }} />
            {!USE_MOCK_DATA && lastUpdated && (
              <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.3, textAlign: "center" }}>
                <div style={{ color: "#64748b", fontWeight: 500 }}>Updated</div>
                <div>{timeAgo(lastUpdated)}</div>
              </div>
            )}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>
                {currentTime.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
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

        {/* ── Error Banner ───────────────────────────────── */}
        {!USE_MOCK_DATA && sheetsError && (
          <div style={{
            padding: "12px 20px", marginBottom: 20,
            background: "#1a0a0a", border: "1px solid #ef4444", borderRadius: 10,
          }}>
            <span style={{ color: "#ef4444", fontSize: 13 }}>
              Data error: {sheetsError}. {data ? "Showing cached data." : "Retrying..."}
            </span>
          </div>
        )}

        {/* ── KPI Strip ────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          {kpis.map((kpi, i) => (
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
            <span style={{ fontSize: 13, fontWeight: 600, color: "#34d399", textTransform: "uppercase", letterSpacing: 1 }}>
              {USE_MOCK_DATA ? "Live Sales Feed" : "Recent Sales Entries"}
            </span>
          </div>
          <LiveSaleTicker sales={displaySales} isLive={!USE_MOCK_DATA} />
          {displaySales.length === 0 && <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Waiting for incoming sales...</p>}
        </Card>

        {/* ══════════════════════════════════════════════════
            SECTION 1: THIS WEEK'S EVENTS
        ══════════════════════════════════════════════════ */}
        <Card style={{ marginBottom: 28, animation: "scaleIn 0.4s ease" }}>
          <SectionHeader icon="📅" subtitle="All live and scheduled events with real-time sales data">
            {USE_MOCK_DATA ? "This Week's Events" : `Events \u2014 ${selectedWeek || "This Week"}`}
          </SectionHeader>

          {/* Week Picker (live mode only) */}
          {!USE_MOCK_DATA && availableWeeks && availableWeeks.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Week:</label>
              <select
                value={selectedWeek || ""}
                onChange={(e) => setSelectedWeek(e.target.value)}
                style={{
                  padding: "6px 12px", borderRadius: 8,
                  background: "#0a0f1a", border: "1px solid #1e293b",
                  color: "#e2e8f0", fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer", outline: "none",
                }}
              >
                {availableWeeks.map(wk => (
                  <option key={wk} value={wk}>
                    {wk}{wk === currentWeek ? " (Current)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Country Tabs (mock mode only) */}
          {USE_MOCK_DATA && (
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {ACTIVE_COUNTRIES.map(c => <CountryTab key={c} country={c} active={activeCountry === c} onClick={() => setActiveCountry(c)} />)}
            </div>
          )}

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
                {USE_MOCK_DATA ? (
                  thisWeekEvents[activeCountry]?.map((event, i) => (
                    <tr key={event.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both`, transition: "background 0.2s ease", cursor: "default" }}
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
                      <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>{currencySymbol}{event.revenue.toLocaleString()}</td>
                      <td style={{ padding: "12px 14px", minWidth: 120 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ProgressBar value={event.ticketsSold} max={event.target} />
                          <span style={{ fontSize: 10, color: "#64748b", whiteSpace: "nowrap" }}>{event.target > 0 ? Math.round((event.ticketsSold / event.target) * 100) : 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  (thisWeekEvents["United States"] || []).map((event, i) => (
                    <tr key={event.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both`, transition: "background 0.2s ease", cursor: "default" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#0d1117"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{event.name}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{event.location || event.venue}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{event.state}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>{event.date}</td>
                      <td style={{ padding: "12px 14px" }}><StatusBadge status={event.status} /></td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa", fontVariantNumeric: "tabular-nums" }}>{event.ticketsSold}</span>
                          <span style={{ color: "#475569", fontSize: 12 }}>/ {event.target || "?"}</span>
                          <ProgressBar value={event.ticketsSold} max={event.target || 1} color={event.target > 0 && event.ticketsSold >= event.target ? "#34d399" : "#60a5fa"} />
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: event.uniqueAgents >= event.expectedStaff && event.expectedStaff > 0 ? "#34d399" : "#f59e0b" }}>
                          {event.staffFraction}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {event.cpa !== null
                          ? <span style={{ fontSize: 13, fontWeight: 700, color: event.cpa <= 80 ? "#34d399" : event.cpa <= 150 ? "#f59e0b" : "#ef4444", fontVariantNumeric: "tabular-nums" }}>${event.cpa.toFixed(2)}</span>
                          : <span style={{ color: "#475569", fontSize: 12 }}>--</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {!USE_MOCK_DATA && (thisWeekEvents["United States"] || []).length === 0 && (
              <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 20 }}>No events found for {selectedWeek}</p>
            )}
          </div>
        </Card>

        {/* ══════════════════════════════════════════════════
            SECTION 2: LEADERBOARD — TODAY
        ══════════════════════════════════════════════════ */}
        <Card style={{ marginBottom: 28, animation: "scaleIn 0.4s ease 0.1s both" }}>
          <SectionHeader icon="🏆" subtitle={USE_MOCK_DATA ? "Top performers by campaign \u2014 updated in real-time" : "Top performers by event \u2014 based on live sales entries"}>Today's Leaderboard</SectionHeader>
          {USE_MOCK_DATA ? (
            ACTIVE_COUNTRIES.map(country => (
              <div key={country} style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{FLAGS[country]}</span> {country}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                  {dailySales[country]?.map(camp => (
                    <div key={camp.campaign} style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
                      <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{camp.campaign}</p>
                      {camp.top3.map(person => (
                        <div key={person.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #111827" }}>
                          <RankBadge rank={person.rank} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{person.name}</p>
                            <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{person.sales} sales · {person.conversionRate}% conv.</p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>{currencySymbol}{person.revenue.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div>
              {(dailySales["United States"] || []).length === 0 ? (
                <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 20 }}>No sales recorded for today yet</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                  {(dailySales["United States"] || []).map(camp => (
                    <div key={camp.campaign} style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
                      <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{camp.campaign}</p>
                      {camp.top3.map(person => (
                        <div key={person.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #111827" }}>
                          <RankBadge rank={person.rank} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{person.name}</p>
                            <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{person.sales} sales</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════
            SECTION 3: LEADERBOARD — THIS WEEK
        ══════════════════════════════════════════════════ */}
        <Card style={{ marginBottom: 28, animation: "scaleIn 0.4s ease 0.15s both" }}>
          <SectionHeader icon="📊" subtitle={USE_MOCK_DATA ? "Cumulative weekly performance across all active campaigns" : `Cumulative performance for ${selectedWeek || "this week"}`}>
            {USE_MOCK_DATA ? "This Week's Leaderboard" : `${selectedWeek || "Week"} Leaderboard`}
          </SectionHeader>
          {USE_MOCK_DATA ? (
            ACTIVE_COUNTRIES.map(country => (
              <div key={country} style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{FLAGS[country]}</span> {country}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                  {weeklySales[country]?.map(camp => (
                    <div key={camp.campaign} style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
                      <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{camp.campaign}</p>
                      {camp.top3.map(person => (
                        <div key={person.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #111827" }}>
                          <RankBadge rank={person.rank} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{person.name}</p>
                            <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{person.sales} sales · {person.conversionRate}% conv.</p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>{currencySymbol}{person.revenue.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div>
              {(weeklySales["United States"] || []).length === 0 ? (
                <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 20 }}>No sales data for {selectedWeek} events yet</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                  {(weeklySales["United States"] || []).map(camp => (
                    <div key={camp.campaign} style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
                      <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{camp.campaign}</p>
                      {camp.top3.map(person => (
                        <div key={person.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #111827" }}>
                          <RankBadge rank={person.rank} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{person.name}</p>
                            <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{person.sales} sales</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════
            SECTION 4: CAMPAIGN BREAKDOWN (mock mode only)
        ══════════════════════════════════════════════════ */}
        {USE_MOCK_DATA && (
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
                    <span style={{ fontSize: 13, color: "#34d399", fontWeight: 600 }}>{currencySymbol}{camp.totalRevenue.toLocaleString()}</span>
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
                                <td style={{ padding: "10px 18px", fontSize: 13, fontWeight: 600, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>{currencySymbol}{product.revenue.toLocaleString()}</td>
                                <td style={{ padding: "10px 18px", fontSize: 13, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{currencySymbol}{product.avgOrderValue}</td>
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
        )}

        {/* ══════════════════════════════════════════════════
            SECTION 5: NEXT WEEK'S EVENTS
        ══════════════════════════════════════════════════ */}
        <Card style={{ marginBottom: 40, animation: "scaleIn 0.4s ease 0.25s both" }}>
          <SectionHeader icon="🔮" subtitle={USE_MOCK_DATA ? "Upcoming events scheduled for next week across all territories" : `Events scheduled for next week`}>
            {USE_MOCK_DATA ? "Next Week's Events" : `Next Week (WK${(parseInt((selectedWeek || "WK0").replace(/\D/g, ""), 10) || 0) + 1})`}
          </SectionHeader>
          {USE_MOCK_DATA ? (
            ACTIVE_COUNTRIES.map(country => (
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
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {(nextWeekEvents["United States"] || []).length === 0 ? (
                <p style={{ color: "#475569", fontSize: 13, padding: 10 }}>No events scheduled for next week yet</p>
              ) : (
                (nextWeekEvents["United States"] || []).map(event => (
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
                    <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>📍 {event.location || event.venue}{event.state ? `, ${event.state}` : ""}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>📆 {event.date}</span>
                      <span style={{ fontSize: 11, color: "#475569" }}>Target: {event.target || "?"} sales</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        {/* ── Footer ───────────────────────────────────── */}
        <div style={{ textAlign: "center", padding: "20px 0 40px", borderTop: "1px solid #111827" }}>
          <p style={{ fontSize: 11, color: "#334155", margin: 0 }}>
            Croci Collective Operations Portal {USE_MOCK_DATA
              ? "\u00b7 Prototype Dashboard \u00b7 Data is simulated for demonstration"
              : `\u00b7 Live data from Google Sheets${lastUpdated ? ` \u00b7 Last refreshed ${timeAgo(lastUpdated)}` : ""}`}
          </p>
        </div>
      </div>
    </div>
    </PasswordGate>
  );
}
