const express = require("express");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

const app = express();

// =========================================================
// 1. GLOBAL CRASH PROTECTION (NEVER LET THE SERVER DIE)
// =========================================================
process.on("uncaughtException", err => {
  console.error("⚠️ [UNCAUGHT EXCEPTION - SERVER KEPT ALIVE]:", err.message);
});
process.on("unhandledRejection", err => {
  console.error("⚠️ [UNHANDLED REJECTION - SERVER KEPT ALIVE]:", err);
});

// =========================================================
// 2. BUILT-IN RATE LIMITER (PROTECTS AGAINST SPAM & DDOS)
// =========================================================
const ipRequestMap = new Map();
setInterval(() => ipRequestMap.clear(), 60 * 1000);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);

  if (req.path.startsWith("/api/")) {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const count = (ipRequestMap.get(ip) || 0) + 1;
    ipRequestMap.set(ip, count);
    if (count > 180) {
      return res.status(429).json({ error: "Too many requests! Please wait a moment and try again." });
    }
  }
  next();
});

app.use(express.json({ limit: "250kb" }));

app.use(
  express.static(__dirname, {
    maxAge: "1d",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    }
  })
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "front.html"));
});

const DEVELOPER_EMAIL = "01fe25bcs252@kletech.ac.in";
const MAX_ADMINS = 16;

// SEPARATE DATABASE FOLDER FOR EACH CLUB (.json per club)
const DB_FOLDER = path.join(__dirname, "databases");
if (!fs.existsSync(DB_FOLDER)) {
  fs.mkdirSync(DB_FOLDER, { recursive: true });
}

const ADMINS_FILE = path.join(DB_FOLDER, "club_admins.json");
const LOGGED_STUDENTS_FILE = path.join(DB_FOLDER, "logged_in_students.json");
const EVENTS_FILE = path.join(DB_FOLDER, "events.json");
const CLUB_PAGES_FILE = path.join(DB_FOLDER, "club_pages.json");

const DEFAULT_EVENTS = [
  {
    id: "ev_1",
    title: "Hack Night",
    club_name: "Code Club",
    description: "An overnight coding sprint with mentors, snacks and prizes.",
    venue: "Main Auditorium",
    event_date: "2026-12-05",
    event_time: "18:00"
  },
  {
    id: "ev_2",
    title: "Kannada Rajyotsava & Cultural Fest",
    club_name: "Kannada Balaga",
    description: "Celebrate heritage, music, dance and literature across campus.",
    venue: "Open Air Theatre",
    event_date: "2026-12-12",
    event_time: "17:00"
  },
  {
    id: "ev_3",
    title: "Aero & Rocketry Expo",
    club_name: "Aerokle",
    description: "Live drone flight demos, model rockets and student hardware showcases.",
    venue: "Sports Ground",
    event_date: "2026-12-19",
    event_time: "09:00"
  },
  {
    id: "ev_4",
    title: "Media & Literary Walk",
    club_name: "Kletech Media",
    description: "Campus storytelling, photography and creative writing sessions.",
    venue: "Campus Gate",
    event_date: "2027-01-07",
    event_time: "16:00"
  }
];

const DEFAULT_CLUB_PAGES = {
  "Dance Club": {
    category: "Cultural Clubs",
    tagline: "Express rhythm, grace, and high-energy choreography on every campus stage.",
    theme_primary: "#be185d", theme_secondary: "#f43f5e", theme_bg: "#fff1f2",
    banner_img: "images/dance.png",
    about: "The KLE Tech Dance Club brings together classical, contemporary, hip-hop, and folk dancers. Members train in studio sessions, choreograph flagship routines for campus fests, and represent the university at national cultural competitions.",
    offline_test_info: "2-minute solo or duo live audition in front of the Dance Club core panel at the Student Activity Center.",
    registration_link: "",
    advantages: ["Perform at flagship university fests and inter-college cultural competitions", "Weekly choreography workshops led by senior dancers and guest artists", "Access to dedicated practice studio slots and stage production equipment"],
    benefits: ["Official KLE Tech Cultural Certificate and extra-curricular credit points", "Priority travel and registration sponsorship for national dance fests", "Build stage confidence, teamwork, and fitness alongside passionate performers"]
  },
  "Music Club": {
    category: "Cultural Clubs",
    tagline: "Where vocalists, instrumentalists, and bands create unforgettable campus anthems.",
    theme_primary: "#7c3aed", theme_secondary: "#a855f7", theme_bg: "#f5f3ff",
    banner_img: "images/music.png",
    about: "From classical ragas and acoustic unplugged nights to battle-of-the-bands rock shows, the Music Club is the heartbeat of campus live entertainment.",
    offline_test_info: "Live vocal or instrumental audition (bring your own instrument or backing track) evaluated on pitch, rhythm, and stage presence.",
    registration_link: "",
    advantages: ["Jam sessions in the university music room with full band gear and PA setup", "Headline campus concerts, open-air acoustic nights, and cultural fests", "Collaborate with songwriters, sound engineers, and fellow musicians"],
    benefits: ["Hands-on experience with live audio mixing, recording, and stage setup", "Official representation in national Battle of Bands and solo vocal events", "Lifetime network of campus musicians and alumni performers"]
  },
  "Drama Club": {
    category: "Cultural Clubs",
    tagline: "Command the stage through powerful theatre, street plays, and storytelling.",
    theme_primary: "#b45309", theme_secondary: "#f59e0b", theme_bg: "#fffbeb",
    banner_img: "images/drama.png",
    about: "The Drama Club produces thought-provoking Nukkad Natak (street plays), full-length stage dramas, mime acts, and scriptwriting workshops across campus.",
    offline_test_info: "On-spot monologue delivery and improvisation round conducted by the Drama Club directors.",
    registration_link: "",
    advantages: ["Master voice modulation, method acting, scriptwriting, and stage direction", "Lead high-impact Nukkad Natak performances across Karnataka", "Work behind the scenes on stage lighting, props, and sound cues"],
    benefits: ["Overcome public speaking fear and develop commanding communication skills", "Earn cultural recognition certificates and fest awards", "Be part of a tight-knit creative family on campus"]
  },
  "Wordsworth (Literary Club)": {
    category: "Cultural Clubs",
    tagline: "Sharpen your wit through debates, poetry slams, quizzes, and creative writing.",
    theme_primary: "#0f766e", theme_secondary: "#14b8a6", theme_bg: "#f0fdfa",
    banner_img: "images/wordsworth.png",
    about: "Wordsworth is KLE Technological University's premier literary society for debaters, writers, poets, quiz enthusiasts, and public speakers.",
    offline_test_info: "Written creative/analytical round followed by a short extempore or parliamentary debate round.",
    registration_link: "",
    advantages: ["Host and compete in Parliamentary Debates, MUNs, and campus Quiz Leagues", "Publish original stories, essays, and poetry in university magazines", "Weekly word games, book discussions, and slam poetry circles"],
    benefits: ["Directly boosts placement interview articulation and group discussion skills", "Mentorship from senior debaters and national quiz finalists", "Official literary organization certificates for your resume"]
  },
  "Kannada Balaga": {
    category: "Cultural Clubs",
    tagline: "Celebrating the rich heritage of Kannada language, literature, and folk arts.",
    theme_primary: "#dc2626", theme_secondary: "#eab308", theme_bg: "#fefce8",
    banner_img: "images/kannada-balaga.png",
    about: "Kannada Balaga leads the grand Kannada Rajyotsava celebrations, folk arts showcases, Janapada songs, and literary events that unite the entire university.",
    offline_test_info: "Offline interaction and cultural/literary screening conducted by the Kannada Balaga core committee.",
    registration_link: "",
    advantages: ["Organize the biggest campus festival—Kannada Rajyotsava", "Promote folk dance (Dollu Kunitha, Veeragase), literature, and theatre", "Engage with renowned Kannada writers, artists, and cultural icons"],
    benefits: ["Develop large-scale event management and leadership experience", "Cultural service recognition from the university administration", "Connect deeply with regional roots and vibrant student traditions"]
  },
  "IEEE": {
    category: "Technical Clubs",
    tagline: "Advancing technology for humanity through global research and innovation.",
    theme_primary: "#0284c7", theme_secondary: "#38bdf8", theme_bg: "#f0f9ff",
    banner_img: "images/ieee.png",
    about: "The IEEE Student Branch at KLE Tech connects students to the world's largest technical professional organization through research papers, flagship symposiums, and hardware/software sprints.",
    offline_test_info: "Offline technical aptitude test covering fundamentals of electronics, logic, and coding followed by a technical interview.",
    registration_link: "",
    advantages: ["Publish research papers in IEEE Xplore and attend international conferences", "Access specialized SIGs in Robotics, ComSoc, WIE, and Computer Society", "Hands-on technical workshops, circuit designathons, and industry talks"],
    benefits: ["Globally recognized IEEE student leadership credentials on your CV", "Direct mentorship from faculty researchers and industry professionals", "Networking with IEEE student branches across India and abroad"]
  },
  "IUCEE": {
    category: "Technical Clubs",
    tagline: "Global engineering education, interdisciplinary projects, and sustainability.",
    theme_primary: "#059669", theme_secondary: "#34d399", theme_bg: "#ecfdf5",
    banner_img: "images/iucee.png",
    about: "The IUCEE Student Chapter empowers engineering students to solve real-world community and industry problems through global collaboration and design thinking.",
    offline_test_info: "Problem-solving case study written test and personal interview with the chapter leads.",
    registration_link: "",
    advantages: ["Participate in Annual Student Forums (IASF) and global webinars", "Build interdisciplinary engineering prototypes for social impact", "Collaborate with international universities and faculty mentors"],
    benefits: ["Strong project portfolio for higher studies and core placements", "Leadership roles in organizing national-level engineering conclaves", "Certificate of recognition from the IUCEE consortium"]
  },
  "Code Club": {
    category: "Technical Clubs",
    tagline: "Master competitive programming, full-stack development, and 24-hour hackathons.",
    theme_primary: "#4f46e5", theme_secondary: "#818cf8", theme_bg: "#eef2ff",
    banner_img: "KLE-Tech-University-Logo.jpg",
    about: "Code Club is the hub for algorithmic problem solvers, open-source contributors, and hackathon builders at KLE Tech.",
    offline_test_info: "Offline DSA & logic coding test (pen-and-paper + lab round) followed by a technical interview.",
    registration_link: "",
    advantages: ["Weekly Data Structures, Algorithms, and CP contests (ICPC prep)", "Build real production web/mobile apps and lead overnight Hack Nights", "Peer code reviews, Git/GitHub bootcamps, and system design sessions"],
    benefits: ["Crack top tier product-based software engineering placements", "Form elite teams for Smart India Hackathon (SIH) and global bounties", "Mentorship from alumni working at top tech companies"]
  },
  "Data Science": {
    category: "Technical & Academic",
    tagline: "Turn raw data into intelligent AI, Machine Learning, and Deep Learning models.",
    theme_primary: "#0891b2", theme_secondary: "#22d3ee", theme_bg: "#ecfeff",
    banner_img: "images/data-science.png",
    about: "The Data Science Club explores applied Artificial Intelligence, LLMs, computer vision, statistical modeling, and Kaggle competitions.",
    offline_test_info: "Offline test on Python, linear algebra, probability, and ML basics followed by a project discussion.",
    registration_link: "",
    advantages: ["Hands-on bootcamps in Python, Pandas, PyTorch, and Generative AI", "Compete in internal and global Kaggle datathons as a team", "Work on real research datasets with department faculty"],
    benefits: ["Build a standout GitHub portfolio of end-to-end AI/ML projects", "Preparation for Data Scientist and AI Engineer placement roles", "Co-author research papers in AI conferences"]
  },
  "Aerokle": {
    category: "Technical Clubs",
    tagline: "Design, build, and fly RC aircraft, autonomous UAVs, and multi-rotor drones.",
    theme_primary: "#1d4ed8", theme_secondary: "#60a5fa", theme_bg: "#eff6ff",
    banner_img: "images/aerokle.png",
    about: "Aerokle is KLE Tech's aeromodelling and autonomous drone design team, competing in SAE Aero Design, Boeing National Aeromodelling, and UAV challenges.",
    offline_test_info: "Offline written test on basic aerodynamics, mechanics, and embedded electronics followed by a workshop interview.",
    registration_link: "",
    advantages: ["Design airframes in CAD/CFD and fabricate carbon-fiber/balsa aircraft", "Program flight controllers, Pixhawk autopilots, and telemetry systems", "Live flight testing sessions on the university sports ground"],
    benefits: ["Represent KLE Tech at IIT techfests and SAE national competitions", "Deep hands-on mastery of robotics, avionics, and mechanical design", "Access to the dedicated Aerokle fabrication lab and tools"]
  },
  "Rocketry": {
    category: "Technical Clubs",
    tagline: "Pushing altitude limits with high-powered model rocketry, avionics, and payloads.",
    theme_primary: "#c2410c", theme_secondary: "#fb923c", theme_bg: "#fff7ed",
    banner_img: "images/rocketry.png",
    about: "The Rocketry Club engineers solid-propellant model rockets, dual-deployment recovery systems, custom flight computers, and atmospheric payloads.",
    offline_test_info: "Offline test covering physics, propulsion/CAD fundamentals, or embedded sensors followed by a personal interview.",
    registration_link: "",
    advantages: ["Simulate rocket trajectories using OpenRocket, ANSYS, and custom code", "Build onboard flight computers, altimeters, and GPS recovery modules", "Participate in national rocket launch competitions (IN-SPACe / ISRO events)"],
    benefits: ["Rare aerospace and defense hardware engineering experience", "Strong profile for core engineering, ISRO, DRDO, and MS applications", "Hands-on composite manufacturing and telemetry testing"]
  },
  "Motorsports": {
    category: "Technical Clubs",
    tagline: "Engineer, fabricate, and race custom ATVs, Formula, and Electric Vehicles.",
    theme_primary: "#dc2626", theme_secondary: "#f87171", theme_bg: "#fef2f2",
    banner_img: "images/motorsports.png",
    about: "KLE Tech Motorsports designs and fabricates off-road BAJA buggies, Formula-style race cars, and electric vehicles from scratch for national endurance races.",
    offline_test_info: "Offline technical test on automobile subsystems, CAD/strength of materials, or EV electronics plus workshop interview.",
    registration_link: "",
    advantages: ["Full vehicle design using SolidWorks/Onshape, ANSYS, and Adams Car", "Hands-on welding, CNC machining, suspension tuning, and EV battery BMS", "Pit-crew experience at SAE BAJA and Formula Bharat tracks"],
    benefits: ["Top recruitment preference from core automotive and EV companies", "Learn real-world project budgeting, sponsorship, and team management", "24/7 access to the Motorsports garage and fabrication bay"]
  },
  "Higher Studies": {
    category: "Academic Clubs",
    tagline: "Your launchpad for GATE, GRE, CAT, GMAT, and top global master's programs.",
    theme_primary: "#1e40af", theme_secondary: "#3b82f6", theme_bg: "#eff6ff",
    banner_img: "images/higher-studies.png",
    about: "The Higher Studies Club guides students aiming for IITs, IIMs, and Ivy League / global universities through structured study circles, mock tests, and alumni mentorship.",
    offline_test_info: "Offline aptitude & quantitative reasoning diagnostic test followed by a goal-alignment interaction.",
    registration_link: "",
    advantages: ["Weekly mock tests and problem-solving circles for GATE, GRE, and CAT", "SOP, LOR, and research profile reviews by alumni at top US/European universities", "Curated library of preparation materials and scholarship guides"],
    benefits: ["Stay consistent with a peer group targeting 99+ percentiles", "Direct 1-on-1 Q&A sessions with recent admits to IISc, IITs, IIMs, and CMU/ETH", "Early guidance on research internships and paper publications"]
  },
  "Make in BVB": {
    category: "Academic Clubs",
    tagline: "Turn bold ideas into hardware prototypes, startups, and market-ready products.",
    theme_primary: "#ca8a04", theme_secondary: "#facc15", theme_bg: "#fefce8",
    banner_img: "images/make-in-bvb.png",
    about: "Make in BVB fosters product design, rapid 3D prototyping, IoT innovation, and student entrepreneurship inside the campus maker ecosystem.",
    offline_test_info: "Offline product-ideation challenge and technical/maker skill interaction.",
    registration_link: "",
    advantages: ["Access to 3D printers, laser cutters, Arduino/ESP32 kits, and maker tools", "Mentorship on patent filing, startup pitching, and product validation", "Showcase prototypes at annual campus innovation expos"],
    benefits: ["Seed funding and incubation pathways for promising student startups", "Interdisciplinary teamwork across CS, Electronics, and Mechanical branches", "Build tangible hardware-software products from day one"]
  },
  "Kletech Media": {
    category: "Media & Communication",
    tagline: "The official lens and voice of KLE Tech—photography, filmmaking, and design.",
    theme_primary: "#d97706", theme_secondary: "#fbbf24", theme_bg: "#fffbeb",
    banner_img: "images/kletech-media.png",
    about: "Kletech Media is the official campus media house responsible for event photography, aftermovies, graphic design, drone cinematography, and social media storytelling.",
    offline_test_info: "Offline portfolio review and live campus photography/editing/design task.",
    registration_link: "",
    advantages: ["All-access media passes to every concert, fest, VIP visit, and sports tournament", "Workshops on DSLR photography, Premiere Pro/DaVinci Resolve, and Figma/Photoshop", "Produce official campus aftermovies watched by thousands of students"],
    benefits: ["Build a professional creative portfolio while in college", "Collaborate with every club and department across the university", "Official Media House press badge and recognition certificate"]
  },
  "Defence": {
    category: "Defence & National Service",
    tagline: "Discipline, physical endurance, SSB preparation, and service to the nation.",
    theme_primary: "#15803d", theme_secondary: "#22c55e", theme_bg: "#f0fdf4",
    banner_img: "images/defence.png",
    about: "The Defence Club prepares aspirants for careers in the Indian Armed Forces (CDS, AFCAT, NDA, SSB interviews) through physical training, group tasks, and officer interactions.",
    offline_test_info: "Offline physical fitness assessment and written general awareness / psychological screening test.",
    registration_link: "",
    advantages: ["Structured SSB interview prep: GTO tasks, PPDT, psychology tests, and mock interviews", "Morning physical fitness, obstacle training, and leadership drills", "Guest lectures by serving and retired Armed Forces officers"],
    benefits: ["Develop officer-like qualities (OLQs), discipline, and mental toughness", "Focused preparation for CDS, AFCAT, and technical defence entries (UES/TGC)", "Lead Republic Day and Independence Day ceremonial events on campus"]
  }
};

const ALL_CLUBS = Object.keys(DEFAULT_CLUB_PAGES);

// GENERATES A SEPARATE .JSON FILE FOR EACH OF THE 16 CLUBS (e.g. databases/Code_Club.json)
function getClubDbPath(clubName) {
  const safeName = clubName.replace(/[^a-zA-Z0-9]/g, "_");
  return path.join(DB_FOLDER, `${safeName}.json`);
}

// =========================================================
// 3. IN-MEMORY RAM CACHE + NON-BLOCKING ATOMIC WRITE QUEUE
// =========================================================
function loadJsonSafeSync(filePath, fallbackValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallbackValue, null, 2));
      return JSON.parse(JSON.stringify(fallbackValue));
    }
    const content = fs.readFileSync(filePath, "utf-8").trim();
    if (!content) return JSON.parse(JSON.stringify(fallbackValue));
    return JSON.parse(content);
  } catch (err) {
    console.error(`⚠️ Recovered corrupted file ${path.basename(filePath)} using fallback.`);
    return JSON.parse(JSON.stringify(fallbackValue));
  }
}

const MEMORY_DB = {
  admins: loadJsonSafeSync(ADMINS_FILE, []),
  loggedStudents: loadJsonSafeSync(LOGGED_STUDENTS_FILE, []),
  events: loadJsonSafeSync(EVENTS_FILE, DEFAULT_EVENTS),
  clubPages: loadJsonSafeSync(CLUB_PAGES_FILE, DEFAULT_CLUB_PAGES),
  clubs: {}
};

ALL_CLUBS.forEach(clubName => {
  if (!MEMORY_DB.clubPages[clubName]) {
    MEMORY_DB.clubPages[clubName] = JSON.parse(JSON.stringify(DEFAULT_CLUB_PAGES[clubName]));
  } else if (typeof MEMORY_DB.clubPages[clubName].registration_link !== "string") {
    MEMORY_DB.clubPages[clubName].registration_link = "";
  }
  const clubFile = getClubDbPath(clubName);
  const rawRecords = loadJsonSafeSync(clubFile, []);
  MEMORY_DB.clubs[clubName] = Array.isArray(rawRecords)
    ? rawRecords.map(r => ({ ...r, status: r.status || "accepted" }))
    : [];
});

const writeLocks = new Map();
function saveToDiskAsync(filePath, dataSnapshot) {
  const serialized = JSON.stringify(dataSnapshot, null, 2);
  const prevPromise = writeLocks.get(filePath) || Promise.resolve();

  const nextPromise = prevPromise
    .then(async () => {
      const tempFile = filePath + ".tmp";
      await fsp.writeFile(tempFile, serialized, "utf-8");
      await fsp.rename(tempFile, filePath);
    })
    .catch(err => {
      console.error(`⚠️ Async disk write error on ${path.basename(filePath)}:`, err.message);
    });

  writeLocks.set(filePath, nextPromise);
}

function readClubRecords(clubName) {
  return MEMORY_DB.clubs[clubName] || [];
}
function saveClubRecords(clubName, records) {
  MEMORY_DB.clubs[clubName] = records;
  saveToDiskAsync(getClubDbPath(clubName), records);
}
function readAdmins() {
  return MEMORY_DB.admins;
}
function saveAdmins(admins) {
  MEMORY_DB.admins = admins;
  saveToDiskAsync(ADMINS_FILE, admins);
}
function readLoggedInStudents() {
  return MEMORY_DB.loggedStudents;
}
function recordStudentLogin(student) {
  const list = MEMORY_DB.loggedStudents;
  const idx = list.findIndex(s => s.email === student.email);
  const entry = {
    student_name: student.student_name,
    usn: student.usn,
    email: student.email,
    last_login: new Date().toISOString()
  };
  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.unshift(entry);
  }
  saveToDiskAsync(LOGGED_STUDENTS_FILE, list);
}
function readClubPages() {
  return MEMORY_DB.clubPages;
}
function saveClubPages(pages) {
  MEMORY_DB.clubPages = pages;
  saveToDiskAsync(CLUB_PAGES_FILE, pages);
}

function isCollegeEmail(email) {
  return typeof email === "string" && email.trim().toLowerCase().endsWith("@kletech.ac.in");
}

function canUserEditClubPage(clubName, email, usn) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanUsn = (usn || "").trim().toUpperCase();
  if (!cleanEmail && !cleanUsn) return false;

  return readAdmins().some(
    a =>
      a.club_name === clubName &&
      ((cleanEmail && a.email.toLowerCase() === cleanEmail) ||
        (cleanUsn && a.usn.toUpperCase() === cleanUsn))
  );
}

function readActiveEvents() {
  const allEvents = MEMORY_DB.events || [];
  const now = new Date();

  const activeEvents = allEvents.filter(ev => {
    const timePart = ev.event_time && ev.event_time.trim() ? ev.event_time.trim() : "23:59";
    const eventEnd = new Date(`${ev.event_date}T${timePart}:00`);
    const expiryTime = new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000);
    return isNaN(expiryTime.getTime()) || expiryTime > now;
  });

  if (activeEvents.length !== allEvents.length) {
    MEMORY_DB.events = activeEvents;
    saveToDiskAsync(EVENTS_FILE, activeEvents);
  }

  activeEvents.sort((a, b) => {
    const dA = new Date(`${a.event_date}T${a.event_time || "00:00"}:00`);
    const dB = new Date(`${b.event_date}T${b.event_time || "00:00"}:00`);
    return dA - dB;
  });

  return activeEvents;
}

function saveEvents(events) {
  MEMORY_DB.events = events;
  saveToDiskAsync(EVENTS_FILE, events);
}

function getAuthorizedClubsForClubHead(email, usn) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanUsn = (usn || "").trim().toUpperCase();
  if (!cleanEmail && !cleanUsn) return [];

  const authorizedClubs = new Set();
  readAdmins().forEach(a => {
    if ((cleanEmail && a.email.toLowerCase() === cleanEmail) || (cleanUsn && a.usn.toUpperCase() === cleanUsn)) {
      authorizedClubs.add(a.club_name);
    }
  });

  return Array.from(authorizedClubs);
}

function getSafeAdminList() {
  return readAdmins().map(a => {
    const records = readClubRecords(a.club_name);
    const acceptedCount = records.filter(r => r.status === "accepted").length;
    const pendingCount = records.filter(r => r.status === "pending").length;
    return {
      admin_name: a.admin_name,
      usn: a.usn,
      email: a.email,
      club_name: a.club_name,
      created_at: a.created_at,
      member_count: acceptedCount,
      pending_count: pendingCount
    };
  });
}

// VERIFIES DEVELOPER 01fe25bcs252@kletech.ac.in (VIA GOOGLE TOKEN OR HEAD LOGIN)
async function isVerifiedDeveloper(body) {
  const { access_token, identifier, password } = body || {};

  if (access_token) {
    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const payload = await googleRes.json();
    if (googleRes.ok && payload.email && payload.email.trim().toLowerCase() === DEVELOPER_EMAIL) {
      return true;
    }
  }

  if (identifier && password) {
    const cleanId = identifier.trim().toLowerCase();
    const admins = readAdmins();
    const head = admins.find(
      a => (a.email.toLowerCase() === cleanId || a.usn.toLowerCase() === cleanId) && a.password === password
    );
    if (head && head.email.toLowerCase() === DEVELOPER_EMAIL) {
      return true;
    }
  }

  return false;
}

// =========================================================
// DEDICATED CLUB WEBPAGE APIs
// =========================================================
app.get("/api/club-page", (req, res) => {
  const clubName = req.query.club || "";
  const email = (req.query.email || "").trim().toLowerCase();
  const usn = (req.query.usn || "").trim().toUpperCase();

  const pages = readClubPages();
  const pageData = pages[clubName];
  if (!pageData) {
    return res.status(404).json({ error: "Club page not found." });
  }

  const records = readClubRecords(clubName);
  const acceptedCount = records.filter(r => r.status === "accepted").length;
  const studentRecord = email
    ? records.find(r => r.email.toLowerCase() === email || (usn && r.usn.toUpperCase() === usn))
    : null;

  const canEdit = canUserEditClubPage(clubName, email, usn);
  const clubEvents = readActiveEvents().filter(e => e.club_name === clubName);

  res.json({
    club_name: clubName,
    page: pageData,
    accepted_members_count: acceptedCount,
    student_status: studentRecord ? studentRecord.status : null,
    can_edit: canEdit,
    events: clubEvents
  });
});

app.post("/api/club-page/update", (req, res) => {
  const {
    club_name,
    email,
    usn,
    tagline,
    about,
    offline_test_info,
    registration_link,
    theme_primary,
    theme_secondary,
    theme_bg,
    advantages,
    benefits
  } = req.body;

  if (!club_name || !canUserEditClubPage(club_name, email, usn)) {
    return res.status(403).json({
      error: `Access Denied! Only the registered Club Head of ${club_name} can edit this club webpage.`
    });
  }

  const pages = readClubPages();
  if (!pages[club_name]) {
    return res.status(404).json({ error: "Club not found." });
  }

  if (typeof tagline === "string") pages[club_name].tagline = tagline.trim();
  if (typeof about === "string") pages[club_name].about = about.trim();
  if (typeof offline_test_info === "string") pages[club_name].offline_test_info = offline_test_info.trim();
  if (typeof registration_link === "string") pages[club_name].registration_link = registration_link.trim();
  if (typeof theme_primary === "string" && theme_primary) pages[club_name].theme_primary = theme_primary;
  if (typeof theme_secondary === "string" && theme_secondary) pages[club_name].theme_secondary = theme_secondary;
  if (typeof theme_bg === "string" && theme_bg) pages[club_name].theme_bg = theme_bg;
  if (Array.isArray(advantages)) {
    pages[club_name].advantages = advantages.map(x => String(x).trim()).filter(Boolean);
  }
  if (Array.isArray(benefits)) {
    pages[club_name].benefits = benefits.map(x => String(x).trim()).filter(Boolean);
  }

  saveClubPages(pages);
  res.json({
    message: "Club webpage updated successfully!",
    page: pages[club_name]
  });
});

// =========================================================
// EVENTS API
// =========================================================
app.get("/api/events", (req, res) => {
  const email = req.query.email || "";
  const usn = req.query.usn || "";
  const events = readActiveEvents();
  const headClubs = getAuthorizedClubsForClubHead(email, usn);
  res.json({ events, member_clubs: headClubs });
});

app.post("/api/events/save", (req, res) => {
  const { id, title, club_name, description, venue, event_date, event_time, email, usn } = req.body;

  if (!title || !club_name || !description || !venue || !event_date || !event_time) {
    return res.status(400).json({ error: "Please fill in Event Name, Club, Date, Time, Venue, and Description." });
  }

  const allowedClubs = getAuthorizedClubsForClubHead(email, usn);
  if (!allowedClubs.includes(club_name)) {
    return res.status(403).json({
      error: `Access Denied! Only the Club Head of ${club_name} can add or edit events in the dashboard.`
    });
  }

  const checkEnd = new Date(`${event_date}T${event_time}:00`);
  if (!isNaN(checkEnd.getTime()) && new Date(checkEnd.getTime() + 2 * 60 * 60 * 1000) <= new Date()) {
    return res.status(400).json({ error: "Event date and time must be in the future!" });
  }

  const events = readActiveEvents();

  if (id) {
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Event not found or already completed." });
    }
    if (!allowedClubs.includes(events[idx].club_name)) {
      return res.status(403).json({ error: "You can only edit events belonging to your club!" });
    }
    events[idx] = {
      ...events[idx],
      title: title.trim(),
      club_name,
      description: description.trim(),
      venue: venue.trim(),
      event_date,
      event_time
    };
  } else {
    events.push({
      id: "ev_" + Date.now(),
      title: title.trim(),
      club_name,
      description: description.trim(),
      venue: venue.trim(),
      event_date,
      event_time
    });
  }

  saveEvents(events);
  res.json({
    message: id ? "Event updated successfully!" : "New upcoming event added!",
    events: readActiveEvents()
  });
});

app.post("/api/events/delete", (req, res) => {
  const { id, email, usn } = req.body;
  const events = readActiveEvents();
  const target = events.find(e => e.id === id);

  if (!target) {
    return res.status(404).json({ error: "Event already removed." });
  }

  const allowedClubs = getAuthorizedClubsForClubHead(email, usn);
  if (!allowedClubs.includes(target.club_name)) {
    return res.status(403).json({
      error: `Only the Club Head of ${target.club_name} can delete this event from the Club Head Dashboard.`
    });
  }

  const updated = events.filter(e => e.id !== id);
  saveEvents(updated);
  res.json({ message: "Event deleted!", events: readActiveEvents() });
});

// =========================================================
// ADMIN & DEVELOPER APIs (01fe25bcs252@kletech.ac.in)
// =========================================================
app.get("/api/admin-status", (req, res) => {
  const admins = readAdmins();
  res.json({
    registered_count: admins.length,
    max_admins: MAX_ADMINS,
    remaining_slots: Math.max(0, MAX_ADMINS - admins.length),
    taken_clubs: admins.map(a => a.club_name)
  });
});

app.post("/api/admin-register", (req, res) => {
  const { admin_name, usn, email, club_name, password } = req.body;

  if (!admin_name || !usn || !email || !club_name || !password) {
    return res.status(400).json({ error: "All fields (Name, USN, College Email, Club, and Password) are required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsn = usn.trim().toUpperCase();

  if (!isCollegeEmail(cleanEmail)) {
    return res.status(403).json({ error: "Access Denied! Club Head email must end with @kletech.ac.in" });
  }

  if (password.trim().length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters long." });
  }

  const admins = readAdmins();

  if (admins.length >= MAX_ADMINS) {
    return res.status(403).json({
      error: `Registration Closed! All ${MAX_ADMINS} Club Head slots are already full.`
    });
  }

  if (admins.some(a => a.club_name === club_name)) {
    return res.status(400).json({ error: `A Club Head is already registered for ${club_name}!` });
  }

  if (admins.some(a => a.email === cleanEmail || a.usn === cleanUsn)) {
    return res.status(400).json({ error: "This USN or @kletech.ac.in email is already registered as a Club Head!" });
  }

  admins.push({
    admin_name: admin_name.trim(),
    usn: cleanUsn,
    email: cleanEmail,
    club_name: club_name,
    password: password.trim(),
    created_at: new Date().toISOString()
  });
  saveAdmins(admins);

  res.json({
    message: `Club Head account created for ${club_name}! (${admins.length}/${MAX_ADMINS} slots used). You can now log in.`
  });
});

app.post("/api/head-login", (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: "Please enter your College Email / USN and Password." });
  }

  const cleanId = identifier.trim().toLowerCase();
  const admins = readAdmins();

  const head = admins.find(
    a => (a.email.toLowerCase() === cleanId || a.usn.toLowerCase() === cleanId) && a.password === password.trim()
  );

  if (!head) {
    return res.status(401).json({ error: "Invalid Email/USN or Password!" });
  }

  const records = readClubRecords(head.club_name);
  const pendingApplicants = records.filter(r => r.status === "pending");
  const acceptedMembers = records.filter(r => r.status === "accepted");
  const loggedStudents = readLoggedInStudents();
  const isDev = head.email.toLowerCase() === DEVELOPER_EMAIL;

  res.json({
    club_name: head.club_name,
    admin_name: head.admin_name,
    usn: head.usn,
    email: head.email,
    is_developer: isDev,
    total_club_members: acceptedMembers.length,
    total_pending_applicants: pendingApplicants.length,
    total_portal_logins: loggedStudents.length,
    applicants: pendingApplicants,
    members: acceptedMembers,
    all_admins: isDev ? getSafeAdminList() : undefined,
    max_admins: MAX_ADMINS
  });
});

app.post("/api/handle-application", (req, res) => {
  const { identifier, password, applicant_usn, decision } = req.body;
  const cleanId = (identifier || "").trim().toLowerCase();
  const admins = readAdmins();

  const head = admins.find(
    a => (a.email.toLowerCase() === cleanId || a.usn.toLowerCase() === cleanId) && a.password === password
  );

  if (!head) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let records = readClubRecords(head.club_name);
  const targetIdx = records.findIndex(r => r.usn === applicant_usn);

  if (targetIdx === -1) {
    return res.status(404).json({ error: "Applicant not found." });
  }

  let msg = "";
  if (decision === "accept") {
    records[targetIdx].status = "accepted";
    records[targetIdx].joined_at = new Date().toISOString();
    msg = `Accepted ${records[targetIdx].student_name} (${applicant_usn}) into ${head.club_name}!`;
  } else if (decision === "decline") {
    const removedName = records[targetIdx].student_name;
    records = records.filter(r => r.usn !== applicant_usn);
    msg = `Declined and removed application for ${removedName} (${applicant_usn}).`;
  } else {
    return res.status(400).json({ error: "Invalid decision." });
  }

  saveClubRecords(head.club_name, records);

  const pendingApplicants = records.filter(r => r.status === "pending");
  const acceptedMembers = records.filter(r => r.status === "accepted");

  res.json({
    message: msg,
    total_club_members: acceptedMembers.length,
    total_pending_applicants: pendingApplicants.length,
    applicants: pendingApplicants,
    members: acceptedMembers
  });
});

app.post("/api/remove-member", (req, res) => {
  const { identifier, password, member_usn } = req.body;
  const cleanId = (identifier || "").trim().toLowerCase();
  const admins = readAdmins();

  const head = admins.find(
    a => (a.email.toLowerCase() === cleanId || a.usn.toLowerCase() === cleanId) && a.password === password
  );

  if (!head) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const records = readClubRecords(head.club_name);
  const updated = records.filter(m => m.usn !== member_usn);
  saveClubRecords(head.club_name, updated);

  const pendingApplicants = updated.filter(r => r.status === "pending");
  const acceptedMembers = updated.filter(r => r.status === "accepted");

  res.json({
    message: "Removed member " + member_usn,
    total_club_members: acceptedMembers.length,
    total_pending_applicants: pendingApplicants.length,
    applicants: pendingApplicants,
    members: acceptedMembers
  });
});

// DEVELOPER CONTROL PANEL ENDPOINTS (ONLY FOR 01fe25bcs252@kletech.ac.in)
app.post("/api/dev-google-login", async (req, res) => {
  try {
    const allowed = await isVerifiedDeveloper(req.body);
    if (!allowed) {
      return res.status(403).json({
        error: `Access Denied! Only ${DEVELOPER_EMAIL} can view and edit Club Heads.`
      });
    }

    const safeAdmins = getSafeAdminList();
    res.json({
      dev_email: DEVELOPER_EMAIL,
      registered_count: safeAdmins.length,
      max_admins: MAX_ADMINS,
      total_portal_logins: readLoggedInStudents().length,
      admins: safeAdmins
    });
  } catch (err) {
    res.status(500).json({ error: "Could not verify developer Google account." });
  }
});

app.post("/api/dev-update-admin", async (req, res) => {
  try {
    const allowed = await isVerifiedDeveloper(req.body);
    if (!allowed) {
      return res.status(403).json({
        error: `Unauthorized! Only ${DEVELOPER_EMAIL} can edit Club Head details.`
      });
    }

    const { original_email, new_name, new_usn, new_email, new_club } = req.body;
    if (!original_email || !new_name || !new_usn || !new_email || !new_club) {
      return res.status(400).json({ error: "Name, USN, College Email, and Club are required." });
    }

    const cleanNewEmail = new_email.trim().toLowerCase();
    const cleanNewUsn = new_usn.trim().toUpperCase();

    if (!isCollegeEmail(cleanNewEmail)) {
      return res.status(400).json({ error: "Updated email must end with @kletech.ac.in" });
    }

    const admins = readAdmins();
    const idx = admins.findIndex(a => a.email.toLowerCase() === original_email.trim().toLowerCase());
    if (idx === -1) {
      return res.status(404).json({ error: "Club Head not found." });
    }

    const conflict = admins.some((a, i) =>
      i !== idx && (
        a.club_name === new_club ||
        a.email.toLowerCase() === cleanNewEmail ||
        a.usn.toUpperCase() === cleanNewUsn
      )
    );
    if (conflict) {
      return res.status(400).json({ error: "Another Club Head is already assigned to that Club, Email, or USN!" });
    }

    admins[idx].admin_name = new_name.trim();
    admins[idx].usn = cleanNewUsn;
    admins[idx].email = cleanNewEmail;
    admins[idx].club_name = new_club;

    saveAdmins(admins);

    const safeAdmins = getSafeAdminList();
    res.json({
      message: "Club Head details updated successfully (password kept unchanged)!",
      registered_count: safeAdmins.length,
      max_admins: MAX_ADMINS,
      admins: safeAdmins
    });
  } catch (err) {
    res.status(500).json({ error: "Error updating Club Head details." });
  }
});

app.post("/api/dev-remove-admin", async (req, res) => {
  try {
    const allowed = await isVerifiedDeveloper(req.body);
    if (!allowed) {
      return res.status(403).json({
        error: `Unauthorized! Only ${DEVELOPER_EMAIL} can remove a Club Head.`
      });
    }

    const { target_email } = req.body;
    const admins = readAdmins();
    const updated = admins.filter(a => a.email.toLowerCase() !== (target_email || "").toLowerCase());
    saveAdmins(updated);

    const safeAdmins = getSafeAdminList();
    res.json({
      message: "Club Head removed! Slot is now open.",
      registered_count: safeAdmins.length,
      max_admins: MAX_ADMINS,
      admins: safeAdmins
    });
  } catch (err) {
    res.status(500).json({ error: "Server error while removing Club Head." });
  }
});

app.post("/api/google-login", async (req, res) => {
  try {
    const { access_token, credential, usn } = req.body;
    let payload = null;

    if (access_token) {
      const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      payload = await googleRes.json();
    } else if (credential) {
      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      payload = await googleRes.json();
    } else {
      return res.status(400).json({ error: "Missing Google login token." });
    }

    if (!payload || !payload.email) {
      return res.status(401).json({ error: "Invalid Google Sign-In token." });
    }

    const email = payload.email.trim().toLowerCase();

    if (!isCollegeEmail(email)) {
      return res.status(403).json({
        error: `Access Denied! You signed in with ${email}. Please use your @kletech.ac.in Google account.`
      });
    }

    const emailPrefix = email.split("@")[0].toUpperCase();
    const finalUsn = (usn && usn.trim() ? usn.trim() : emailPrefix).toUpperCase();

    const studentData = {
      student_name: payload.name || emailPrefix,
      usn: finalUsn,
      email: email,
      picture: payload.picture || ""
    };

    recordStudentLogin(studentData);

    res.json({
      message: "Google College Account Verified!",
      student: studentData
    });
  } catch (err) {
    res.status(500).json({ error: "Could not verify Google login." });
  }
});

// RECORDS STUDENT INTO THAT CLUB'S SEPARATE .JSON FILE WHEN THEY CLICK THE OFFLINE TEST LINK
const handleClubApply = (req, res) => {
  const { student_name, usn, email, club_name } = req.body;
  if (!student_name || !usn || !email || !club_name) {
    return res.status(400).json({ error: "Please sign in with your college Google account first." });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!isCollegeEmail(cleanEmail)) {
    return res.status(403).json({
      error: "Only @kletech.ac.in college email IDs are allowed to apply for clubs!"
    });
  }

  const cleanUsn = usn.trim().toUpperCase();
  const records = readClubRecords(club_name);

  const existing = records.find(m => m.usn === cleanUsn || m.email === cleanEmail);
  if (existing) {
    return res.json({
      status: existing.status,
      message: existing.status === "accepted"
        ? `You have already passed the test and joined ${club_name}!`
        : `Your application for ${club_name} is already recorded. Please attend the offline test and wait for the Club Head to accept your application.`
    });
  }

  records.unshift({
    student_name: student_name.trim(),
    usn: cleanUsn,
    email: cleanEmail,
    club_name: club_name,
    status: "pending",
    applied_at: new Date().toISOString()
  });

  saveClubRecords(club_name, records);
  res.json({
    status: "pending",
    message: `Application submitted for ${club_name}! Please attend the offline test. Once you pass, the Club Head will accept you into the club.`
  });
};

app.post("/api/apply", handleClubApply);
app.post("/api/join", handleClubApply);

app.get("/api/student-status", (req, res) => {
  const cleanEmail = (req.query.email || "").trim().toLowerCase();
  const cleanUsn = (req.query.usn || "").trim().toUpperCase();
  const statusMap = {};

  if (cleanEmail) {
    ALL_CLUBS.forEach(clubName => {
      const records = readClubRecords(clubName);
      const found = records.find(
        r => r.email.toLowerCase() === cleanEmail || (cleanUsn && r.usn.toUpperCase() === cleanUsn)
      );
      if (found) {
        statusMap[clubName] = found.status || "accepted";
      }
    });
  }

  res.json({ status_map: statusMap });
});

app.use((err, req, res, next) => {
  console.error("⚠️ Express error caught:", err.message);
  res.status(500).json({ error: "Something went wrong, please try again." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("\n====================================================");
  console.log(`🚀 5,000-User High-Speed Server Running on Port ${PORT}`);
  console.log(`⚡ RAM Cache Active for All ${ALL_CLUBS.length} Separate Club Databases`);
  console.log(`👑 Developer Access Locked To: ${DEVELOPER_EMAIL}`);
  console.log("====================================================\n");
});
