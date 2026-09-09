import re
import json
from pathlib import Path

ts_file = Path(__file__).parent.parent / "frontend" / "src" / "data" / "mockProducts.ts"
if not ts_file.exists():
    print("Frontend mock file not found")
    exit(1)

content = ts_file.read_text(encoding="utf-8")
# Remove TypeScript type annotations and export
# We'll extract the array by finding the content between 'export const mockProducts: Product[] = ' and ';'
match = re.search(r'export const mockProducts: Product\[\] = (\[[\s\S]*?\]);', content)
if not match:
    print("Could not find mockProducts array")
    exit(1)

array_text = match.group(1)

# Replace baseImage calls with string literals
def replace_baseimage(match):
    seed = match.group(1)
    return f'"https://picsum.photos/seed/{seed}/400/400"'

array_text = re.sub(r'baseImage\(["\']([^"\']+)["\']\)', replace_baseimage, array_text)

# Now we have a string that looks like a JavaScript array.
# We'll evaluate it as Python using ast.literal_eval? Not safe.
# We'll use json5 or simple eval with caution.
# Simpler: write it to a temporary .js file and run node to get JSON.
# But we can just replace single quotes with double quotes and hope.
# Let's do a quick and dirty conversion.

# We'll use a trick: replace ' with " for keys and strings, but careful with nested.
# Better: use the json module with strict=False? Not possible.
# We'll just rely on the fact that it's valid JS and use a Node script.

print("Please run the Node script export_products.js instead.")