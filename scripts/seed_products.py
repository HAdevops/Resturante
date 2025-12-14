import requests
import os

API_URL = os.popen("grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2").read().strip()

# Login
login_res = requests.post(f"{API_URL}/api/auth/login", json={"email": "admin@odelices.fr", "password": "admin123"})
TOKEN = login_res.json()["token"]
headers = {"Authorization": f"Bearer {TOKEN}"}

# Get categories
cats_res = requests.get(f"{API_URL}/api/menu/categories", headers=headers)
categories = {c["nom"]: c["id"] for c in cats_res.json()}
print("Categories:", categories)

# Products to create - organized by category
products = [
    # TACOS
    {"nom": "Tacos 1 Viande", "description": "1 viande au choix, frites, sauce fromagère", "prix": 9.00, "category": "Tacos", "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80"},
    {"nom": "Tacos 2 Viandes", "description": "2 viandes au choix, frites, sauce fromagère", "prix": 9.90, "category": "Tacos", "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80"},
    {"nom": "Tacos 3 Viandes", "description": "3 viandes au choix, frites, sauce fromagère", "prix": 11.90, "category": "Tacos", "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80"},
    {"nom": "Tacos 4 Viandes", "description": "4 viandes au choix, frites, sauce fromagère", "prix": 13.90, "category": "Tacos", "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80"},
    {"nom": "Menu Tacos 1", "description": "1 viande + frites + boisson", "prix": 9.90, "category": "Tacos", "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80"},
    {"nom": "Menu Tacos 2", "description": "2 viandes + frites + boisson", "prix": 10.90, "category": "Tacos", "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80"},
    {"nom": "Menu Tacos 3", "description": "3 viandes + frites + boisson", "prix": 12.90, "category": "Tacos", "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80"},
    
    # BURGERS
    {"nom": "Cheese Burger", "description": "Steak, cheddar", "prix": 7.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80"},
    {"nom": "Double Cheese Burger", "description": "2 steaks, 2 cheddars", "prix": 8.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80"},
    {"nom": "Triple Cheese Burger", "description": "3 steaks, 3 cheddars", "prix": 9.00, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80"},
    {"nom": "Bacon Cheese Burger", "description": "Bacon, steak, cheddar", "prix": 8.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80"},
    {"nom": "Chicken Burger", "description": "Escalope de poulet panée, cheddar", "prix": 8.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80"},
    {"nom": "Fish Burger", "description": "Poisson pané, cheddar", "prix": 8.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80"},
    {"nom": "Burger du Chef", "description": "Cheddar, cornichons, oeuf, oignons, tomates, salade, steak 90gr", "prix": 13.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80"},
    {"nom": "180° Burger", "description": "Steak 180gr, 2 cheddars", "prix": 10.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80"},
    {"nom": "360° Burger", "description": "Steak 360gr, cheddar", "prix": 12.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&q=80"},
    {"nom": "Monster Burger", "description": "Bacon, cheddar, oeuf, steak 180gr, galette de pomme de terre", "prix": 12.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1550317138-10000687a72b?w=600&q=80"},
    {"nom": "Le Boss Burger", "description": "Bacon, cheddar, oeuf, raclette AOP, steak boucher fait maison", "prix": 14.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&q=80"},
    {"nom": "Black Burger", "description": "Pain noir, cheddar, oeuf, oignons frits, steak du boucher", "prix": 12.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1604467707321-70d51c8bc9a4?w=600&q=80"},
    {"nom": "Raclette Burger", "description": "Cheddar, cornichons, oignons, raclette AOP, salade, steak", "prix": 13.00, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80"},
    {"nom": "Smash Burger", "description": "Cheddar, tomates, salade, steak du boucher smashé", "prix": 14.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80"},
    {"nom": "Burger Végétarien", "description": "Cheddar, galette végétarienne", "prix": 9.50, "category": "Burgers", "image_url": "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&q=80"},
    
    # SANDWICHS
    {"nom": "Sandwich Kebab", "description": "Salade, tomates, oignons frits, kebab", "prix": 9.50, "category": "Sandwichs", "image_url": "https://images.unsplash.com/photo-1644364935906-792b2245a2c0?w=600&q=80"},
    {"nom": "Sandwich Escalope", "description": "Salade, escalope de poulet, tomates, oignons frits, fromage", "prix": 9.50, "category": "Sandwichs", "image_url": "https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=600&q=80"},
    {"nom": "Sandwich Kefta", "description": "Salade, tomates, oignons frits, fromage, 2 kefta", "prix": 9.50, "category": "Sandwichs", "image_url": "https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=600&q=80"},
    {"nom": "Sandwich Américain", "description": "Salade, oeuf, tomates, oignons frits, fromage, 2 steaks", "prix": 9.50, "category": "Sandwichs", "image_url": "https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=600&q=80"},
    {"nom": "Sandwich Tenders", "description": "Salade, tomates, oignons frits, fromage, tenders", "prix": 12.50, "category": "Sandwichs", "image_url": "https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=600&q=80"},
    {"nom": "Sandwich Royal Kebab", "description": "Salade, cheddar, tomates, oignons frits, kebab, 2 steaks", "prix": 11.00, "category": "Sandwichs", "image_url": "https://images.unsplash.com/photo-1644364935906-792b2245a2c0?w=600&q=80"},
    {"nom": "Sandwich Castello", "description": "Salade, escalope, tomates, oignons frits, fromage, kebab, galette", "prix": 11.00, "category": "Sandwichs", "image_url": "https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=600&q=80"},
    {"nom": "Sandwich Merguez", "description": "Merguez, salade, tomates, oignons frits, fromage", "prix": 12.50, "category": "Sandwichs", "image_url": "https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=600&q=80"},
    {"nom": "Sandwich Big Foot", "description": "Bacon, salade, escalope, cheddar, tomates, oignons frits, kebab, 2 steaks", "prix": 11.00, "category": "Sandwichs", "image_url": "https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=600&q=80"},
    
    # PIZZAS
    {"nom": "Pizza Margherita", "description": "Tomate, fromage, origan", "prix": 8.00, "category": "Pizzas", "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80"},
    {"nom": "Pizza 4 Fromages", "description": "Mozzarella, chèvre, roquefort, cheddar", "prix": 9.00, "category": "Pizzas", "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80"},
    {"nom": "Pizza Kebab", "description": "Tomate, fromage, origan, poivrons, tomates fraîches, kebab", "prix": 9.00, "category": "Pizzas", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80"},
    {"nom": "Pizza Orientale", "description": "Tomate, fromage, oeuf, champignons, merguez", "prix": 9.00, "category": "Pizzas", "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80"},
    {"nom": "Pizza Reine", "description": "Jambon, tomate, fromage, champignons", "prix": 9.00, "category": "Pizzas", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80"},
    {"nom": "Pizza Savoyarde", "description": "Fromage, oeuf, oignons, lardons, pomme de terre, crème fraîche", "prix": 9.00, "category": "Pizzas", "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80"},
    {"nom": "Pizza Raclette", "description": "Fromage, jambon de dinde, pomme de terre, crème fraîche, fromage à raclette", "prix": 9.00, "category": "Pizzas", "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80"},
    {"nom": "Pizza Chicago", "description": "Viande hachée, fromage, oeuf, origan, crème fraîche, bacon, cheddar", "prix": 9.00, "category": "Pizzas", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80"},
    {"nom": "Pizza du Chef", "description": "Viande hachée, jambon, fromage, olives, poivrons, merguez", "prix": 10.00, "category": "Pizzas", "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80"},
    {"nom": "Pizza Calzone", "description": "Viande hachée ou jambon, pliée", "prix": 9.00, "category": "Pizzas", "image_url": "https://images.unsplash.com/photo-1536964549799-4678b6ed1192?w=600&q=80"},
    
    # ASSIETTES
    {"nom": "Assiette Kebab", "description": "Grillade à la pierre de lave avec crudités et frites", "prix": 13.50, "category": "Assiettes", "image_url": "https://images.unsplash.com/photo-1644364935906-792b2245a2c0?w=600&q=80"},
    {"nom": "Assiette Kefta", "description": "Grillade à la pierre de lave avec crudités et frites", "prix": 14.00, "category": "Assiettes", "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80"},
    {"nom": "Assiette Tenders", "description": "Tenders croustillants avec crudités et frites", "prix": 15.00, "category": "Assiettes", "image_url": "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80"},
    {"nom": "Assiette Merguez", "description": "Merguez grillées avec crudités et frites", "prix": 15.00, "category": "Assiettes", "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80"},
    {"nom": "Assiette Escalope", "description": "Escalope grillée avec crudités et frites", "prix": 15.00, "category": "Assiettes", "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80"},
    {"nom": "Assiette Royal", "description": "Mix de viandes avec crudités et frites", "prix": 18.00, "category": "Assiettes", "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80"},
    
    # SALADES
    {"nom": "Salade Verte", "description": "Maïs, salade, tomates", "prix": 5.00, "category": "Salades", "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80"},
    {"nom": "Salade Poulet", "description": "Maïs, poulet fumé, salade, tomates", "prix": 7.50, "category": "Salades", "image_url": "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80"},
    {"nom": "Salade Chèvre", "description": "Maïs, chèvre, salade, tomates", "prix": 7.50, "category": "Salades", "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80"},
    {"nom": "Salade Thon", "description": "Thon, maïs, salade, tomates", "prix": 7.50, "category": "Salades", "image_url": "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80"},
    {"nom": "Salade Saumon", "description": "Maïs, salade, tomates, saumon fumé", "prix": 7.50, "category": "Salades", "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80"},
    {"nom": "Salade Maison XXL", "description": "Escalope, chèvre, salade, tomates", "prix": 13.50, "category": "Salades", "image_url": "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80"},
    
    # PANINIS
    {"nom": "Panini Jambon", "description": "Jambon, fromage fondu", "prix": 7.00, "category": "Paninis", "image_url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80"},
    {"nom": "Panini Poulet Curry", "description": "Poulet curry, fromage fondu", "prix": 7.00, "category": "Paninis", "image_url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80"},
    {"nom": "Panini Kebab", "description": "Kebab, fromage fondu", "prix": 7.00, "category": "Paninis", "image_url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80"},
    {"nom": "Panini 3 Fromages", "description": "3 fromages fondus", "prix": 7.00, "category": "Paninis", "image_url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80"},
    {"nom": "Panini Thon", "description": "Thon, fromage fondu", "prix": 7.00, "category": "Paninis", "image_url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80"},
    {"nom": "Panini Nutella", "description": "Nutella fondant", "prix": 7.00, "category": "Paninis", "image_url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80"},
    
    # SNACKS
    {"nom": "Grandes Frites", "description": "Portion généreuse de frites croustillantes", "prix": 6.00, "category": "Snacks", "image_url": "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80"},
    {"nom": "Petites Frites", "description": "Portion de frites croustillantes", "prix": 3.00, "category": "Snacks", "image_url": "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80"},
    {"nom": "Frites Cheddar", "description": "Frites sauce cheddar", "prix": 3.50, "category": "Snacks", "image_url": "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80"},
    {"nom": "Potatoes", "description": "Potatoes croustillantes", "prix": 4.00, "category": "Snacks", "image_url": "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80"},
    {"nom": "Nuggets x10", "description": "10 nuggets de poulet croustillants", "prix": 9.90, "category": "Snacks", "image_url": "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80"},
    {"nom": "Tenders x10", "description": "10 tenders de poulet croustillants", "prix": 10.90, "category": "Snacks", "image_url": "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80"},
    {"nom": "Chicken Wings x10", "description": "10 ailes de poulet épicées", "prix": 9.90, "category": "Snacks", "image_url": "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=80"},
    {"nom": "Mozzarella Sticks", "description": "8 bâtonnets de mozzarella panés", "prix": 11.90, "category": "Snacks", "image_url": "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=600&q=80"},
    {"nom": "Onion Rings", "description": "Rondelles d'oignons panées", "prix": 8.00, "category": "Snacks", "image_url": "https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&q=80"},
    {"nom": "Jalapenos", "description": "Piments jalapeños farcis et panés", "prix": 11.90, "category": "Snacks", "image_url": "https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&q=80"},
    
    # DESSERTS
    {"nom": "Brownie", "description": "Brownie au chocolat fondant", "prix": 3.50, "category": "Desserts", "image_url": "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80"},
    {"nom": "Muffin", "description": "Muffin moelleux", "prix": 3.50, "category": "Desserts", "image_url": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80"},
    {"nom": "Donuts", "description": "Donut glacé", "prix": 3.50, "category": "Desserts", "image_url": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80"},
    {"nom": "Tiramisu", "description": "Tiramisu traditionnel", "prix": 3.50, "category": "Desserts", "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80"},
    {"nom": "Cookie", "description": "Cookie aux pépites de chocolat", "prix": 3.50, "category": "Desserts", "image_url": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80"},
    {"nom": "Milkshake", "description": "Milkshake base vanille, parfum au choix", "prix": 4.50, "category": "Desserts", "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"},
    
    # BOISSONS
    {"nom": "Coca-Cola 33cl", "description": "Coca-Cola canette", "prix": 2.00, "category": "Boissons", "image_url": "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80"},
    {"nom": "Coca-Cola 50cl", "description": "Coca-Cola bouteille", "prix": 3.50, "category": "Boissons", "image_url": "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80"},
    {"nom": "Coca-Cola 1.5L", "description": "Coca-Cola grande bouteille", "prix": 3.90, "category": "Boissons", "image_url": "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80"},
    {"nom": "Fanta Orange 33cl", "description": "Fanta Orange canette", "prix": 2.00, "category": "Boissons", "image_url": "https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=600&q=80"},
    {"nom": "Sprite 33cl", "description": "Sprite canette", "prix": 2.00, "category": "Boissons", "image_url": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&q=80"},
    {"nom": "Ice Tea 33cl", "description": "Ice Tea Pêche canette", "prix": 2.00, "category": "Boissons", "image_url": "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&q=80"},
    {"nom": "Orangina 33cl", "description": "Orangina canette", "prix": 2.00, "category": "Boissons", "image_url": "https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=600&q=80"},
    {"nom": "Oasis Tropical 33cl", "description": "Oasis Tropical canette", "prix": 2.00, "category": "Boissons", "image_url": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&q=80"},
    {"nom": "Red Bull", "description": "Boisson énergisante", "prix": 4.00, "category": "Boissons", "image_url": "https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=600&q=80"},
    {"nom": "Eau 1.5L", "description": "Eau minérale", "prix": 2.50, "category": "Boissons", "image_url": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80"},
]

# Create products
created = 0
errors = 0
for p in products:
    cat_id = categories.get(p["category"])
    if not cat_id:
        print(f"Category not found: {p['category']}")
        errors += 1
        continue
    
    data = {
        "nom": p["nom"],
        "description": p["description"],
        "prix": p["prix"],
        "category_id": cat_id,
        "image_url": p.get("image_url")
    }
    
    r = requests.post(f"{API_URL}/api/menu/products", json=data, headers=headers)
    if r.status_code == 200:
        created += 1
        print(f"✓ {p['nom']}")
    else:
        errors += 1
        print(f"✗ {p['nom']}: {r.text}")

print(f"\nDone! Created: {created}, Errors: {errors}")
