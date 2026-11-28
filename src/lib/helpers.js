// FILE: src/lib/helpers.js
// PURPOSE: Shared trust score math, role checks, and BSIT subject curriculum data.

// Checks if the user is a faculty/system admin
export function isAdmin(profile) {
  return profile?.role === 'admin';
}

// Checks if a student qualifies as a Verified Trusted Peer Mentor
export function isTrustedMentor(profile) {
  if (!profile) return false;
  return profile.verified_mentor || (Number(profile.trust_score) >= 4.5 && profile.ratings_count >= 5);
}

// Recalculates average star rating after a new review
export function calculateNewTrust(currentScore, currentCount, newStars) {
  const nextCount = (currentCount || 0) + 1;
  const totalStars = (Number(currentScore || 5) * (currentCount || 0)) + Number(newStars);
  return {
    trust_score: Number((totalStars / nextCount).toFixed(2)),
    ratings_count: nextCount,
  };
}

// 7-Layer OSI Model reference used in the Subjects Hub
export const OSI_LAYERS = [
  { layer: 7, name: 'Application', pdu: 'Data', protocols: 'HTTP/HTTPS, DNS, DHCP, SSH', tip: 'Verify DNS resolution (nslookup) and service ports.' },
  { layer: 6, name: 'Presentation', pdu: 'Data', protocols: 'TLS/SSL, JPEG, UTF-8', tip: 'Check SSL/TLS certificates and file encoding.' },
  { layer: 5, name: 'Session', pdu: 'Data', protocols: 'RPC, NetBIOS, SQL Sessions', tip: 'Inspect auth token expiry and API session timeouts.' },
  { layer: 4, name: 'Transport', pdu: 'Segment / Datagram', protocols: 'TCP, UDP, QUIC', tip: 'Check firewall ACL rules and open listening ports.' },
  { layer: 3, name: 'Network', pdu: 'Packet', protocols: 'IPv4, IPv6, ICMP, OSPF', tip: 'Run ping, traceroute, and check default gateways.' },
  { layer: 2, name: 'Data Link', pdu: 'Frame', protocols: 'Ethernet 802.3, 802.1Q VLAN', tip: 'Check switch trunk ports, VLAN IDs, and MAC tables.' },
  { layer: 1, name: 'Physical', pdu: 'Bit (1s & 0s)', protocols: 'Cat5e/Cat6, Fiber, RJ45', tip: 'Check cable link lights and run "no shutdown" on interfaces.' },
];

// Core GNC BSIT Subject Tracks (Zero dummy posts—only curriculum reference links)
export const SUBJECTS_DATA = [
  {
    id: 'net1',
    code: 'IT-NET101',
    name: 'Networking 1',
    shortName: 'Networking 1',
    description: '7-Layer OSI & TCP/IP models, IPv4/VLSM subnetting, VLANs, and Cisco Packet Tracer labs.',
    modules: [
      { id: 'net-m1', title: 'Module 1: OSI & TCP/IP Reference Models', duration: '45m' },
      { id: 'net-m2', title: 'Module 2: IPv4 Addressing & VLSM Subnetting', duration: '60m' },
      { id: 'net-m3', title: 'Module 3: VLANs, 802.1Q Trunking & Inter-VLAN Routing', duration: '75m' },
    ],
    resources: [
      { title: 'Jeremy’s IT Lab: Free CCNA & Packet Tracer Course', type: 'YouTube', url: 'https://www.youtube.com/results?search_query=Jeremys+IT+Lab+Packet+Tracer' },
      { title: 'Cisco Packet Tracer Download & Lab Guide', type: 'Lab Tool', url: 'https://www.netacad.com/courses/packet-tracer' },
    ],
  },
  {
    id: 'web',
    code: 'IT-WEB202',
    name: 'Web UI & Full-Stack Dev',
    shortName: 'Web UI & Dev',
    description: 'Semantic HTML5, responsive Tailwind CSS layouts, React components, and REST APIs.',
    modules: [
      { id: 'web-m1', title: 'Module 1: Responsive Grid & Flexbox Layouts', duration: '45m' },
      { id: 'web-m2', title: 'Module 2: Next.js App Router & State Management', duration: '60m' },
      { id: 'web-m3', title: 'Module 3: PostgreSQL & Supabase Auth Integration', duration: '70m' },
    ],
    resources: [
      { title: 'Kevin Powell: Responsive CSS Grid & Flexbox', type: 'YouTube', url: 'https://www.youtube.com/results?search_query=Kevin+Powell+CSS+Grid+Flexbox' },
      { title: 'Next.js Official Documentation', type: 'Docs', url: 'https://nextjs.org/docs' },
    ],
  },
  {
    id: 'se',
    code: 'IT-SWE301',
    name: 'Software Engineering',
    shortName: 'Software Eng',
    description: 'Agile Scrum workflows, UML diagrams, 3NF database normalization, and QA testing.',
    modules: [
      { id: 'se-m1', title: 'Module 1: Capstone Chapter 1-3 & SRS Documentation', duration: '50m' },
      { id: 'se-m2', title: 'Module 2: ERD Normalization (1NF to 3NF) & UML', duration: '65m' },
      { id: 'se-m3', title: 'Module 3: Git Collaboration & Defense QA Matrix', duration: '55m' },
    ],
    resources: [
      { title: 'Git & GitHub Workflow for Student Teams', type: 'YouTube', url: 'https://www.youtube.com/results?search_query=Git+and+GitHub+team+workflow' },
    ],
  },
  {
    id: 'game',
    code: 'IT-GDEV302',
    name: 'Game Development',
    shortName: 'Game Dev',
    description: 'Game loops, delta-time physics, 2D/3D collision detection, and finite state machines.',
    modules: [
      { id: 'game-m1', title: 'Module 1: Game Loop & Frame-Rate Independent Physics', duration: '45m' },
      { id: 'game-m2', title: 'Module 2: Hitbox Collisions & Tilemaps', duration: '60m' },
      { id: 'game-m3', title: 'Module 3: Enemy AI State Machines & UI HUD', duration: '60m' },
    ],
    resources: [
      { title: 'Brackeys: Complete 2D Game Tutorial in Godot 4', type: 'YouTube', url: 'https://www.youtube.com/results?search_query=Brackeys+Godot+4+tutorial' },
    ],
  },
];