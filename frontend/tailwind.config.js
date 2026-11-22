/** Design tokens AN THỊNH PHÁT – mọi màu/cỡ chữ lấy từ đây, không dùng giá trị rời trong component. */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#FDF4E3", 100: "#FBEBD0", 500: "#E99A24", 600: "#C77F0F", 700: "#9C6209" },
        gold: "#D5A64A",
        steel: { 900: "#25282C", 800: "#2F3338", 700: "#3E434A", 500: "#6B7076", 300: "#B4B8BD", 200: "#D9DBDE", 100: "#ECEEF0" },
        paper: "#F8F9FA",
        ok: "#2F7D4F",
        danger: "#B3372C",
      },
      fontFamily: { sans: ['"Be Vietnam Pro"', "system-ui", "sans-serif"] },
      fontSize: {
        display: ["clamp(2.5rem, 6vw, 4.75rem)", { lineHeight: "1.02", letterSpacing: "-0.03em", fontWeight: "800" }],
        h1: ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        h2: ["clamp(1.5rem, 2.6vw, 2rem)", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "700" }],
        h3: ["1.25rem", { lineHeight: "1.3", fontWeight: "700" }],
      },
      borderRadius: { DEFAULT: "2px", md: "4px" },
      maxWidth: { page: "1240px" },
    },
  },
  plugins: [],
};
