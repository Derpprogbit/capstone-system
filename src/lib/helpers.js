/**
 * FILE: src/lib/helpers.js
 * ROUTE: Shared library module (not a page or API route)
 * PURPOSE: Reusable role/trust helpers (isAdmin, isTrustedMentor, calculateNewTrust)
 *          and structured IT curriculum data (SUBJECTS_DATA, SUBJECT_NAMES) used
 *          across pages, components, and API routes for drill-down lessons and
 *          peer trust evaluation.
 * DATA FLOW: Pure functions take a profile object and return booleans or computed
 *            trust scores. SUBJECTS_DATA and SUBJECT_NAMES are static data exported
 *            for consumption by the Subjects page, Home feed filter, and other UI.
 * USED BY / CALLED BY: PostCard.js, Navbar.js, page.js (Home), subjects/page.js,
 *                      api/ratings/route.js, api/admin/route.js.
 * TROUBLESHOOT: If a subject module, YouTube link, or .pkt file link is missing
 *               or needs updating, check SUBJECTS_DATA below. If isTrustedMentor
 *               returns unexpected results, verify the profile has trust_score and
 *               ratings_count fields populated from public.profiles.
 */

/**
 * Returns true if the given profile has admin privileges.
 * [STEP 1 - FLOW: Called by admin/route.js to authorize post deletion and by
 *  PostCard.js to show the Delete button. Accepts a profile object; returns true
 *  only when profile.role === 'admin'.]
 */
export function isAdmin(profile) {
  return profile?.role === "admin";
}

/**
 * Returns true if the user qualifies as a Trusted Peer Mentor
 * (average trust_score >= 4.0 with at least 2 peer ratings).
 * [STEP 2 - FLOW: Called by Navbar.js to render the Trusted Peer Mentor badge and
 *  by page.js (Home) to filter the Top Trusted Peer Mentors sidebar. Accepts a
 *  profile object; returns true when trust_score >= 4.0 AND ratings_count >= 2.]
 */
export function isTrustedMentor(profile) {
  if (!profile) return false;
  return Number(profile.trust_score) >= 4.0 && Number(profile.ratings_count) >= 2;
}

/**
 * Calculates the updated average trust score and ratings count
 * when a new 1-5 star rating is submitted.
 * [STEP 3 - FLOW: Called by api/ratings/route.js (POST) after inserting a new
 *  rating. Takes currentScore, currentCount, and newStars; returns { trust_score,
 *  ratings_count } with the recalculated average rounded to 2 decimals.]
 */
export function calculateNewTrust(currentScore, currentCount, newStars) {
  const safeScore = Number(currentScore) || 0;
  const safeCount = Number(currentCount) || 0;
  const safeStars = Math.min(5, Math.max(1, Number(newStars) || 5));

  const nextCount = safeCount + 1;
  const nextScore = Number(
    ((safeScore * safeCount + safeStars) / nextCount).toFixed(2)
  );

  return {
    trust_score: nextScore,
    ratings_count: nextCount,
  };
}

/**
 * Curriculum subjects and drill-down modules for GNC BSIT students.
 * Static data source for the Subjects page accordion UI.
 */
export const SUBJECTS_DATA = [
  {
    id: "networking-1",
    name: "Networking 1 & Cisco Labs",
    code: "NET 101",
    description:
      "Core computer networking concepts, OSI reference model, IPv4/VLSM subnetting, and hands-on Cisco Packet Tracer topologies.",
    modules: [
      {
        id: "net-mod-1",
        title: "Module 1: The 7 Layers of the OSI Model",
        summary:
          "Understand encapsulation, Protocol Data Units (PDUs), and key protocols operating at each layer.",
        youtubeUrl: "https://www.youtube.com/watch?v=vv4y_uOneC0",
        pktDownloadUrl: "/labs/osi-encapsulation-lab.pkt",
        tableHeaders: ["Layer", "Name", "PDU", "Key Protocols / Devices", "Study Notes"],
        tableRows: [
          ["7", "Application", "Data", "HTTP, HTTPS, FTP, DNS, SMTP", "Interface between user applications and network services."],
          ["6", "Presentation", "Data", "TLS/SSL, JPEG, ASCII, UTF-8", "Handles data translation, encryption, and compression."],
          ["5", "Session", "Data", "NetBIOS, RPC, PPTP", "Establishes, manages, and terminates communication sessions."],
          ["4", "Transport", "Segment / Datagram", "TCP, UDP", "End-to-end delivery, port addressing, error recovery (TCP)."],
          ["3", "Network", "Packet", "IPv4, IPv6, ICMP, OSPF, Routers", "Logical addressing (IP) and best-path routing."],
          ["2", "Data Link", "Frame", "Ethernet (802.3), MAC, Switches", "Physical MAC addressing, framing, and error detection (FCS)."],
          ["1", "Physical", "Bit", "RJ45, Cat6, Fiber, Hubs, Repeaters", "Transmits raw bitstreams over physical media."],
        ],
      },
      {
        id: "net-mod-2",
        title: "Module 2: IPv4 Addressing & VLSM Subnetting",
        summary:
          "Master CIDR notation, subnet masks, broadcast addresses, and Variable Length Subnet Masking (VLSM) for efficient IP allocation.",
        youtubeUrl: "https://www.youtube.com/watch?v=5WFIuQ_3w1c",
        pktDownloadUrl: "/labs/vlsm-campus-topology.pkt",
        tableHeaders: ["CIDR", "Subnet Mask", "Total IPs", "Usable Hosts", "Typical Use Case"],
        tableRows: [
          ["/24", "255.255.255.0", "256", "254", "Standard departmental LAN"],
          ["/25", "255.255.255.128", "128", "126", "Medium computer laboratory"],
          ["/26", "255.255.255.192", "64", "62", "Small faculty or student office"],
          ["/27", "255.255.255.224", "32", "30", "Server VLAN or printer segment"],
          ["/30", "255.255.255.252", "4", "2", "Point-to-point router serial link"],
        ],
      },
    ],
  },
  {
    id: "web-ui-fullstack",
    name: "Web UI & Full-Stack Dev",
    code: "WEB 201",
    description:
      "Modern responsive interfaces with Tailwind CSS, React/Next.js App Router, REST APIs, and PostgreSQL/Supabase integration.",
    modules: [
      {
        id: "web-mod-1",
        title: "Module 1: Next.js App Router & REST API Routes",
        summary:
          "Build server-side route handlers, dynamic pages, and clean client-server data flows.",
        youtubeUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
        pktDownloadUrl: null,
        tableHeaders: ["Pattern", "Location", "Purpose", "Notes"],
        tableRows: [
          ["Page Route", "src/app/page.js", "Renders UI for /", "Supports Server & Client Components"],
          ["API Route", "src/app/api/*/route.js", "Handles GET/POST/DELETE", "Returns JSON via NextResponse"],
          ["Layout", "src/app/layout.js", "Shared shell & Navbar", "Persists across page navigation"],
        ],
      },
    ],
  },
  {
    id: "software-engineering",
    name: "Software Engineering",
    code: "SE 301",
    description:
      "SDLC methodologies, Agile/Scrum sprints, requirements engineering, UML modeling, and capstone system architecture.",
    modules: [
      {
        id: "se-mod-1",
        title: "Module 1: Agile Sprint Planning & Capstone Roles",
        summary:
          "Organize BSIT capstone teams with clear ownership across frontend, backend, database, and QA.",
        youtubeUrl: "https://www.youtube.com/watch?v=Z9QbYZh1YXY",
        pktDownloadUrl: null,
        tableHeaders: ["Role", "Primary Responsibility", "Key Deliverable"],
        tableRows: [
          ["Frontend Dev", "UI components, responsiveness, state", "Accessible Next.js pages"],
          ["Backend Dev", "API routes, validation, auth", "RESTful endpoints & schema"],
          ["QA / Docs", "Test cases, user manual, bug triage", "Verification & defense deck"],
        ],
      },
    ],
  },
  {
    id: "game-development",
    name: "Game Development",
    code: "GAME 302",
    description:
      "2D/3D game loops, physics, sprite animation, state machines, and interactive mechanics using Unity or Godot.",
    modules: [
      {
        id: "game-mod-1",
        title: "Module 1: Game Loop & Finite State Machines",
        summary:
          "Structure player movement, collision detection, and enemy AI states cleanly.",
        youtubeUrl: "https://www.youtube.com/watch?v=XtQMytORBmM",
        pktDownloadUrl: null,
        tableHeaders: ["Phase", "Frequency", "Purpose"],
        tableRows: [
          ["Input", "Every frame", "Capture keyboard, mouse, or controller events"],
          ["FixedUpdate", "Fixed timestep", "Run deterministic physics & collisions"],
          ["Render", "Every frame", "Draw sprites, shaders, and UI overlays"],
        ],
      },
    ],
  },
];

export const SUBJECT_NAMES = SUBJECTS_DATA.map((s) => s.name);
