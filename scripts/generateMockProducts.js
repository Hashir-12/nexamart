const fs = require('fs');
const path = require('path');

// ----- Sample data pools -----
const brands = [
  'QuantumTech', 'AeroTech', 'ZenTech', 'Phantom', 'Aura', 'SonicWave',
  'EchoBuds', 'UltraView', 'GamersEdge', 'MechType', 'SlimType', 'Precision',
  'GamerStorm', 'VisionPro', 'ActionCam', 'ErgoTech', 'ConnectPro', 'WorkMate',
  'Nova', 'BassMaster', 'EcoView', 'CompactType', 'SilentTouch', 'InstaCam',
  'ChargePro', 'EduTech', 'Zen', 'SoundLink', 'Panorama', 'GripIt'
];

const categories = ['Laptops', 'Smartphones', 'Headphones', 'Monitors', 'Keyboards', 'Mice', 'Cameras', 'Accessories'];
const subcategories = {
  Laptops: ['Ultrabooks', '2-in-1', 'Business', 'Chromebook', 'Gaming'],
  Smartphones: ['Flagship', 'Mid-range', 'Foldable', 'Budget', '5G'],
  Headphones: ['Over-Ear', 'In-Ear', 'On-Ear', 'Wireless', 'ANC'],
  Monitors: ['4K', 'Gaming', 'Budget', 'Ultrawide', 'Curved'],
  Keyboards: ['Mechanical', 'Wireless', 'Slim', 'RGB', 'Compact'],
  Mice: ['Wireless', 'Gaming', 'Ergonomic', 'Compact', 'RGB'],
  Cameras: ['DSLR', 'Action', 'Compact', 'Mirrorless'],
  Accessories: ['Stands', 'Hubs', 'Chargers', 'Phone Accessories', 'Cases']
};

const stockStatuses = ['In Stock', 'Low Stock', 'Out of Stock'];

// Helper to pick random item from array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate a slug from title
const slugify = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Generate a single product
function generateProduct(index) {
  const category = pick(categories);
  const subcategory = pick(subcategories[category] || ['General']);
  const brand = pick(brands);
  const titlePrefix = pick(['Pro', 'Elite', 'Ultra', 'Max', 'Lite', 'Plus', 'Prime', 'Studio', 'Flex', 'Nova']);
  const title = `${pick(['Quantum', 'Aero', 'Zen', 'Phantom', 'Aura', 'Sonic', 'Echo', 'Ultra', 'Gamer', 'Mech', 'Slim', 'Precision', 'Storm', 'Vision', 'Action', 'Ergo', 'Connect', 'Work', 'Nova', 'Bass', 'Eco', 'Compact', 'Silent', 'Insta', 'Charge', 'Edu', 'Sound', 'Panorama', 'Grip'])}${pick(['Book', 'Wave', 'View', 'Edge', 'Type', 'Touch', 'Cam', 'Hub', 'Pad', 'Stand', 'Lite', 'Fold'])} ${titlePrefix}`;
  const price = Math.round((pick([299, 399, 499, 599, 699, 799, 899, 999, 1099, 1299, 1499]) + Math.random() * 100) * 100) / 100;
  const compareAtPrice = price + Math.round((50 + Math.random() * 200) * 100) / 100;
  const rating = parseFloat((3.5 + Math.random() * 1.5).toFixed(1));
  const reviewCount = Math.floor(20 + Math.random() * 400);
  const stockStatus = pick(stockStatuses);
  const features = Array.from({ length: 4 + Math.floor(Math.random() * 3) }, () => pick(['High performance', 'Long battery life', 'Lightweight', 'Durable', 'Waterproof', 'Fast charging', 'Touchscreen', 'Bluetooth', 'USB-C', 'HDMI', 'RGB lighting', 'Foldable', 'Noise cancellation', 'Wireless', 'Ergonomic', 'VESA mount', '4K', 'HDR', 'G-Sync', 'FreeSync']));
  const specs = {
    Processor: pick(['Intel Core i5', 'Intel Core i7', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Snapdragon 8 Gen 2', 'MediaTek Dimensity', 'Apple M1']),
    RAM: pick(['8GB', '16GB', '32GB']),
    Storage: pick(['256GB SSD', '512GB SSD', '1TB SSD', '128GB eMMC']),
    Display: pick(['14" FHD', '15.6" 4K', '13.3" OLED', '27" QHD', '34" UltraWide']),
    Battery: 'Up to ' + (8 + Math.floor(Math.random() * 10)) + ' hours'
  };
  const variants = [{ name: 'Color', options: pick([['Black', 'White'], ['Silver', 'Gray'], ['Blue', 'Red'], ['Black', 'Silver', 'Gold']]) }];
  const colors = variants[0].options;
  const tags = [category.toLowerCase(), pick(['wireless', 'gaming', 'pro', 'budget', 'premium', 'compact'])];
  const useCases = pick([['Gaming', 'Work'], ['Photography', 'Travel'], ['Office', 'Home'], ['Creative', 'Design'], ['Student', 'Business']]);
  const pros = pick([['Great value', 'Performance'], ['Good design', 'Durable'], ['Excellent screen', 'Fast']]);
  const cons = pick([['Pricey', 'Heavy'], ['Limited ports', 'Average battery'], ['No warranty', 'Poor software']]);

  const id = (index + 1).toString();
  const sku = `${category.slice(0, 2).toUpperCase()}-${String(1000 + index).slice(1)}`;

  // Build images array with baseImage function calls as strings, but we'll later embed them directly
  // Since we are generating code, we can output the function call directly in the string.
  // We'll construct the object as a JavaScript literal.
  return {
    id,
    sku,
    title,
    slug: slugify(title),
    brand,
    category,
    subcategory,
    description: `Experience top‑notch quality with the ${title}. Ideal for ${useCases.join(' and ')}.`,
    shortDescription: `${pick(['Premium', 'Affordable', 'Versatile', 'High‑end'])} ${category.slice(0, -1)} for ${pick(['daily use', 'professionals', 'enthusiasts', 'gamers'])}.`,
    price,
    compareAtPrice,
    currency: 'USD',
    images: [`baseImage('${id}a')`, `baseImage('${id}b')`, `baseImage('${id}c')`], // these will be string literals that become function calls
    features: features.slice(0, 5),
    specifications: specs,
    variants,
    colors,
    rating,
    reviewCount,
    stockStatus,
    tags,
    useCases,
    pros,
    cons
  };
}

// Generate N products (adjust count as needed)
const PRODUCT_COUNT = 35;

const products = Array.from({ length: PRODUCT_COUNT }, (_, i) => generateProduct(i));

// Build the file content as a string with the array literal
// We'll stringify the array but then replace the image strings with actual function calls
let jsonStr = JSON.stringify(products, null, 2);
// Replace the image array strings with function calls: "baseImage('1a')" -> baseImage('1a')
// We need to replace the quoted strings that start with "baseImage("
jsonStr = jsonStr.replace(/"baseImage\('([^']+)'\)"/g, 'baseImage("$1")');

const fileContent = `import { Product } from '../types';

const baseImage = (seed: string) => \`https://picsum.photos/seed/\${seed}/400/400\`;

export const mockProducts: Product[] = ${jsonStr};
`;

// Write to frontend/src/data/mockProducts.ts
const outputPath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'mockProducts.ts');
fs.writeFileSync(outputPath, fileContent, 'utf8');
console.log(`✅ Generated ${PRODUCT_COUNT} products in ${outputPath}`);