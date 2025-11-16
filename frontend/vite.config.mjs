import react from "@vitejs/plugin-react";

export default {
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://backend:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
};
