# Sunplan Lahore

**When should I run the AC, water motor, washing machine or iron so it runs on my own solar?**

Sunplan takes a Lahore household's panel size and typical loads, estimates hour-by-hour solar output from free irradiance data, and recommends the best time slot for each heavy appliance.

**Live app:** https://lahore-solar-planner.vercel.app

## Features

- **7-day forecast** of hourly solar output for your exact panel tilt and direction, with a cloud indicator per day
- **Typical day by month** (from the most recent complete month of ERA5 records) for seasonal planning: compare a January day with a June day
- **Appliance scheduler** that places each heavy load in the window it covers best from solar, and explains why when it can't reach 100% (too powerful, runs too long, or shares the sunny hours)
- **Hourly chart and table**: solar output vs. always-on load and scheduled appliances, with per-hour tooltips
- Settings are saved in your browser. No sign-up, no API keys.
- Light and dark themes, keyboard accessible, works on phones

## How the estimate works

| Step | Detail |
| --- | --- |
| Irradiance | [Open-Meteo](https://open-meteo.com/) `global_tilted_irradiance` for Lahore (31.52° N, 74.36° E) on your panel plane. Hourly values are means over the preceding hour, so they are re-keyed so slot *h* covers *h*:00–*h+1*:00. |
| Output | `kW = panel kWp × GTI / 1000 × system efficiency × temperature factor`, capped at the array's rated size |
| Heat loss | Cell temperature from the NOCT model (45 °C), −0.37 %/°C. This matters on 40 °C Lahore afternoons. |
| System efficiency | 80 % default (inverter, wiring, dust), adjustable under *Advanced* |
| Scheduling | Greedy: the largest-energy appliance picks first, taking the contiguous window with the most solar surplus left after the always-on load. Ties go to the window with the most spare surplus, as a cloud buffer. |

These are estimates. Real output also depends on shading, panel condition and inverter limits.

## Tech

Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, Recharts, Vitest. The `/api/irradiance` route proxies Open-Meteo. It validates its inputs and caches responses with `'use cache'`: hourly for forecasts, weekly for monthly averages.

```
src/
  app/api/irradiance/route.ts   # validated, cached proxy to Open-Meteo
  lib/solar.ts                  # PV output model
  lib/scheduler.ts              # appliance window planner
  lib/open-meteo.ts             # fetch + hour re-keying + monthly averaging
  components/                   # UI (Planner is the page shell)
```

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # model and scheduler unit tests
npm run build
```

## Data attribution

Weather and irradiance data by [Open-Meteo.com](https://open-meteo.com/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## License

MIT
