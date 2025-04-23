module.exports = {
    content: [
      "./resources/**/*.blade.php",
      "./resources/**/*.js",
      "./resources/**/*.vue",
      "./resources/**/*.jsx",
    ],
    theme: {
      extend: {
        keyframes: {
          fadeInScale: {
            '0%': { opacity: 0, transform: 'scale(0.8)' },
            '100%': { opacity: 1, transform: 'scale(1)' },
          },
        },
        animation: {
          fadeInScale: 'fadeInScale 0.3s ease-out',
        },
  
    },
    plugins: [],
  }}
  