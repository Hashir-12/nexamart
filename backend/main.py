import os
import json
import re
import urllib.request
import urllib.error
import asyncio
from typing import List, Optional, Dict, Any, Callable
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from product_search import search_products
from store import load_cart, get_cart_summary, update_cart_action, load_orders, create_order_from_cart, clear_cart

load_dotenv()

# ---- Data ----
with open("products.json", "r", encoding="utf-8") as f:
    PRODUCTS = json.load(f)

PRODUCTS_BY_ID = {str(p["id"]): p for p in PRODUCTS}

PRODUCT_FIELDS_UNION = set()
for p in PRODUCTS:
    PRODUCT_FIELDS_UNION.update(p.keys())
ALL_FIELDS = sorted(PRODUCT_FIELDS_UNION)

# ---- Models ----
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    content: str
    productCards: Optional[List[Dict[str, Any]]] = None
    cart: Optional[Dict[str, Any]] = None

# ---- OpenRouter configuration ----
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in environment")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.getenv("OPENROUTER_MODEL", "minimax/minimax-m3:free")

# ---- CORS configuration ----
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# ---- Tool definitions (unchanged) ----
SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "search_products",
        "description": "Search for products in the catalog based on various criteria.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "General search query, e.g., 'good camera'."},
                "category": {"type": "string", "description": "Product category, e.g., 'Smartphones'."},
                "subcategory": {"type": "string"},
                "min_price": {"type": "number"},
                "max_price": {"type": "number"},
                "features": {"type": "array", "items": {"type": "string"}},
                "keywords": {"type": "array", "items": {"type": "string"}},
                "colors": {"type": "array", "items": {"type": "string"}},
                "brands": {"type": "array", "items": {"type": "string"}},
                "min_rating": {"type": "number"},
                "in_stock": {"type": "boolean"},
                "excluded": {"type": "array", "items": {"type": "string"}, "description": "Product IDs to exclude."},
                "limit": {"type": "integer", "default": 5},
                "sort": {"type": "string", "enum": ["relevance", "price_asc", "price_desc", "rating_desc"]}
            },
            "required": []
        }
    }
}

PRODUCT_DETAILS_TOOL = {
    "type": "function",
    "function": {
        "name": "get_product_details",
        "description": "Retrieve full details of a specific product by its ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "product_id": {"type": "string", "description": "The ID of the product."}
            },
            "required": ["product_id"]
        }
    }
}

RELATED_TOOL = {
    "type": "function",
    "function": {
        "name": "get_related_products",
        "description": "Find products similar to a given product. Returns a list of related products.",
        "parameters": {
            "type": "object",
            "properties": {
                "product_id": {"type": "string", "description": "The ID of the product to find relations for."},
                "limit": {"type": "integer", "default": 5, "description": "Maximum number of related products."}
            },
            "required": ["product_id"]
        }
    }
}

GET_CART_TOOL = {
    "type": "function",
    "function": {
        "name": "get_cart",
        "description": "Retrieve the current cart contents, including items, quantities, selections, and total.",
        "parameters": {"type": "object", "properties": {}, "required": []}
    }
}

UPDATE_CART_TOOL = {
    "type": "function",
    "function": {
        "name": "update_cart",
        "description": "Modify the cart: add, remove, update quantity, update selections, or clear.",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["add", "remove", "update_quantity", "update_selections", "clear"],
                    "description": "The action to perform."
                },
                "product_id": {"type": "string", "description": "Required for 'add'."},
                "cart_item_id": {"type": "string", "description": "Required for 'remove', 'update_quantity', 'update_selections'."},
                "quantity": {"type": "integer", "description": "Required for 'update_quantity', optional for 'add'."},
                "selections": {"type": "object", "description": "Selected options (e.g., color, size). Required for 'update_selections', optional for 'add'."}
            },
            "required": ["action"]
        }
    }
}

GET_ORDERS_TOOL = {
    "type": "function",
    "function": {
        "name": "get_orders",
        "description": "Retrieve order history. Optionally filter by status and limit.",
        "parameters": {
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "Filter by status (e.g., 'Processing', 'Shipped', 'Delivered')."},
                "limit": {"type": "integer", "description": "Maximum number of orders to return."}
            },
            "required": []
        }
    }
}

GET_ORDER_DETAILS_TOOL = {
    "type": "function",
    "function": {
        "name": "get_order_details",
        "description": "Retrieve full details of a specific order by its ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "The ID of the order (e.g., 'NX-1001')."}
            },
            "required": ["order_id"]
        }
    }
}

GET_DELIVERY_STATUS_TOOL = {
    "type": "function",
    "function": {
        "name": "get_delivery_status",
        "description": "Retrieve the delivery status and estimated delivery date for an order.",
        "parameters": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "The ID of the order."}
            },
            "required": ["order_id"]
        }
    }
}

ALL_TOOLS = [
    SEARCH_TOOL,
    PRODUCT_DETAILS_TOOL,
    RELATED_TOOL,
    GET_CART_TOOL,
    UPDATE_CART_TOOL,
    GET_ORDERS_TOOL,
    GET_ORDER_DETAILS_TOOL,
    GET_DELIVERY_STATUS_TOOL
]

# ---- Helpers (unchanged) ----
def build_system_prompt() -> str:
    fields_str = ", ".join(ALL_FIELDS)
    return (
        "You are an AI shopping assistant for NexaMart. You have access to several tools to help users find products, manage their cart, view orders, and check delivery status.\n\n"
        "### Available tools:\n"
        "- search_products: Find products by category, price, features, etc.\n"
        "- get_product_details: Retrieve full details of a specific product.\n"
        "- get_related_products: Find similar products.\n"
        "- get_cart: View current cart contents.\n"
        "- update_cart: Add, remove, update quantity, or change selections in the cart.\n"
        "- get_orders: View order history (optionally filtered).\n"
        "- get_order_details: View full details of a specific order.\n"
        "- get_delivery_status: Check delivery status and estimated delivery date for an order.\n\n"
        "**CRITICAL RULES:**\n"
        "1. NEVER mention your internal process, tool names, or phrases like 'let me', 'I'll try', 'I'm searching', etc. "
        "Just respond directly with the final answer using the data returned from tools.\n"
        "2. NEVER mention product IDs, timestamps, or any meta‑commentary about the conversation. "
        "Do not explain how you work – just provide the answer.\n"
        "3. When you recommend a product, you MUST use the EXACT title as it appears in the search result. "
        "Do not invent product names or modify the title. The ID must match the product you are referring to.\n"
        "4. For each product you recommend, include its ID in square brackets EXACTLY ONCE, immediately after the product's title when you first introduce it. "
        "Example: 'QuantumBook Pro 14 [1]' – then never repeat that ID anywhere else in the response.\n"
        "5. ABSOLUTELY FORBIDDEN: Putting [id] markers inside tables, bullet lists, or any structured content. "
        "If you create a table, only use product names (without IDs) inside the table cells. "
        "The [id] must ONLY appear in plain text after the product name on first mention, outside any table or list.\n"
        "6. If a search returns no results, simply say: 'I couldn't find products matching your criteria. Would you like to broaden your search?' – no extra commentary.\n"
        "7. Provide **detailed, comprehensive** responses. Include relevant context such as product specifications, pros/cons, comparisons, and clear conclusions. "
        "When the user asks about cart actions (add/remove/clear), list exactly which items were affected and the resulting totals. "
        "For order queries, include order date, status, total, and item summary. Be thorough and helpful – your answers should be informative and complete, not just one or two sentences.\n"
        "8. Use markdown formatting: **bold**, *italic*, ~~strikethrough~~, tables (pipe format), headings (#, ##), horizontal rules (---), and bullet lists (use '-' or '*').\n"
        "9. Always end with a clear recommendation or summary tailored to the user's request.\n"
        "10. Do not include any URLs or links – only plain text with markdown.\n"
        "11. **'Other options' handling**: When the user asks for alternatives, 'other options', 'more like this', etc., "
        "you MUST call search_products again with the `excluded` parameter containing the IDs of all previously shown products "
        "(from the current conversation). This ensures you return genuinely different products. Also consider slightly adjusting filters "
        "(e.g., broadening price range) if needed.\n"
        "12. **Avoid unnecessary searches**: Do not call search_products if the required product data is already available in the conversation "
        "history or in the results of a previous tool call. Only search when you need new information not already present.\n"
        "13. When comparing products, refer to them by their IDs from the current context. Use the actual data from the tool results; "
        "do not invent specifications.\n"
        "14. For cart operations: if the user asks to add a product without specifying options, and the product has configurable options (e.g., color), "
        "ask the user to clarify before calling update_cart. If the product has no options, add it directly.\n"
        "15. For removal or updates, always use the correct cart_item_id from the cart data. If the reference is ambiguous, ask for clarification.\n"
        "16. Never pretend an action succeeded if the tool returned an error. Inform the user of the issue and suggest a resolution.\n"
        "17. The product data may contain the following fields (some may be missing for certain products):\n"
        f"{fields_str}\n"
        "18. **ABSOLUTELY CRITICAL**: NEVER place [id] markers inside table cells. If you create a table, use only product names (without IDs) inside the table. "
        "The [id] must only appear in plain text, outside any table or list structure. Violating this will cause display errors.\n"
        "19. **Response detail**: Always provide complete, satisfying answers. When you clear the cart, mention the items that were removed and the previous total. "
        "When you add items, confirm the addition and give the new cart total. Be generous with details – users appreciate thoroughness.\n"
        "20. **STRICT PRODUCT DATA RULE**: You may ONLY mention products that appear in the results of your tool calls (search_products, get_product_details, get_cart, get_orders, etc.). "
        "Do NOT invent product names, models, brands, or specifications. Do NOT list products from your training data or general knowledge. "
        "If the user asks for a type of product and the search returns no results, clearly state that no matching products were found in the catalog.\n"
        "21. **MANDATORY PRODUCT ID INCLUSION**: For every product you mention by name, you MUST include its ID in square brackets immediately after the first mention. "
        "Example: 'QuantumBook Pro 14 [1]' – this triggers the product card in the frontend. If you omit the ID, the product card will not appear. "
        "When comparing products, each product must have its ID in brackets.\n"
        "22. **'PRODUCT CARD' REQUESTS**: When the user asks for 'product card', 'list its card', 'show its card', or similar, they want to see the product card in the chat. "
        "You should ensure you have the product data (call get_product_details if needed) and then mention the product with its ID to trigger the card. "
        "Do not interpret 'card' as credit card – it always refers to the product display card.\n"
        "23. **CLARIFY 'CARD' CONTEXT**: If the user says 'card' in the context of a product, assume they mean the product card. If they ask for a credit card, they will explicitly say 'credit card' or 'payment'."
    )

def extract_product_ids(content: str) -> List[int]:
    bracketed = re.findall(r"[\[\{]\s*(\d+)\s*[\]\}]", content)
    return sorted(set(int(x) for x in bracketed))

def generate_fallback_with_context(messages: List[Message]) -> str:
    return "I'm having trouble connecting to the AI service right now. Please try again in a moment."

# ---- Synchronous streaming request (unchanged) ----
def stream_openrouter_request(
    messages: List[Dict[str, str]],
    tools: Optional[List[Dict]] = None,
    tool_choice: str = "auto",
    token_callback: Optional[Callable[[str], None]] = None
) -> Dict[str, Any]:
    payload = {
        "model": MODEL,
        "messages": messages,
        "stream": True,
        "temperature": 0.7,
        "max_tokens": 3200,
    }
    if tools is not None:
        payload["tools"] = tools
        payload["tool_choice"] = tool_choice

    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    req = urllib.request.Request(OPENROUTER_URL, data=data, headers=headers, method="POST")

    with urllib.request.urlopen(req, timeout=60) as response:
        assistant_message = {"role": "assistant", "content": "", "tool_calls": None}
        tool_call_args_buffer = {}

        for line_bytes in response:
            line = line_bytes.decode("utf-8").strip()
            if not line:
                continue
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    if "content" in delta:
                        content_piece = delta["content"] or ""
                        assistant_message["content"] += content_piece
                        if token_callback:
                            token_callback(content_piece)
                    if "tool_calls" in delta:
                        tool_calls_delta = delta["tool_calls"]
                        for tc in tool_calls_delta:
                            index = tc.get("index", 0)
                            if index not in tool_call_args_buffer:
                                tool_call_args_buffer[index] = {
                                    "id": tc.get("id", ""),
                                    "type": tc.get("type", "function"),
                                    "function": {"name": "", "arguments": ""}
                                }
                            if "function" in tc:
                                if "name" in tc["function"] and tc["function"]["name"]:
                                    tool_call_args_buffer[index]["function"]["name"] = tc["function"]["name"]
                                if "arguments" in tc["function"]:
                                    args_piece = tc["function"]["arguments"] or ""
                                    tool_call_args_buffer[index]["function"]["arguments"] += args_piece
                except json.JSONDecodeError:
                    continue

        if tool_call_args_buffer:
            assistant_message["tool_calls"] = []
            for idx in sorted(tool_call_args_buffer.keys()):
                tc_data = tool_call_args_buffer[idx]
                assistant_message["tool_calls"].append({
                    "id": tc_data["id"],
                    "type": tc_data["type"],
                    "function": {
                        "name": tc_data["function"]["name"],
                        "arguments": tc_data["function"]["arguments"]
                    }
                })
        return assistant_message

# ---- Tool handler (now accepts session_id) ----
def handle_tool_call(tool_name: str, args: Dict[str, Any], session_id: str) -> Dict[str, Any]:
    if tool_name == "search_products":
        results = search_products(PRODUCTS, **args)
        return {"products": results}
    elif tool_name == "get_product_details":
        product_id = args.get("product_id")
        if not product_id:
            return {"error": "product_id required"}
        product = PRODUCTS_BY_ID.get(str(product_id))
        if product:
            return product
        else:
            return {"error": "Product not found"}
    elif tool_name == "get_related_products":
        product_id = args.get("product_id")
        limit = args.get("limit", 5)
        if not product_id:
            return {"error": "product_id required"}
        product = PRODUCTS_BY_ID.get(str(product_id))
        if not product:
            return {"error": "Product not found"}
        category = product.get("category")
        results = search_products(PRODUCTS, category=category, excluded=[str(product_id)], limit=limit, sort="relevance")
        return {"products": results}
    elif tool_name == "get_cart":
        cart = load_cart(session_id)
        summary = get_cart_summary(cart, PRODUCTS_BY_ID)
        return summary
    elif tool_name == "update_cart":
        result = update_cart_action(
            session_id=session_id,
            action=args.get("action"),
            product_id=args.get("product_id"),
            cart_item_id=args.get("cart_item_id"),
            quantity=args.get("quantity"),
            selections=args.get("selections"),
            products_by_id=PRODUCTS_BY_ID
        )
        cart = load_cart(session_id)
        summary = get_cart_summary(cart, PRODUCTS_BY_ID)
        return {**result, "cart": summary}
    elif tool_name == "get_orders":
        orders = load_orders(session_id)
        status_filter = args.get("status")
        limit = args.get("limit")
        if status_filter:
            orders = [o for o in orders if o.get("status") == status_filter]
        if limit:
            orders = orders[:limit]
        summary = []
        for o in orders:
            summary.append({
                "order_id": o["id"],
                "date": o["date"],
                "status": o["status"],
                "total": o["total"],
                "item_count": len(o.get("items", []))
            })
        return {"orders": summary}
    elif tool_name == "get_order_details":
        order_id = args.get("order_id")
        if not order_id:
            return {"error": "order_id required"}
        orders = load_orders(session_id)
        for o in orders:
            if o["id"] == order_id:
                return o
        return {"error": "Order not found"}
    elif tool_name == "get_delivery_status":
        order_id = args.get("order_id")
        if not order_id:
            return {"error": "order_id required"}
        orders = load_orders(session_id)
        for o in orders:
            if o["id"] == order_id:
                delivery = o.get("delivery", {})
                return {
                    "order_id": order_id,
                    "status": delivery.get("status", "Unknown"),
                    "estimated_delivery": delivery.get("estimated_delivery"),
                    "tracking_number": delivery.get("tracking_number"),
                    "last_update": delivery.get("last_update")
                }
        return {"error": "Order not found"}
    else:
        return {"error": f"Unknown tool {tool_name}"}

# ---- Main orchestration (accepts session_id) ----
def process_chat_streaming(messages: List[Message], token_callback: Callable[[str], None], session_id: str) -> Dict[str, Any]:
    llm_messages = [{"role": "system", "content": build_system_prompt()}]
    for m in messages:
        llm_messages.append({"role": m.role, "content": m.content})

    max_rounds = 5
    final_content = ""
    cart_data = None

    for round_num in range(max_rounds):
        try:
            assistant_msg = stream_openrouter_request(
                llm_messages,
                tools=ALL_TOOLS,
                tool_choice="auto",
                token_callback=None
            )
        except Exception as e:
            print(f"LLM error in round {round_num}: {e}")
            fallback = "I'm having trouble processing your request. Please try again."
            token_callback(fallback)
            return {"content": fallback, "productCards": []}

        tool_calls = assistant_msg.get("tool_calls")
        if tool_calls:
            llm_messages.append({
                "role": "assistant",
                "content": assistant_msg.get("content", ""),
                "tool_calls": tool_calls
            })
            for tc in tool_calls:
                func_name = tc["function"]["name"]
                try:
                    args = json.loads(tc["function"]["arguments"])
                except json.JSONDecodeError:
                    args = {}
                result = handle_tool_call(func_name, args, session_id)
                if func_name == "update_cart" and "cart" in result:
                    cart_data = result["cart"]
                result_for_llm = {k: v for k, v in result.items() if k != "cart"}
                llm_messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": json.dumps(result_for_llm, default=str)
                })
            continue
        else:
            try:
                final_assistant_msg = stream_openrouter_request(
                    llm_messages,
                    tools=[],
                    tool_choice="none",
                    token_callback=token_callback
                )
                final_content = final_assistant_msg.get("content", "")
            except Exception as e:
                print(f"Error in final LLM call: {e}")
                fallback = "I'm sorry, I couldn't generate a response. Please try again."
                token_callback(fallback)
                return {"content": fallback, "productCards": []}
            break
    else:
        fallback = "I'm sorry, I need more information to complete your request. Could you simplify?"
        token_callback(fallback)
        return {"content": fallback, "productCards": []}

    product_ids = extract_product_ids(final_content)
    product_cards = [PRODUCTS_BY_ID[str(pid)] for pid in product_ids if str(pid) in PRODUCTS_BY_ID]
    clean_content = re.sub(r"PRODUCT_RECOMMENDATIONS:\s*[\d,\s]+", "", final_content).strip()
    return {"content": clean_content, "productCards": product_cards, "cart": cart_data}

# ---- FastAPI app ----
app = FastAPI(title="AI Commerce Agent", version="0.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/products")
async def get_products(category: Optional[str] = None, q: Optional[str] = None):
    results = PRODUCTS[:]
    if category:
        results = [p for p in results if p.get("category", "").lower() == category.lower()]
    if q:
        q_lower = q.lower()
        results = [
            p for p in results
            if q_lower in p.get("title", "").lower()
            or q_lower in p.get("brand", "").lower()
            or q_lower in p.get("description", "").lower()
        ]
    return results

@app.get("/api/products/{product_id}")
async def get_product_by_id(product_id: str):
    product = PRODUCTS_BY_ID.get(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.get("/api/products/slug/{slug}")
async def get_product_by_slug(slug: str):
    for p in PRODUCTS:
        if p.get("slug") == slug:
            return p
    raise HTTPException(status_code=404, detail="Product not found")

@app.get("/api/categories")
async def get_categories():
    categories = sorted(set(p.get("category") for p in PRODUCTS if p.get("category")))
    return categories

# ---- Cart endpoints (with session) ----
@app.get("/api/cart")
async def get_cart(session_id: str = Header(...)):
    cart = load_cart(session_id)
    return get_cart_summary(cart, PRODUCTS_BY_ID)

class AddCartItem(BaseModel):
    product_id: str
    quantity: int = 1
    selections: Optional[Dict[str, str]] = None

@app.post("/api/cart/add")
async def add_cart_item(item: AddCartItem, session_id: str = Header(...)):
    result = update_cart_action(
        session_id=session_id,
        action="add",
        product_id=item.product_id,
        quantity=item.quantity,
        selections=item.selections,
        products_by_id=PRODUCTS_BY_ID
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    cart = load_cart(session_id)
    return get_cart_summary(cart, PRODUCTS_BY_ID)

@app.delete("/api/cart/items/{cart_item_id}")
async def remove_cart_item(cart_item_id: str, session_id: str = Header(...)):
    result = update_cart_action(
        session_id=session_id,
        action="remove",
        cart_item_id=cart_item_id,
        products_by_id=PRODUCTS_BY_ID
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    cart = load_cart(session_id)
    return get_cart_summary(cart, PRODUCTS_BY_ID)

class UpdateCartItem(BaseModel):
    quantity: Optional[int] = None
    selections: Optional[Dict[str, str]] = None

@app.put("/api/cart/items/{cart_item_id}")
async def update_cart_item(cart_item_id: str, update: UpdateCartItem, session_id: str = Header(...)):
    if update.quantity is not None:
        result = update_cart_action(
            session_id=session_id,
            action="update_quantity",
            cart_item_id=cart_item_id,
            quantity=update.quantity,
            products_by_id=PRODUCTS_BY_ID
        )
    elif update.selections is not None:
        result = update_cart_action(
            session_id=session_id,
            action="update_selections",
            cart_item_id=cart_item_id,
            selections=update.selections,
            products_by_id=PRODUCTS_BY_ID
        )
    else:
        raise HTTPException(status_code=400, detail="No update fields provided")
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    cart = load_cart(session_id)
    return get_cart_summary(cart, PRODUCTS_BY_ID)

@app.delete("/api/cart")
async def clear_cart(session_id: str = Header(...)):
    clear_cart(session_id)
    return {"status": "cleared"}

# ---- Checkout endpoint ----
@app.post("/api/checkout")
async def checkout(session_id: str = Header(...)):
    cart = load_cart(session_id)
    if not cart:
        raise HTTPException(status_code=400, detail="Cart is empty")
    order = create_order_from_cart(session_id, PRODUCTS_BY_ID)
    if "error" in order:
        raise HTTPException(status_code=400, detail=order["error"])
    return order

# ---- Order endpoints ----
@app.get("/api/orders")
async def get_orders(session_id: str = Header(...)):
    return load_orders(session_id)

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str, session_id: str = Header(...)):
    orders = load_orders(session_id)
    for o in orders:
        if o["id"] == order_id:
            return o
    raise HTTPException(status_code=404, detail="Order not found")

# ---- Chat endpoints ----
@app.post("/api/chat/stream")
async def chat_stream_endpoint(req: ChatRequest, session_id: str = Header(...)):
    async def event_generator():
        queue = asyncio.Queue()

        def token_callback(token: str):
            queue.put_nowait({"type": "token", "data": token})

        def run():
            try:
                result = process_chat_streaming(req.messages, token_callback, session_id)
                queue.put_nowait({"type": "done", "data": result})
            except Exception as e:
                queue.put_nowait({"type": "error", "data": str(e)})

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, run)

        while True:
            try:
                item = await queue.get()
                if item["type"] == "token":
                    yield f"event: token\ndata: {json.dumps({'token': item['data']})}\n\n"
                elif item["type"] == "done":
                    result = item["data"]
                    yield f"event: done\ndata: {json.dumps(result)}\n\n"
                    break
                elif item["type"] == "error":
                    yield f"event: error\ndata: {json.dumps({'error': item['data']})}\n\n"
                    break
            except asyncio.CancelledError:
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest, session_id: str = Header(...)):
    try:
        collected = []
        def collect(token):
            collected.append(token)
        result = process_chat_streaming(req.messages, collect, session_id)
        return ChatResponse(
            content=result["content"],
            productCards=result["productCards"],
            cart=result.get("cart")
        )
    except Exception as e:
        print(f"Error in /api/chat: {e}")
        return ChatResponse(content="I'm sorry, I encountered an issue.", productCards=None)