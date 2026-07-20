# -*- coding: utf-8 -*-
import sqlite3
import os
import json

def export_data():
    # Paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'db', 'izakaya.db')
    api_dir = os.path.join(base_dir, 'api')
    
    os.makedirs(api_dir, exist_ok=True)
    
    # Check if database exists
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        print("Please run db_init.py first to initialize the database.")
        return

    # Connect to SQLite database
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Fetch menu_items
    try:
        cursor.execute("SELECT * FROM menu_items ORDER BY id ASC")
        rows = cursor.fetchall()
        
        menu_items = []
        for row in rows:
            menu_items.append({
                "id": row["id"],
                "item_id": row["item_id"],
                "category": row["category"],
                "badge": row["badge"],
                "badge_en": row["badge_en"],
                "title": row["title"],
                "title_en": row["title_en"],
                "price": row["price"],
                "tax_price": row["tax_price"],
                "price_display": row["price_display"],
                "price_display_en": row["price_display_en"],
                "tax_display": row["tax_display"],
                "tax_display_en": row["tax_display_en"],
                "description": row["description"],
                "description_en": row["description_en"],
                "sake_tag": row["sake_tag"],
                "sake_tag_en": row["sake_tag_en"],
                "sake_image": row["sake_image"],
                "is_recommend_en": row["is_recommend_en"],
                "sake_website": row["sake_website"],
                "sake_website_en": row["sake_website_en"]
            })
            
        menu_json_path = os.path.join(api_dir, 'menu.json')
        with open(menu_json_path, 'w', encoding='utf-8') as f:
            json.dump(menu_items, f, ensure_ascii=False, indent=2)
        print(f"Successfully exported {len(menu_items)} menu items to {menu_json_path}")
        
    except Exception as e:
        print(f"Failed to export menu items: {e}")

    # 2. Fetch sake items
    try:
        cursor.execute("SELECT * FROM menu_items WHERE category = 'jizake' ORDER BY id ASC")
        rows = cursor.fetchall()
        
        sake_items = []
        for row in rows:
            sake_items.append({
                "id": row["id"],
                "item_id": row["item_id"],
                "tag": row["sake_tag"],
                "tag_en": row["sake_tag_en"],
                "name": row["title"],
                "name_en": row["title_en"],
                "description": row["description"] or "",
                "description_en": row["description_en"] or "",
                "price_display": row["price_display"],
                "price_display_en": row["price_display_en"],
                "tax_display": row["tax_display"],
                "tax_display_en": row["tax_display_en"],
                "image_src": row["sake_image"],
                "is_recommend_en": row["is_recommend_en"],
                "website": row["sake_website"],
                "website_en": row["sake_website_en"]
            })
            
        sake_json_path = os.path.join(api_dir, 'sake.json')
        with open(sake_json_path, 'w', encoding='utf-8') as f:
            json.dump(sake_items, f, ensure_ascii=False, indent=2)
        print(f"Successfully exported {len(sake_items)} sake items to {sake_json_path}")
        
    except Exception as e:
        print(f"Failed to export sake items: {e}")

    # 3. Fetch daily_specials
    try:
        cursor.execute("SELECT * FROM daily_specials ORDER BY is_active DESC, id ASC")
        rows = cursor.fetchall()
        
        specials_items = []
        for row in rows:
            specials_items.append({
                "id": row["id"],
                "title": row["title"],
                "title_en": row["title_en"],
                "price": row["price"],
                "tax_price": row["tax_price"],
                "price_display": row["price_display"],
                "price_display_en": row["price_display_en"],
                "tax_display": row["tax_display"],
                "tax_display_en": row["tax_display_en"],
                "is_active": row["is_active"]
            })
            
        specials_json_path = os.path.join(api_dir, 'daily_specials.json')
        with open(specials_json_path, 'w', encoding='utf-8') as f:
            json.dump(specials_items, f, ensure_ascii=False, indent=2)
        print(f"Successfully exported {len(specials_items)} daily specials to {specials_json_path}")
        
    except Exception as e:
        print(f"Failed to export daily specials: {e}")

    conn.close()

if __name__ == '__main__':
    export_data()
