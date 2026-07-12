# -*- coding: utf-8 -*-
import sqlite3
import os
import json

db_dir = os.path.join(os.path.dirname(__file__), 'db')
os.makedirs(db_dir, exist_ok=True)
db_path = os.path.join(db_dir, 'izakaya.db')

MENU_ITEMS_JSON = '''[
    {
        "item_id": "menu-item-dashimaki",
        "category": "alacarte",
        "badge": "もちろん手作り",
        "title": "だし巻き玉子",
        "price": 350,
        "tax_price": 385,
        "price_display": "350円",
        "tax_display": "(税込385円)",
        "description": "一休職人がご注文を頂いてから丁寧に焼き上げる、出汁の効いた優しい手作り玉子焼き。"
    },
    {
        "item_id": "menu-item-hiyayakko",
        "category": "alacarte",
        "badge": "まずはこれから!?",
        "title": "冷やっこ",
        "price": 280,
        "tax_price": 308,
        "price_display": "280円",
        "tax_display": "(税込308円)",
        "description": "ひんやり冷たくさっぱりとした、定番のスピードおつまみ。"
    },
    {
        "item_id": "menu-item-edamame",
        "category": "alacarte",
        "badge": "とりあえずの",
        "title": "枝豆",
        "price": 280,
        "tax_price": 308,
        "price_display": "280円",
        "tax_display": "(税込308円)",
        "description": "ビールに欠かせない、ほどよい塩加減の茹でたて枝豆。"
    },
    {
        "item_id": "menu-item-tokusen-salad",
        "category": "alacarte",
        "badge": "一番人気",
        "title": "一休特選サラダ",
        "price": 420,
        "tax_price": 462,
        "price_display": "420円",
        "tax_display": "(税込462円)",
        "description": "新鮮な野菜をたっぷり使った、店主こだわりの当店人気No.1サラダ。"
    },
    {
        "item_id": "menu-item-kizushi",
        "category": "alacarte",
        "badge": null,
        "title": "キズシ",
        "price": 400,
        "tax_price": 440,
        "price_display": "400円",
        "tax_display": "(税込440円)",
        "description": "絶妙な塩と酢の加減で締めた、日本酒に抜群に合う伝統の味わい。"
    },
    {
        "item_id": "menu-item-tataki",
        "category": "alacarte",
        "badge": null,
        "title": "地鶏のたたき",
        "price": 400,
        "tax_price": 440,
        "price_display": "400円",
        "tax_display": "(税込440円)",
        "description": "新鮮な地鶏の表面を香ばしく炙り、旨味をギュッと閉じ込めました。"
    },
    {
        "item_id": "menu-item-mizugyoza",
        "category": "alacarte",
        "badge": "ごま油がたまらない！",
        "title": "水ギョーザ",
        "price": 350,
        "tax_price": 385,
        "price_display": "350円",
        "tax_display": "(税込385円)",
        "description": "もっちりした皮に包まれた餃子をさっぱり特製スープと香ばしいごま油でどうぞ。"
    },
    {
        "item_id": "menu-item-karaage",
        "category": "fry",
        "badge": null,
        "title": "若鶏の唐揚げ",
        "price": 450,
        "tax_price": 495,
        "price_display": "450円",
        "tax_display": "(税込495円)",
        "description": "中はジューシー、外はサクサク。秘伝のタレに漬け込んだ大人気唐揚げ。"
    },
    {
        "item_id": "menu-item-croquette",
        "category": "fry",
        "badge": "すべて手作りです",
        "title": "特製コロッケ",
        "price": 380,
        "tax_price": 418,
        "price_display": "380円",
        "tax_display": "(税込418円)",
        "description": "じゃがいもの甘味とひき肉のバランスが絶妙な、まごころ込めた手作りコロッケ。"
    },
    {
        "item_id": "menu-item-surume",
        "category": "fry",
        "badge": "かめばかむほど",
        "title": "スルメの天ぷら",
        "price": 400,
        "tax_price": 440,
        "price_display": "400円",
        "tax_display": "(税込440円)",
        "description": "旨味が凝縮されたスルメを薄衣でサクッと揚げた、お酒が進む逸品。"
    },
    {
        "item_id": "menu-item-isobe",
        "category": "fry",
        "badge": null,
        "title": "ちくわの磯辺揚げ",
        "price": 300,
        "tax_price": 330,
        "price_display": "300円",
        "tax_display": "(税込330円)",
        "description": "磯の香りがふわっと広がる、ふっくらモチモチ食感のちくわ揚げ。"
    },
    {
        "item_id": "menu-item-kushikatsu",
        "category": "fry",
        "badge": null,
        "title": "串カツ盛り合わせ",
        "price": 450,
        "tax_price": 495,
        "price_display": "450円",
        "tax_display": "(税込495円)",
        "description": "肉や野菜をカラッと揚げた、大阪・北浜ならではのサクサク串カツ盛合せ。"
    },
    {
        "item_id": "menu-item-yakigyoza",
        "category": "grill",
        "badge": null,
        "title": "焼きギョーザ",
        "price": 300,
        "tax_price": 330,
        "price_display": "300円",
        "tax_display": "(税込330円)",
        "description": "皮はパリッと香ばしく、餡はジューシーな王道焼き餃子。"
    },
    {
        "item_id": "menu-item-jakoten",
        "category": "grill",
        "badge": "宇和島名産じゃこ天",
        "title": "さつま揚げ",
        "price": 330,
        "tax_price": 363,
        "price_display": "330円",
        "tax_display": "(税込363円)",
        "description": "魚の旨みがギュッと詰まった愛媛宇和島名産の本格じゃこ天。"
    },
    {
        "item_id": "menu-item-shogayaki",
        "category": "grill",
        "badge": null,
        "title": "豚肉の生姜焼",
        "price": 450,
        "tax_price": 495,
        "price_display": "450円",
        "tax_display": "(税込495円)",
        "description": "生姜の風味がピリッと効いた、甘辛タレでご飯もお酒も進むスタミナ焼き。"
    },
    {
        "item_id": "menu-item-butakimchi",
        "category": "grill",
        "badge": null,
        "title": "豚キムチ",
        "price": 380,
        "tax_price": 418,
        "price_display": "380円",
        "tax_display": "(税込418円)",
        "description": "シャキシャキのキムチと旨味あふれる豚肉を強火で炒めた元気が出る一品。"
    },
    {
        "item_id": "menu-item-nasumiso",
        "category": "grill",
        "badge": null,
        "title": "なすの味噌炒め",
        "price": 350,
        "tax_price": 385,
        "price_display": "350円",
        "tax_display": "(税込385円)",
        "description": "トロトロのナスにコク深い特製甘辛味噌をじっくり絡めました。"
    },
    {
        "item_id": "menu-item-torinabe",
        "category": "meal",
        "badge": null,
        "title": "さっぱり鶏鍋",
        "price": 520,
        "tax_price": 572,
        "price_display": "520円",
        "tax_display": "(税込572円)",
        "description": "鶏肉の滋味深い出汁と野菜の甘みが溶け込んだ、ほっと落ち着くミニ鍋。"
    },
    {
        "item_id": "menu-item-kimchinabe",
        "category": "meal",
        "badge": null,
        "title": "キムチ鍋",
        "price": 520,
        "tax_price": 572,
        "price_display": "520円",
        "tax_display": "(税込572円)",
        "description": "ほどよい辛さのキムチスープが具材に染み渡る、身体が温まる旨辛ミニ鍋。"
    },
    {
        "item_id": "menu-item-yakiudon",
        "category": "meal",
        "badge": null,
        "title": "焼うどん",
        "price": 400,
        "tax_price": 440,
        "price_display": "400円",
        "tax_display": "(税込440円)",
        "description": "もちもちのうどんを香ばしい醤油と鰹節で仕上げたシメの定番。"
    },
    {
        "item_id": "menu-item-onigiri",
        "category": "meal",
        "badge": null,
        "title": "田舎おにぎり (2ヶ)",
        "price": 320,
        "tax_price": 352,
        "price_display": "320円",
        "tax_display": "(税込352円)",
        "description": "ふっくら握った大きな温かおにぎり。"
    },
    {
        "item_id": "menu-item-saketyazuke",
        "category": "meal",
        "badge": null,
        "title": "さけ茶漬け",
        "price": 320,
        "tax_price": 352,
        "price_display": "320円",
        "tax_display": "(税込352円)",
        "description": "鮭フレークの塩味とあたたかいお茶出汁がさらりと喉を通る極上シメ茶漬け。"
    },
    {
        "item_id": "menu-item-draft-medium",
        "category": "drink",
        "badge": null,
        "title": "アサヒスーパードライ 生ビール (中)",
        "price": 450,
        "tax_price": 495,
        "price_display": "450円",
        "tax_display": "(税込495円)",
        "description": "きめ細かな泡と抜群のキレ。一休自慢の冷え冷えジョッキビール。"
    },
    {
        "item_id": "menu-item-draft-large",
        "category": "drink",
        "badge": null,
        "title": "アサヒスーパードライ 生ビール (大)",
        "price": 750,
        "tax_price": 825,
        "price_display": "750円",
        "tax_display": "(税込825円)",
        "description": "たっぷりのボリュームで乾杯に最適。豪快に飲める大容量ジョッキ。"
    },
    {
        "item_id": "menu-item-sake-glass",
        "category": "drink",
        "badge": null,
        "title": "徳利 (小・一合) / (大・二合)",
        "price": 330,
        "tax_price": 363,
        "price_display": "330円〜",
        "tax_display": "(税込363円〜)",
        "description": "熱燗・ぬる燗・冷酒からお好きな飲み方をお選びいただけます。(小 330円/大 640円)"
    },
    {
        "item_id": "menu-item-sake-special",
        "category": "drink",
        "badge": "厳選地酒 480円〜",
        "title": "一休厳選 地酒銘柄各種",
        "price": 480,
        "tax_price": 528,
        "price_display": "480円〜",
        "tax_display": "(税込528円〜)",
        "description": "剣菱、土佐鶴、辛丹波（各 480円/税込528円）、呉春、久保田千寿（各 580円/税込638円）。"
    },
    {
        "item_id": "menu-item-keep-sho",
        "category": "drink",
        "badge": "10本毎に1本サービス",
        "title": "焼酎ボトルキープ 小 (900ml)",
        "price": 2200,
        "tax_price": 2420,
        "price_display": "各 2,200円",
        "tax_display": "(税込2,420円)",
        "description": "いいちこ(麦)、二階堂(麦)、さつま白波(芋)、紫尾の露(芋)。いつでも保管いたします。"
    },
    {
        "item_id": "menu-item-keep-dai",
        "category": "drink",
        "badge": "10本毎に1本サービス",
        "title": "焼酎ボトルキープ 大 (1800ml)",
        "price": 4200,
        "tax_price": 4620,
        "price_display": "各 4,200円",
        "tax_display": "(税込4,620円)",
        "description": "いいちこ(麦)、二階堂(麦)、さつま白波(芋)、黒霧島(芋)、ぼっけもん(芋)、紫尾の露(芋)。"
    },
    {
        "item_id": "menu-item-highball",
        "category": "drink",
        "badge": null,
        "title": "ハイボール",
        "price": 400,
        "tax_price": 440,
        "price_display": "400円",
        "tax_display": "(税込440円)",
        "description": "シュワっと強炭酸でキレのある、食事にぴったりの王道ウイスキーハイボール。"
    },
    {
        "item_id": "menu-item-chuhai",
        "category": "drink",
        "badge": null,
        "title": "チューハイ (レモン/ライム/カルピス/ゆず他)",
        "price": 380,
        "tax_price": 418,
        "price_display": "各 380円",
        "tax_display": "(税込418円)",
        "description": "レモン、ライム、カルピス、巨峰、ゆず、ウーロンハイから選べる爽快チューハイ。"
    }
]'''
SAKE_ITEMS_JSON = '''[
    {
        "item_id": "sake-kenbishi",
        "tag": "兵庫県・芳醇旨口",
        "name": "剣菱",
        "description": "五百有余年の歴史が育む、米の旨みを極限まで引き出した濃醇な一杯。",
        "price_display": "一合 480円",
        "tax_display": "(税込528円)",
        "image_src": "assets/sake_kenbishi.png"
    },
    {
        "item_id": "sake-tosatsuru",
        "tag": "高知県・淡麗辛口",
        "name": "土佐鶴",
        "description": "すっきりとした鋭いキレ味と爽やかな香りで、どんな料理をも引き立てます。",
        "price_display": "一合 480円",
        "tax_display": "(税込528円)",
        "image_src": "assets/sake_tosatsuru.png"
    },
    {
        "item_id": "sake-karatanba",
        "tag": "兵庫県・淡麗辛口",
        "name": "辛丹波",
        "description": "冷やから熱燗まで美味しく頂ける、引き締まった辛さとコクの本格辛口。",
        "price_display": "一合 480円",
        "tax_display": "(税込528円)",
        "image_src": "assets/sake_karatanba.png"
    },
    {
        "item_id": "sake-goshun",
        "tag": "大阪府・旨口",
        "name": "呉春",
        "description": "まろやかで優しい口当たり。地元大阪の銘醸地・池田で愛される幻の銘柄。",
        "price_display": "一合 580円",
        "tax_display": "(税込638円)",
        "image_src": "assets/sake_goshun.png"
    },
    {
        "item_id": "sake-kubota",
        "tag": "新潟県・淡麗辛口",
        "name": "久保田 (千寿)",
        "description": "日本酒の最高峰。ふわりと滑らかに喉を通り抜ける、澄んだ上品な薫り高き逸品。",
        "price_display": "一合 580円",
        "tax_display": "(税込638円)",
        "image_src": "assets/sake_kubota.png"
    }
]'''

def init_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create menu_items table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        badge TEXT,
        title TEXT NOT NULL,
        price INTEGER,
        tax_price INTEGER,
        price_display TEXT NOT NULL,
        tax_display TEXT NOT NULL,
        description TEXT
    )
    ''')

    # Create sake_items table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sake_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT UNIQUE NOT NULL,
        tag TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price_display TEXT NOT NULL,
        tax_display TEXT NOT NULL,
        image_src TEXT NOT NULL
    )
    ''')

    menu_items = json.loads(MENU_ITEMS_JSON)
    sake_items = json.loads(SAKE_ITEMS_JSON)

    # Insert menu items
    for item in menu_items:
        cursor.execute('''
        INSERT OR REPLACE INTO menu_items 
        (item_id, category, badge, title, price, tax_price, price_display, tax_display, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            item['item_id'],
            item['category'],
            item['badge'],
            item['title'],
            item['price'],
            item['tax_price'],
            item['price_display'],
            item['tax_display'],
            item['description']
        ))

    # Insert sake items
    for item in sake_items:
        cursor.execute('''
        INSERT OR REPLACE INTO sake_items 
        (item_id, tag, name, description, price_display, tax_display, image_src)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            item['item_id'],
            item['tag'],
            item['name'],
            item['description'],
            item['price_display'],
            item['tax_display'],
            item['image_src']
        ))

    conn.commit()
    conn.close()
    print("Database initialized successfully at:", db_path)

if __name__ == '__main__':
    init_db()
