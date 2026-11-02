/* OnLive Expo – sample data. Every company here is fictional. */
window.EXPO = (function () {
  function shade(hex, p) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = p < 0 ? 0 : 255, t = Math.abs(p) / 100;
    r = Math.round((f - r) * t + r); g = Math.round((f - g) * t + g); b = Math.round((f - b) * t + b);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  const CATS = {
    "Technology": "#3B6BFF", "Manufacturing": "#E8782B", "Food & Agri": "#3E9B53",
    "Health": "#D9455F", "Design": "#12A5A5", "Education": "#D9A406"
  };

  /* Cheaper plans. Founding exhibitors get the first 90 days free. */
  const PLANS = {
    starter: { name: "Starter", price: 499, was: 1999, media: 5, products: 2, pts: ["Small booth with your sign", "2 products on stands", "Enquiry form", "Verified badge after GST check"] },
    growth:  { name: "Growth", price: 1499, was: 5999, media: 15, products: 3, hot: true, pts: ["Booth with LED screen", "3 products on stands", "Meeting booking", "Lead list + CSV export"] },
    premier: { name: "Premier", price: 3999, was: 14999, media: 40, products: 3, pts: ["Large booth with arch and banners", "3 products + video link", "Team inbox (3 seats)", "Monthly visitor report"] }
  };
  const SPOT = { price: 999, was: 2999 };

  /* product pictograms, 100x100, drawn flat so they stay light */
  const KINDS = {
    server: "Server rack", cloud: "Cloud service", laptop: "Software", crate: "Fresh produce", jar: "Packed goods",
    box: "Packaging", bag: "Retail bag", tablet: "Clinic device", cross: "Health kit", books: "Courses",
    cap: "Training", gear: "Machined part", sheet: "Metal sheet", panel: "Solar panel", battery: "Battery", roll: "Print"
  };
  function icon(kind, c) {
    const d = shade(c, -28), l = shade(c, 38), k = "#222B36", w = "#F6F2EA";
    const S = {
      server: `<rect x="16" y="14" width="68" height="22" rx="4" fill="${k}"/><rect x="16" y="40" width="68" height="22" rx="4" fill="${k}"/><rect x="16" y="66" width="68" height="22" rx="4" fill="${k}"/><g fill="${c}"><circle cx="27" cy="25" r="3.5"/><circle cx="27" cy="51" r="3.5"/><circle cx="27" cy="77" r="3.5"/></g><g fill="#6FE3A5"><circle cx="38" cy="25" r="3"/><circle cx="38" cy="51" r="3"/><circle cx="38" cy="77" r="3"/></g><rect x="56" y="22" width="20" height="6" rx="2" fill="#4A5563"/><rect x="56" y="48" width="20" height="6" rx="2" fill="#4A5563"/><rect x="56" y="74" width="20" height="6" rx="2" fill="#4A5563"/>`,
      cloud: `<path d="M28 74a16 16 0 0 1-2-31 22 22 0 0 1 42-4 18 18 0 0 1 6 35z" fill="${c}"/><path d="M30 46a22 22 0 0 1 38-7 18 18 0 0 1 6 8z" fill="${l}" opacity=".7"/><rect x="36" y="76" width="28" height="6" rx="3" fill="${d}"/>`,
      laptop: `<rect x="20" y="22" width="60" height="42" rx="4" fill="${k}"/><rect x="25" y="27" width="50" height="32" rx="2" fill="${l}"/><rect x="30" y="33" width="24" height="4" rx="2" fill="${c}"/><rect x="30" y="41" width="36" height="3" rx="1.5" fill="${d}"/><rect x="30" y="48" width="30" height="3" rx="1.5" fill="${d}"/><path d="M10 68h80l-6 10H16z" fill="#8C97A4"/>`,
      crate: `<path d="M14 50h72v36H14z" fill="#B98448"/><path d="M14 50h72v8H14z" fill="#D19A5C"/><path d="M14 66h72M14 76h72" stroke="#8C6130" stroke-width="2"/><circle cx="30" cy="42" r="12" fill="#D8412F"/><circle cx="52" cy="38" r="13" fill="#E45A3A"/><circle cx="72" cy="42" r="12" fill="#D8412F"/><path d="M52 26l-4 5h8z" fill="#3E9B53"/>`,
      jar: `<rect x="30" y="16" width="40" height="12" rx="3" fill="${c}"/><path d="M26 30h48v50a8 8 0 0 1-8 8H34a8 8 0 0 1-8-8z" fill="#E9F1F2" stroke="#9BB0B5" stroke-width="2"/><rect x="26" y="44" width="48" height="26" fill="${c}"/><rect x="34" y="52" width="32" height="4" rx="2" fill="${w}"/><rect x="34" y="60" width="20" height="3" rx="1.5" fill="${w}"/>`,
      box: `<path d="M50 14l36 16v42L50 88 14 72V30z" fill="#D8B27A"/><path d="M50 14l36 16-36 16-36-16z" fill="#E9CB98"/><path d="M50 46v42L14 72V30z" fill="#C79F66"/><path d="M42 20l36 16v8L42 28z" fill="${c}" opacity=".9"/><rect x="20" y="54" width="20" height="6" rx="2" fill="${c}" transform="skewY(20)"/>`,
      bag: `<path d="M34 34a16 16 0 0 1 32 0" fill="none" stroke="${d}" stroke-width="5"/><path d="M20 34h60l-4 52H24z" fill="${c}"/><path d="M20 34h60l-1 10H21z" fill="${l}" opacity=".6"/><circle cx="50" cy="62" r="9" fill="${w}"/><path d="M45 62h10M50 57v10" stroke="${c}" stroke-width="3"/>`,
      tablet: `<rect x="20" y="12" width="60" height="76" rx="8" fill="${k}"/><rect x="26" y="20" width="48" height="58" rx="3" fill="#EAF3F4"/><path d="M30 52h10l4-12 6 22 4-10h14" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="30" y="26" width="22" height="4" rx="2" fill="${l}"/><circle cx="50" cy="84" r="2.5" fill="#4A5563"/>`,
      cross: `<circle cx="50" cy="50" r="38" fill="${w}" stroke="${c}" stroke-width="4"/><path d="M42 24h16v18h18v16H58v18H42V58H24V42h18z" fill="${c}"/>`,
      books: `<rect x="16" y="64" width="68" height="18" rx="2" fill="${d}"/><rect x="22" y="44" width="58" height="18" rx="2" fill="${c}"/><rect x="14" y="24" width="62" height="18" rx="2" fill="${l}"/><g fill="${w}" opacity=".8"><rect x="22" y="70" width="30" height="3"/><rect x="28" y="50" width="30" height="3"/><rect x="20" y="30" width="30" height="3"/></g>`,
      cap: `<path d="M50 20L92 40 50 60 8 40z" fill="${k}"/><path d="M26 52v16c0 8 48 8 48 0V52L50 64z" fill="${c}"/><path d="M86 43v22" stroke="#E9B73A" stroke-width="3"/><circle cx="86" cy="68" r="4" fill="#E9B73A"/>`,
      gear: `<g fill="${c}">${[0, 45, 90, 135].map(a => `<rect x="43" y="10" width="14" height="80" rx="3" transform="rotate(${a} 50 50)"/>`).join("")}<circle cx="50" cy="50" r="28"/></g><circle cx="50" cy="50" r="28" fill="${c}"/><circle cx="50" cy="50" r="11" fill="#F6F2EA"/><circle cx="50" cy="50" r="28" fill="none" stroke="${l}" stroke-width="3" opacity=".6"/>`,
      sheet: `<path d="M12 62l50-30 28 12-50 30z" fill="#A9B4C0"/><path d="M12 62l28 12v8L12 70z" fill="#7C8794"/><path d="M40 74l50-30v8L40 82z" fill="#8B96A3"/><g fill="#6B7683"><circle cx="46" cy="58" r="3.5" transform="skewY(-8)"/><circle cx="58" cy="62" r="3.5" transform="skewY(-8)"/><circle cx="70" cy="66" r="3.5" transform="skewY(-8)"/></g>`,
      panel: `<path d="M18 30h66l-10 48H8z" fill="#1F3F8F"/><g stroke="#7FA6F0" stroke-width="1.8"><path d="M14 46h72M11 62h72M32 30l-12 48M50 30l-6 48M68 30l0 48M84 30l-8 48" opacity=".9"/></g><path d="M44 78l-4 12h20l-4-12" fill="#6B7683"/><circle cx="82" cy="18" r="9" fill="#F2B705"/>`,
      battery: `<rect x="28" y="22" width="44" height="66" rx="7" fill="${k}"/><rect x="40" y="12" width="20" height="10" rx="3" fill="#8C97A4"/><rect x="33" y="48" width="34" height="34" rx="4" fill="${c}"/><path d="M52 34l-10 18h8l-4 14 14-20h-9z" fill="#F6F2EA" transform="translate(0 -2)"/>`,
      roll: `<rect x="32" y="14" width="36" height="72" rx="4" fill="${c}"/><ellipse cx="50" cy="14" rx="18" ry="6" fill="${l}"/><ellipse cx="50" cy="86" rx="18" ry="6" fill="${d}"/><rect x="38" y="34" width="24" height="24" rx="3" fill="${w}"/><path d="M42 52l6-8 5 6 4-4 3 6z" fill="${d}"/>`
    };
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${S[kind] || S.box}</svg>`;
  }

  /* 12 plots: slot 0..11. null means a vacant plot. */
  const COMPANIES = [
    { id: "kisan", slot: 0, name: "Kisan Fresh", tag: "Farm-direct produce for retailers", cat: "Food & Agri", plan: "growth", spot: true, color: "#3E9B53", city: "Anand",
      desc: "Cold-chain supply of vegetables and spices from 400 farms across Gujarat.",
      products: [["crate", "Farm tomatoes", "from ₹28 / kg"], ["jar", "Spice jars", "from ₹90 / jar"], ["box", "Cold-chain pack", "quote on request"]] },
    { id: "sutra", slot: 1, name: "Sutra Design", tag: "Brand and packaging studio", cat: "Design", plan: "growth", spot: false, color: "#12A5A5", city: "Ahmedabad",
      desc: "A nine-person studio making packaging, logos and launch kits for new brands.",
      products: [["box", "Packaging kit", "from ₹12,000"], ["bag", "Retail bag set", "from ₹6,500"], ["roll", "Poster series", "from ₹4,000"]] },
    { id: "nimbus", slot: 2, name: "Nimbus Cloud", tag: "Hosting and DevOps for small teams", cat: "Technology", plan: "premier", spot: true, color: "#3B6BFF", city: "Pune",
      desc: "We run servers so you can ship. Managed Postgres, CI and monitoring from ₹999 a month.",
      products: [["server", "Managed Postgres", "from ₹999 / mo"], ["cloud", "Uptime monitor", "from ₹299 / mo"], ["laptop", "CI pipeline", "from ₹499 / mo"]] },
    { id: "vac1", slot: 3, vacant: true },
    { id: "arogya", slot: 4, name: "Arogya Labs", tag: "Software for small clinics", cat: "Health", plan: "premier", spot: false, color: "#D9455F", city: "Surat",
      desc: "Appointments, records and billing built for clinics with one to ten doctors.",
      products: [["tablet", "Clinic desk", "₹1,200 / mo"], ["cross", "Records vault", "₹800 / mo"], ["laptop", "Billing suite", "₹600 / mo"]] },
    { id: "vidya", slot: 5, name: "Vidya Learn", tag: "Skill courses for colleges", cat: "Education", plan: "starter", spot: false, color: "#D9A406", city: "Vadodara",
      desc: "Job-ready short courses with project work, sold to colleges in bulk.",
      products: [["books", "Coding course", "₹1,499 / student"], ["cap", "Campus bundle", "quote on request"]] },
    { id: "steel", slot: 6, name: "SteelCraft Works", tag: "Custom metal fabrication", cat: "Manufacturing", plan: "growth", spot: false, color: "#E8782B", city: "Rajkot",
      desc: "Laser cutting, bending and powder coating. Quotes within one working day.",
      products: [["sheet", "Laser-cut parts", "from ₹40 / part"], ["gear", "Custom brackets", "from ₹120"], ["box", "Powder coating", "₹18 / sq ft"]] },
    { id: "vac2", slot: 7, vacant: true },
    { id: "green", slot: 8, name: "GreenGrid", tag: "Rooftop solar for factories", cat: "Manufacturing", plan: "premier", spot: false, color: "#2E8B7A", city: "Gandhinagar",
      desc: "Rooftop solar designed, financed and installed for MSME factories.",
      products: [["panel", "Rooftop kit", "from ₹42 / watt"], ["battery", "Battery pack", "from ₹58,000"], ["server", "Monitoring box", "₹9,500"]] },
    { id: "pixel", slot: 9, name: "PixelPress", tag: "Print on demand for creators", cat: "Design", plan: "starter", spot: false, color: "#B04A8F", city: "Mumbai",
      desc: "Posters, merch and books printed and shipped without minimum orders.",
      products: [["roll", "Posters", "from ₹149"], ["bag", "Tote merch", "from ₹199"]] },
    { id: "vac3", slot: 10, vacant: true },
    { id: "tutor", slot: 11, name: "Tutor Tree", tag: "Verified tutors, free trial class", cat: "Education", plan: "starter", spot: false, color: "#6C8F1E", city: "Jaipur",
      desc: "Find a verified tutor for school subjects and book a free trial class.",
      products: [["cap", "Free trial class", "₹0"], ["books", "Maths pack", "₹399"]] }
  ];

  /* plot positions in world px (ground is 2000 x 1500, origin at centre) */
  const COLS = [-600, -260, 260, 600], ROWS = [-230, 130, 490];
  const SLOT = i => ({ x: COLS[i % 4], y: ROWS[Math.floor(i / 4)] });
  const ANCHOR = { x: 0, y: -560 };

  return { shade, CATS, PLANS, SPOT, KINDS, icon, COMPANIES, SLOT, ANCHOR };
})();
