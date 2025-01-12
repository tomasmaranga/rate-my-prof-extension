/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      scale: {
        60: "0.6",
        65: "0.65",
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
