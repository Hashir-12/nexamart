const fs = require('fs');
const path = require('path');

// Path to frontend mock file
const mockPath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'mockProducts.ts');
const content = fs.readFileSync(mockPath, 'utf8');

// Extract the array between the brackets
const start = content.indexOf('[');
const end = content.lastIndexOf(']') + 1;
let arrayStr = content.substring(start, end);

// Replace 'baseImage' calls with actual URLs
arrayStr = arrayStr.replace(/baseImage\(['"]([^'"]+)['"]\)/g, (match, seed) => `"https://picsum.photos/seed/${seed}/400/400"`);

// Parse as JavaScript (we need to evaluate it, but it's easier to write a temporary file)
// We'll use a safer approach: write a temporary JSON file.
// Since it's TypeScript, we need to remove type annotations.
// Quick and dirty: we'll use eval with a function.
// But to avoid security issues, we'll just create a JSON file manually from the mock data.

console.log('Please manually copy the mockProducts array to backend/data/products.json');
console.log('Or run a Python script to convert it.');