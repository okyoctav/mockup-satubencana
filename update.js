const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

// Replace everything before "* {"
const newVars = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root,
html[data-theme="dark"],
html[data-theme="light"] {
  --bg-primary: #003249;
  --bg-secondary: #38618c;
  --bg-page: #003249;
  --bg-section: #003249;
  --bg-section-alt: #38618c;
  --bg-card: rgba(0, 50, 73, 0.9);
  --bg-navbar: rgba(0, 50, 73, 0.92);
  --bg-navbar-solid: rgba(0, 50, 73, 0.97);
  
  --text-primary: #ccdbdc;
  --text-secondary: #35a7ff;
  --text-muted: #38618c;
  --text-feature: #ccdbdc;
  
  --border-subtle: rgba(53, 167, 255, 0.2);
  --border-faint: rgba(53, 167, 255, 0.1);
  --card-border-red: rgba(255, 127, 17, 0.3);
  --card-border-blue: rgba(53, 167, 255, 0.3);
  --card-border-orange: rgba(255, 127, 17, 0.3);
  
  --chart-bg: #003249;
  --chart-grid: #38618c;
  --chart-text: #ccdbdc;
  --chart-tooltip-bg: #003249;
  --chart-tooltip-border: #38618c;
  
  --hero-bg: linear-gradient(135deg, #003249 0%, #38618c 50%, #003249 100%);
  --footer-bg: linear-gradient(180deg, #38618c 0%, #003249 100%);
  --section-gradient: linear-gradient(180deg, #003249 0%, #38618c 50%, #003249 100%);
  
  --mitra-bg: rgba(53, 167, 255, 0.05);
  --mitra-border: rgba(53, 167, 255, 0.15);
  
  --accent-blue: #35a7ff;
  --accent-orange: #ff7f11;
  --accent-green: #35a7ff;
  --accent-red: #ff7f11;
  
  --glass-bg: rgba(0, 50, 73, 0.6);
  --glass-border: rgba(53, 167, 255, 0.3);
  
  --scrollbar-track: #003249;
  
  --toggle-bg: rgba(204, 219, 220, 0.1);
  --toggle-border: rgba(204, 219, 220, 0.2);
  --toggle-icon: #ff7f11;
}

`;
const restOfCss = css.substring(css.indexOf('* {'));
let finalCss = newVars + restOfCss;

// Replace some other classes in utilities
finalCss = finalCss.replace('linear-gradient(135deg, #0EA5E9, #22C55E)', 'linear-gradient(135deg, #35a7ff, #ccdbdc)');

fs.writeFileSync('src/app/globals.css', finalCss);
