export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          100: "#0F0F1A",
          200: "#151523",
          300: "#1B1B2E",
          400: "#232339",
        },
        purple: {
          400: "#9F7AEA",
          500: "#8B5CF6",
          600: "#7C3AED",
          900: "#4C1D95",
        },
        live: {
          500: "#EF4444",
        },
        success: {
          500: "#22C55E",
        },
      },
    },
  },
  safelist: [
    'overflow-wrap-anywhere'
  ],
  plugins: [],
};