import type { Config } from "tailwindcss";

/**
 * ServiceLink design tokens.
 * Direction: a Nairobi hardware-store / workshop palette rather than a
 * generic SaaS look — cement paper background, ironwork charcoal ink,
 * a hardhat-amber for actions, and M-Pesa green reserved specifically
 * for payment/verified states so the color carries meaning.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#211F1B",
        "ink-soft": "#4A473F",
        steel: "#6E6B62",
        "steel-light": "#A8A499",
        paper: "#EDEAE1",
        "paper-raised": "#F8F6F0",
        "paper-line": "#DCD8CC",
        amber: {
          DEFAULT: "#E2932A",
          dark: "#C97B1B",
          light: "#FBEBD3",
        },
        verified: {
          DEFAULT: "#1F7A43",
          light: "#E4F1E8",
          dark: "#155C32",
        },
        danger: {
          DEFAULT: "#B3432B",
          light: "#F6E4DE",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        lg: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(33, 31, 27, 0.06), 0 1px 0 rgba(33, 31, 27, 0.04)",
        stamp: "0 2px 0 rgba(33, 31, 27, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
