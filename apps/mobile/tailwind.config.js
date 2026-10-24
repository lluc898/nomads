/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#EAF3FF", 500: "#0B6EFD", 600: "#0857C9" },
        accent: "#FF6B35",
      },
    },
  },
  plugins: [],
};
