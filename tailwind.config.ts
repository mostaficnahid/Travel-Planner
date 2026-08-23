import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* ── CSS variable tokens ── */
        background:        "var(--background)",
        foreground:        "var(--foreground)",
        card:              "var(--card)",
        "card-foreground": "var(--card-foreground)",
        primary: {
          DEFAULT:    "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT:    "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT:    "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        muted: {
          DEFAULT:    "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        border: "var(--border)",

        /* ── Named brand tokens (from logo) ── */
        brand: {
          navy:   "#1B2F5E",   // "TRAVEL PLANNER" text in logo
          teal:   "#1BA8B5",   // globe / primary arcs
          gold:   "#C8872A",   // compass rose
          orange: "#E87B2A",   // energy arc / CTA gradients
          dark:   "#070D1A",   // page background
          card:   "#0E1929",   // card surface
          muted:  "#8DA4BF",   // secondary text
        },
      },
      fontFamily: {
        sans:  ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      backgroundImage: {
        /* Core brand gradient — teal → navy → gold  */
        "brand-gradient": "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 55%, #C8872A 100%)",
        /* CTA gradient — teal → gold */
        "cta-gradient":   "linear-gradient(to right, #1BA8B5, #1B2F5E, #C8872A)",
        /* Hero radial ambient */
        "hero-ambient":
          "radial-gradient(at 0% 0%, rgba(27,168,181,0.18) 0px, transparent 55%), " +
          "radial-gradient(at 100% 0%, rgba(27,47,94,0.25) 0px, transparent 55%), " +
          "radial-gradient(at 50% 100%, rgba(200,135,42,0.12) 0px, transparent 55%)",
      },
      boxShadow: {
        "teal-glow":   "0 0 40px -8px rgba(27,168,181,0.55)",
        "gold-glow":   "0 0 40px -8px rgba(200,135,42,0.45)",
        "navy-glow":   "0 0 40px -8px rgba(27,47,94,0.55)",
        "orange-glow": "0 0 40px -8px rgba(232,123,42,0.45)",
      },
      animation: {
        "compass-idle": "compassSpin 6s ease-in-out infinite",
      },
      keyframes: {
        compassSpin: {
          "0%, 85%": { transform: "rotate(0deg)"  },
          "90%":     { transform: "rotate(15deg)" },
          "95%":     { transform: "rotate(-10deg)" },
          "100%":    { transform: "rotate(0deg)"  },
        },
      },
    },
  },
  plugins: [],
};
export default config;
