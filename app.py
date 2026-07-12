# -*- coding: utf-8 -*-
from flask import Flask, jsonify, send_from_directory
import sqlite3
import os

app = Flask(__name__, static_folder='.', static_url_path='')

# データベースファイルの絶対パスを取得
DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db', 'izakaya.db')

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/menu')
def get_menu():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM menu_items ORDER BY id ASC")
        rows = cursor.fetchall()
        conn.close()
        
        menu_items = []
        for row in rows:
            menu_items.append({
                "id": row["id"],
                "item_id": row["item_id"],
                "category": row["category"],
                "badge": row["badge"],
                "title": row["title"],
                "price": row["price"],
                "tax_price": row["tax_price"],
                "price_display": row["price_display"],
                "tax_display": row["tax_display"],
                "description": row["description"],
                "sake_tag": row["sake_tag"],
                "sake_image": row["sake_image"]
            })
        response = jsonify(menu_items)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
    except Exception as e:
        response = jsonify({"error": str(e)})
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response, 500

@app.route('/api/sake')
def get_sake():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM menu_items WHERE category = 'jizake' ORDER BY id ASC")
        rows = cursor.fetchall()
        conn.close()
        
        sake_items = []
        for row in rows:
            sake_items.append({
                "id": row["id"],
                "item_id": row["item_id"],
                "tag": row["sake_tag"],
                "name": row["title"],
                "description": row["description"] or "",
                "price_display": row["price_display"],
                "tax_display": row["tax_display"],
                "image_src": row["sake_image"]
            })
        response = jsonify(sake_items)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
    except Exception as e:
        response = jsonify({"error": str(e)})
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response, 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
