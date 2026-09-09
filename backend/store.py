import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from db import supabase

# ---- Cart functions ----

def load_cart(session_id: str) -> List[Dict[str, Any]]:
    """Load cart items for a session."""
    try:
        resp = supabase.table('carts').select('items').eq('session_id', session_id).execute()
        if resp.data and len(resp.data) > 0:
            return resp.data[0]['items']
        return []
    except Exception as e:
        print(f"Error loading cart: {e}")
        return []

def save_cart(session_id: str, items: List[Dict[str, Any]]) -> None:
    """Save cart items for a session (upsert)."""
    try:
        data = {
            'session_id': session_id,
            'items': items,
            'updated_at': datetime.utcnow().isoformat()
        }
        supabase.table('carts').upsert(data, on_conflict='session_id').execute()
    except Exception as e:
        print(f"Error saving cart: {e}")
        raise

def clear_cart(session_id: str) -> None:
    """Delete cart for a session."""
    try:
        supabase.table('carts').delete().eq('session_id', session_id).execute()
    except Exception as e:
        print(f"Error clearing cart: {e}")
        raise

# ---- Order functions ----

def load_orders(session_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Load orders, optionally filtered by session."""
    try:
        query = supabase.table('orders').select('order_data')
        if session_id:
            query = query.eq('session_id', session_id)
        resp = query.execute()
        if resp.data:
            return [item['order_data'] for item in resp.data]
        return []
    except Exception as e:
        print(f"Error loading orders: {e}")
        return []

def save_order(order: Dict[str, Any]) -> None:
    """Insert a new order."""
    try:
        data = {
            'id': order['id'],
            'session_id': order['session_id'],
            'order_data': order,
            'created_at': datetime.utcnow().isoformat()
        }
        supabase.table('orders').insert(data).execute()
    except Exception as e:
        print(f"Error saving order: {e}")
        raise

# ---- Cart summary (unchanged logic) ----

def get_cart_summary(cart: List[Dict[str, Any]], products_by_id: Dict[str, Dict]) -> Dict[str, Any]:
    items = []
    total = 0.0
    total_quantity = 0
    for item in cart:
        product = products_by_id.get(item["product_id"])
        if not product:
            continue
        price = product.get("price", 0)
        qty = item.get("quantity", 1)
        subtotal = price * qty
        total += subtotal
        total_quantity += qty
        items.append({
            "cart_item_id": item["id"],
            "product_id": item["product_id"],
            "title": product.get("title", ""),
            "quantity": qty,
            "price": price,
            "subtotal": subtotal,
            "selections": item.get("selections", {})
        })
    return {
        "items": items,
        "total_items": len(items),
        "total_quantity": total_quantity,
        "total_price": round(total, 2)
    }

# ---- Cart actions ----

def update_cart_action(
    session_id: str,
    action: str,
    product_id: Optional[str] = None,
    cart_item_id: Optional[str] = None,
    quantity: Optional[int] = None,
    selections: Optional[Dict] = None,
    products_by_id: Optional[Dict[str, Dict]] = None
) -> Dict[str, Any]:
    """Modify the cart in Supabase."""
    cart = load_cart(session_id)
    if action == "add":
        if not product_id or product_id not in products_by_id:
            return {"error": f"Product {product_id} not found"}
        product = products_by_id[product_id]
        if selections:
            if "color" in selections and "colors" in product:
                if selections["color"] not in product["colors"]:
                    return {"error": f"Color '{selections['color']}' not available"}
        new_item = {
            "id": str(uuid.uuid4()),
            "product_id": product_id,
            "quantity": quantity or 1,
            "selections": selections or {}
        }
        cart.append(new_item)
        save_cart(session_id, cart)
        return {"status": "added", "cart_item_id": new_item["id"]}

    elif action == "remove":
        if not cart_item_id:
            return {"error": "cart_item_id required for remove"}
        new_cart = [item for item in cart if item["id"] != cart_item_id]
        if len(new_cart) == len(cart):
            return {"error": f"Item {cart_item_id} not found"}
        save_cart(session_id, new_cart)
        return {"status": "removed"}

    elif action == "update_quantity":
        if not cart_item_id:
            return {"error": "cart_item_id required for update_quantity"}
        if quantity is None or quantity < 1:
            return {"error": "quantity must be a positive integer"}
        for item in cart:
            if item["id"] == cart_item_id:
                item["quantity"] = quantity
                save_cart(session_id, cart)
                return {"status": "quantity_updated", "cart_item_id": cart_item_id, "quantity": quantity}
        return {"error": f"Item {cart_item_id} not found"}

    elif action == "update_selections":
        if not cart_item_id:
            return {"error": "cart_item_id required for update_selections"}
        if not selections:
            return {"error": "selections must be provided"}
        for item in cart:
            if item["id"] == cart_item_id:
                product = products_by_id.get(item["product_id"])
                if product and "color" in selections and "colors" in product:
                    if selections["color"] not in product["colors"]:
                        return {"error": f"Color '{selections['color']}' not available"}
                item["selections"] = selections
                save_cart(session_id, cart)
                return {"status": "selections_updated", "cart_item_id": cart_item_id, "selections": selections}
        return {"error": f"Item {cart_item_id} not found"}

    elif action == "clear":
        clear_cart(session_id)
        return {"status": "cleared"}

    else:
        return {"error": f"Unknown action '{action}'"}

# ---- Checkout ----

def create_order_from_cart(session_id: str, products_by_id: Dict[str, Dict]) -> Dict[str, Any]:
    cart = load_cart(session_id)
    if not cart:
        return {"error": "Cart is empty"}
    order_items = []
    total = 0.0
    for item in cart:
        product = products_by_id.get(item["product_id"])
        if not product:
            continue
        price = product.get("price", 0)
        qty = item.get("quantity", 1)
        subtotal = price * qty
        total += subtotal
        order_items.append({
            "product_id": item["product_id"],
            "title": product.get("title", ""),
            "quantity": qty,
            "price": price,
            "subtotal": subtotal,
            "selections": item.get("selections", {})
        })
    # Load existing orders to generate a simple ID
    existing = load_orders()  # all orders, but we only need count for ID
    order_id = f"NX-{len(existing) + 1001}"
    order = {
        "id": order_id,
        "session_id": session_id,
        "date": datetime.utcnow().isoformat(),
        "status": "Processing",
        "total": round(total, 2),
        "items": order_items,
        "delivery": {
            "status": "Processing",
            "estimated_delivery": (datetime.utcnow().replace(day=datetime.utcnow().day + 7)).isoformat(),
            "tracking_number": None,
            "last_update": datetime.utcnow().isoformat()
        }
    }
    save_order(order)
    clear_cart(session_id)
    return order