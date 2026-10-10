import { nextui } from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#121212",
        foreground: "#f2f2f0",
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui({
      defaultTheme: "dark",
      themes: {
        dark: {
          colors: {
            background: "#121212",
            foreground: "#f2f2f0",
            primary: {
              DEFAULT: "#1D9E75",
              foreground: "#ffffff",
            },
            default: {
              DEFAULT: "#262626",
              foreground: "#a3a3a3",
            },
            danger: {
              DEFAULT: "#E53935",
              foreground: "#ffffff",
            }
          }
        }
      }
    }),
  ],
};
