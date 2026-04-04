// src/services/radarService.js

const BACKEND_URL = "http://localhost:2000";

// ── Full country coords map (covers all countries Cloudflare returns) ─────────
const COUNTRY_COORDS = {
  US: { lat: 38,    lon: -97,   name: "United States"   },
  CN: { lat: 35,    lon: 105,   name: "China"           },
  RU: { lat: 61,    lon: 105,   name: "Russia"          },
  DE: { lat: 51,    lon: 10,    name: "Germany"         },
  GB: { lat: 55,    lon: -3,    name: "United Kingdom"  },
  IN: { lat: 20,    lon: 78,    name: "India"           },
  BR: { lat: -14,   lon: -51,   name: "Brazil"          },
  NL: { lat: 52,    lon: 5,     name: "Netherlands"     },
  FR: { lat: 46,    lon: 2,     name: "France"          },
  KP: { lat: 40,    lon: 127,   name: "North Korea"     },
  JP: { lat: 36,    lon: 138,   name: "Japan"           },
  KR: { lat: 37,    lon: 128,   name: "South Korea"     },
  UA: { lat: 49,    lon: 32,    name: "Ukraine"         },
  TR: { lat: 39,    lon: 35,    name: "Turkey"          },
  IR: { lat: 32,    lon: 53,    name: "Iran"            },
  VN: { lat: 14,    lon: 108,   name: "Vietnam"         },
  CA: { lat: 56,    lon: -106,  name: "Canada"          },
  AU: { lat: -25,   lon: 133,   name: "Australia"       },
  IT: { lat: 42,    lon: 12,    name: "Italy"           },
  ES: { lat: 40,    lon: -4,    name: "Spain"           },
  AR: { lat: -38,   lon: -63,   name: "Argentina"       },
  SG: { lat: 1.3,   lon: 103.8, name: "Singapore"       },
  CO: { lat: 4,     lon: -72,   name: "Colombia"        },
  HK: { lat: 22.3,  lon: 114.2, name: "Hong Kong"       },
  PL: { lat: 52,    lon: 20,    name: "Poland"          },
  CL: { lat: -35,   lon: -71,   name: "Chile"           },
  MX: { lat: 23,    lon: -102,  name: "Mexico"          },
  ZA: { lat: -29,   lon: 25,    name: "South Africa"    },
  NG: { lat: 9,     lon: 8,     name: "Nigeria"         },
  PK: { lat: 30,    lon: 69,    name: "Pakistan"        },
  ID: { lat: -2,    lon: 118,   name: "Indonesia"       },
  TH: { lat: 15,    lon: 101,   name: "Thailand"        },
  MY: { lat: 4,     lon: 109,   name: "Malaysia"        },
  PH: { lat: 13,    lon: 122,   name: "Philippines"     },
  EG: { lat: 27,    lon: 30,    name: "Egypt"           },
  SA: { lat: 24,    lon: 45,    name: "Saudi Arabia"    },
  PT: { lat: 39,    lon: -8,    name: "Portugal"        },
  SE: { lat: 60,    lon: 18,    name: "Sweden"          },
  CH: { lat: 47,    lon: 8,     name: "Switzerland"     },
  BE: { lat: 50,    lon: 4,     name: "Belgium"         },
  RO: { lat: 46,    lon: 25,    name: "Romania"         },
  CZ: { lat: 50,    lon: 15,    name: "Czech Republic"  },
  HU: { lat: 47,    lon: 19,    name: "Hungary"         },
  AT: { lat: 47,    lon: 14,    name: "Austria"         },
  TW: { lat: 23.5,  lon: 121,   name: "Taiwan"          },
  BD: { lat: 23,    lon: 90,    name: "Bangladesh"      },
};

function getSeverity(rank) {
  if (rank <= 3) return "critical";
  if (rank <= 6) return "high";
  return "elevated";
}

function getColor(severity) {
  if (severity === "critical") return "#ff2244";
  if (severity === "high")     return "#ff9900";
  return "#ffee00";
}

const FALLBACK_DATA = [
  { country: "Brazil",        code: "BR", lat: -14, lon: -51,  value: "23.79", attacks: 237939, severity: "critical", rank: 1 },
  { country: "United States", code: "US", lat: 38,  lon: -97,  value: "16.11", attacks: 161060, severity: "critical", rank: 2 },
  { country: "Germany",       code: "DE", lat: 51,  lon: 10,   value: "6.85",  attacks: 68492,  severity: "critical", rank: 3 },
  { country: "India",         code: "IN", lat: 20,  lon: 78,   value: "4.31",  attacks: 43134,  severity: "high",     rank: 4 },
  { country: "Argentina",     code: "AR", lat: -38, lon: -63,  value: "3.29",  attacks: 32850,  severity: "high",     rank: 5 },
  { country: "France",        code: "FR", lat: 46,  lon: 2,    value: "3.22",  attacks: 32208,  severity: "high",     rank: 6 },
  { country: "Netherlands",   code: "NL", lat: 52,  lon: 5,    value: "2.84",  attacks: 28416,  severity: "elevated", rank: 7 },
  { country: "Russia",        code: "RU", lat: 61,  lon: 105,  value: "2.55",  attacks: 25455,  severity: "elevated", rank: 8 },
  { country: "Singapore",     code: "SG", lat: 1.3, lon: 103.8,value: "2.53",  attacks: 25332,  severity: "elevated", rank: 9 },
  { country: "Colombia",      code: "CO", lat: 4,   lon: -72,  value: "2.52",  attacks: 25186,  severity: "elevated", rank: 10 },
];

function buildFallback() {
  return FALLBACK_DATA.map((d) => ({
    ...d,
    color: getColor(d.severity),
    isLive: false,
  }));
}

export async function fetchTopAttackedCountries() {
  try {
    const res = await fetch(`${BACKEND_URL}/threat/radar/top-attacked`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Backend ${res.status}`);

    const json = await res.json();
    const rawList = json?.result?.top_0 ?? [];

    if (rawList.length === 0) throw new Error("Empty list");

    // ✅ Fixed: correct field is originCountryAlpha2 (not clientCountryAlpha2)
    const mapped = rawList
      .filter((item) => COUNTRY_COORDS[item.originCountryAlpha2])
      .slice(0, 10)
      .map((item) => {
        const code     = item.originCountryAlpha2;
        const coords   = COUNTRY_COORDS[code];
        const rank     = item.rank;
        const severity = getSeverity(rank);
        // value is a percentage string like "23.793888"
        const pct      = parseFloat(item.value);
        return {
          country:  coords.name,
          code,
          lat:      coords.lat,
          lon:      coords.lon,
          value:    pct.toFixed(2),           // "23.79"
          attacks:  Math.round(pct * 10000),  // scaled count for display
          severity,
          color:    getColor(severity),
          rank,
          isLive:   true,
        };
      });

    if (mapped.length === 0) throw new Error("No matching coords");

    console.log(`✅ Live Cloudflare data: ${mapped.length} countries`);
    return mapped;

  } catch (err) {
    console.warn(`⚠️ Using fallback — ${err.message}`);
    return buildFallback();
  }
}