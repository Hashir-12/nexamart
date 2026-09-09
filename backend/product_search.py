import re
from typing import List, Dict, Any, Optional

def search_products(
    products: List[Dict[str, Any]],
    query: Optional[str] = None,
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    features: Optional[List[str]] = None,
    keywords: Optional[List[str]] = None,
    colors: Optional[List[str]] = None,
    brands: Optional[List[str]] = None,
    min_rating: Optional[float] = None,
    in_stock: Optional[bool] = None,
    excluded: Optional[List[str]] = None,
    limit: int = 5,
    sort: Optional[str] = "relevance"
) -> List[Dict[str, Any]]:
    """
    Search the product catalog with flexible criteria.
    Returns a list of full product objects that match the filters,
    sorted and limited.
    """
    # Start with all products
    results = products[:]

    # ----- Filters -----
    if category:
        results = [p for p in results if p.get("category", "").lower() == category.lower()]
    if subcategory:
        results = [p for p in results if p.get("subcategory", "").lower() == subcategory.lower()]
    if min_price is not None:
        results = [p for p in results if p.get("price", 0) >= min_price]
    if max_price is not None:
        results = [p for p in results if p.get("price", 0) <= max_price]
    if min_rating is not None:
        results = [p for p in results if p.get("rating", 0) >= min_rating]
    if in_stock is not None:
        results = [p for p in results if p.get("stock", 0) > 0] if in_stock else results

    # Colors: product must have at least one matching color
    if colors:
        def has_color(p):
            p_colors = p.get("colors", [])
            if not p_colors:
                return False
            return any(c.lower() in [col.lower() for col in p_colors] for c in colors)
        results = [p for p in results if has_color(p)]

    # Brands
    if brands:
        results = [p for p in results if p.get("brand", "").lower() in [b.lower() for b in brands]]

    # Exclude specific product IDs
    if excluded:
        excluded_set = set(str(x) for x in excluded)
        results = [p for p in results if str(p["id"]) not in excluded_set]

    # ----- Relevance scoring (if sort == "relevance") -----
    if sort == "relevance":
        # Pre-process query terms
        query_terms = []
        if query:
            query_terms = re.findall(r'\w+', query.lower())
        # Build combined text for each product and compute scores
        scored = []
        for p in results:
            score = 0.0
            title = p.get("title", "").lower()
            description = p.get("description", "").lower()
            combined_text = title + " " + description

            # 1. Title match (high weight)
            if query_terms:
                title_match_count = sum(1 for term in query_terms if term in title)
                score += title_match_count * 10.0

                # Exact phrase in title? (e.g., "good camera")
                if query and query.lower() in title:
                    score += 20.0

                # Description match
                desc_match_count = sum(1 for term in query_terms if term in description)
                score += desc_match_count * 4.0

                # If query is multi-word, check for full phrase in description
                if query and query.lower() in description:
                    score += 8.0

            # 2. Category bonus (if category filter applied)
            if category and p.get("category", "").lower() == category.lower():
                score += 15.0

            # 3. Feature matches
            if features and p.get("features"):
                p_features = [f.lower() for f in p.get("features", [])]
                for f in features:
                    if f.lower() in p_features:
                        score += 12.0
                    elif f.lower() in combined_text:
                        score += 6.0

            # 4. Keyword matches (additional)
            if keywords:
                for kw in keywords:
                    if kw.lower() in combined_text:
                        score += 5.0

            # 5. Rating boost
            rating = p.get("rating", 0)
            if rating:
                score += rating * 2.0  # rating up to 5 => +10

            # 6. Price suitability: if query suggests "budget" or "cheap", boost lower prices
            if query and any(word in query.lower() for word in ["budget", "cheap", "affordable", "under"]):
                price = p.get("price", float('inf'))
                if price < 500:
                    score += 5.0

            scored.append((score, p))

        # Sort descending by score
        scored.sort(key=lambda x: x[0], reverse=True)
        results = [p for _, p in scored]

    else:
        # Other sorts: price_asc, price_desc, rating_desc
        if sort == "price_asc":
            results.sort(key=lambda p: p.get("price", float('inf')))
        elif sort == "price_desc":
            results.sort(key=lambda p: p.get("price", 0), reverse=True)
        elif sort == "rating_desc":
            results.sort(key=lambda p: p.get("rating", 0), reverse=True)

    # Apply limit (max 20)
    return results[:min(limit, 20)]