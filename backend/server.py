from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json
from enum import Enum
import csv
import io
from zoneinfo import ZoneInfo

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="O'Delices API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

JWT_SECRET = os.environ.get('JWT_SECRET', 'odelices-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Role(str, Enum):
    CLIENT = "CLIENT"
    CUISINE = "CUISINE"
    CAISSE = "CAISSE"
    LIVREUR = "LIVREUR"
    SUPER_ADMIN = "SUPER_ADMIN"

class OrderStatus(str, Enum):
    RECUE = "REÇUE"
    ACCUSEE_CUISINE = "ACCUSÉE_CUISINE"
    EN_PREPARATION = "EN_PRÉPARATION"
    PRETE = "PRÊTE"
    ASSIGNEE_LIVREUR = "ASSIGNÉE_LIVREUR"
    EN_LIVRAISON = "EN_LIVRAISON"
    LIVREE = "LIVRÉE"
    ANNULEE = "ANNULÉE"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class PaymentMode(str, Enum):
    EN_LIGNE = "EN_LIGNE"
    A_LA_LIVRAISON = "A_LA_LIVRAISON"
    SUR_PLACE = "SUR_PLACE"

class FulfillmentType(str, Enum):
    LIVRAISON = "LIVRAISON"
    A_EMPORTER = "A_EMPORTER"

class Channel(str, Enum):
    WEB = "WEB"
    TELEPHONE = "TELEPHONE"

# ========== CAPACITY SCHEDULING CONSTANTS ==========
ACTIVE_ORDER_THRESHOLD = 10
ACTIVE_STATUSES_FOR_CAPACITY = [
    OrderStatus.RECUE.value,
    OrderStatus.ACCUSEE_CUISINE.value,
    OrderStatus.EN_PREPARATION.value,
    OrderStatus.PRETE.value,
    OrderStatus.ASSIGNEE_LIVREUR.value,
    OrderStatus.EN_LIVRAISON.value
]
PARIS_TZ = ZoneInfo("Europe/Paris")

# ========== LOYALTY PROGRAM CONSTANTS ==========
LOYALTY_QUALIFYING_COUNT = 10
LOYALTY_REWARD_ON_ORDER = 11

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nom: str
    telephone: Optional[str] = None
    role: Role = Role.CLIENT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    nom: str
    telephone: Optional[str]
    role: str
    is_active: bool

class CategoryCreate(BaseModel):
    nom: str
    ordre: int = 0

class CategoryResponse(BaseModel):
    id: str
    nom: str
    ordre: int
    is_active: bool

class ProductCreate(BaseModel):
    category_id: str
    nom: str
    description: Optional[str] = None
    prix: float
    image_url: Optional[str] = None
    options_json: Optional[Dict] = None

class ProductResponse(BaseModel):
    id: str
    category_id: str
    nom: str
    description: Optional[str]
    prix: float
    image_url: Optional[str]
    is_active: bool
    options_json: Optional[Dict]

class OrderItemCreate(BaseModel):
    product_id: str
    quantite: int = 1
    options_snapshot_json: Optional[Dict] = None

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    type_fulfillment: FulfillmentType
    delivery_address: Optional[str] = None
    delivery_notes: Optional[str] = None
    payment_mode: PaymentMode = PaymentMode.EN_LIGNE

class OrderResponse(BaseModel):
    id: str
    order_number: str
    channel: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    type_fulfillment: str
    delivery_address: Optional[str]
    delivery_notes: Optional[str]
    status: str
    total_amount: float
    payment_mode: str
    payment_status: str
    assigned_driver_id: Optional[str]
    assigned_driver_name: Optional[str]
    items: List[Dict]
    created_at: str
    updated_at: str

class ManualOrderCreate(BaseModel):
    items: List[OrderItemCreate]
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    type_fulfillment: FulfillmentType
    delivery_address: Optional[str] = None
    delivery_notes: Optional[str] = None
    payment_mode: PaymentMode = PaymentMode.A_LA_LIVRAISON

class AssignDriverRequest(BaseModel):
    driver_id: str

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str

class SettingsUpdate(BaseModel):
    restaurant_address: Optional[str] = None
    delivery_radius_km: Optional[float] = None
    delivery_fee: Optional[float] = None
    minimum_order: Optional[float] = None
    stripe_enabled: Optional[bool] = None
    stripe_api_key: Optional[str] = None
    sendgrid_api_key: Optional[str] = None
    sender_email: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    cloudflare_account_id: Optional[str] = None
    cloudflare_api_token: Optional[str] = None
    paiement_hors_ligne_enabled: Optional[bool] = None

# ========== LOYALTY PROGRAM MODELS ==========
class LoyaltyAccountResponse(BaseModel):
    phone: str
    orders_count: int
    rewards_claimed: int
    is_eligible_for_reward: bool
    created_at: str
    updated_at: str

class LoyaltyClaimRequest(BaseModel):
    order_id: Optional[str] = None

class LoyaltyCheckResponse(BaseModel):
    phone: str
    orders_count: int
    is_eligible: bool
    message: Optional[str] = None

# ========== CAPACITY SCHEDULING MODELS ==========
class ActiveOrderCountResponse(BaseModel):
    total_active_delivery: int
    total_active_takeaway: int
    threshold: int
    is_at_capacity: bool

class DeliverySlot(BaseModel):
    start_time: str
    end_time: str
    available: bool
    message: Optional[str] = None

class AvailableSlotsResponse(BaseModel):
    is_at_capacity: bool
    forced_slot: Optional[DeliverySlot] = None
    message: Optional[str] = None

# ========== EXPORT MODELS ==========
class ExportScope(str, Enum):
    ORDERS = "orders"
    ORDER_ITEMS = "order_items"
    CUSTOMERS_BASIC = "customers_basic"
    LOYALTY_ACCOUNTS = "loyalty_accounts"
    LOYALTY_EVENTS = "loyalty_events"
    MENU_PRODUCTS = "menu_products"
    USERS = "users"
    NOTIFICATION_LOGS = "notification_logs"

class ExportFilters(BaseModel):
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    status: Optional[str] = None
    channel: Optional[str] = None
    payment_mode: Optional[str] = None
    delivery_type: Optional[str] = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room: str):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = []
        self.active_connections[room].append(websocket)
        logger.info(f"WebSocket connected to room: {room}")

    def disconnect(self, websocket: WebSocket, room: str):
        if room in self.active_connections:
            if websocket in self.active_connections[room]:
                self.active_connections[room].remove(websocket)
            logger.info(f"WebSocket disconnected from room: {room}")

    async def broadcast(self, message: dict, room: str):
        if room in self.active_connections:
            disconnected = []
            for connection in self.active_connections[room]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Failed to send to websocket in {room}: {e}")
                    disconnected.append(connection)
            # Clean up disconnected
            for conn in disconnected:
                if conn in self.active_connections[room]:
                    self.active_connections[room].remove(conn)

    async def broadcast_all(self, message: dict):
        """Broadcast to all rooms"""
        for room in self.active_connections:
            await self.broadcast(message, room)

    async def send_order_event(self, event_type: str, order_data: dict, rooms: List[str] = None):
        """Send order-related events to specified rooms"""
        message = {
            "event": event_type,
            "data": order_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "play_sound": event_type in ["order.created", "loyalty.reward.eligible"]
        }
        target_rooms = rooms or ["kitchen", "cashier"]
        for room in target_rooms:
            await self.broadcast(message, room)

manager = ConnectionManager()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Non authentifié")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalide")
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    return user

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    return user

def require_roles(allowed_roles: List[Role]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] == Role.SUPER_ADMIN.value:
            return user
        if user["role"] not in [r.value for r in allowed_roles]:
            raise HTTPException(status_code=403, detail="Accès non autorisé")
        return user
    return role_checker

def generate_order_number():
    now = datetime.now(timezone.utc)
    return f"OD{now.strftime('%y%m%d')}{str(uuid.uuid4())[:4].upper()}"

@api_router.post("/auth/register", response_model=dict)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": data.email,
        "nom": data.nom,
        "telephone": data.telephone,
        "role": data.role.value,
        "hash_mot_de_passe": hash_password(data.password),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login_at": None
    }
    await db.users.insert_one(user)
    token = create_token(user_id, data.role.value)
    return {"token": token, "user": {"id": user_id, "email": data.email, "nom": data.nom, "role": data.role.value}}

@api_router.post("/auth/login", response_model=dict)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["hash_mot_de_passe"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Compte désactivé")
    await db.users.update_one({"id": user["id"]}, {"$set": {"last_login_at": datetime.now(timezone.utc).isoformat()}})
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "nom": user["nom"], "role": user["role"], "telephone": user.get("telephone")}}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(id=user["id"], email=user["email"], nom=user["nom"], telephone=user.get("telephone"), role=user["role"], is_active=user.get("is_active", True))

@api_router.get("/menu/categories", response_model=List[CategoryResponse])
async def get_categories():
    categories = await db.categories.find({"is_active": True}, {"_id": 0}).sort("ordre", 1).to_list(100)
    return categories

@api_router.post("/menu/categories", response_model=CategoryResponse)
async def create_category(data: CategoryCreate, user: dict = Depends(require_roles([Role.CAISSE, Role.SUPER_ADMIN]))):
    cat_id = str(uuid.uuid4())
    category = {"id": cat_id, "nom": data.nom, "ordre": data.ordre, "is_active": True}
    await db.categories.insert_one(category)
    return category

@api_router.put("/menu/categories/{cat_id}", response_model=CategoryResponse)
async def update_category(cat_id: str, data: CategoryCreate, user: dict = Depends(require_roles([Role.CAISSE, Role.SUPER_ADMIN]))):
    result = await db.categories.update_one({"id": cat_id}, {"$set": {"nom": data.nom, "ordre": data.ordre}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    category = await db.categories.find_one({"id": cat_id}, {"_id": 0})
    return category

@api_router.delete("/menu/categories/{cat_id}")
async def delete_category(cat_id: str, user: dict = Depends(require_roles([Role.CAISSE, Role.SUPER_ADMIN]))):
    await db.categories.update_one({"id": cat_id}, {"$set": {"is_active": False}})
    return {"message": "Catégorie supprimée"}

@api_router.get("/menu/products", response_model=List[ProductResponse])
async def get_products(category_id: Optional[str] = None):
    query = {"is_active": True}
    if category_id:
        query["category_id"] = category_id
    products = await db.products.find(query, {"_id": 0}).to_list(500)
    return products

@api_router.get("/menu/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id, "is_active": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return product

@api_router.post("/menu/products", response_model=ProductResponse)
async def create_product(data: ProductCreate, user: dict = Depends(require_roles([Role.CAISSE, Role.SUPER_ADMIN]))):
    product_id = str(uuid.uuid4())
    product = {
        "id": product_id,
        "category_id": data.category_id,
        "nom": data.nom,
        "description": data.description,
        "prix": data.prix,
        "image_url": data.image_url,
        "is_active": True,
        "options_json": data.options_json
    }
    await db.products.insert_one(product)
    return product

@api_router.put("/menu/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, data: ProductCreate, user: dict = Depends(require_roles([Role.CAISSE, Role.SUPER_ADMIN]))):
    update_data = {
        "category_id": data.category_id,
        "nom": data.nom,
        "description": data.description,
        "prix": data.prix,
        "image_url": data.image_url,
        "options_json": data.options_json
    }
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return product

@api_router.delete("/menu/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(require_roles([Role.CAISSE, Role.SUPER_ADMIN]))):
    await db.products.update_one({"id": product_id}, {"$set": {"is_active": False}})
    return {"message": "Produit supprimé"}

async def build_order_response(order: dict) -> OrderResponse:
    driver_name = None
    if order.get("assigned_driver_id"):
        driver = await db.users.find_one({"id": order["assigned_driver_id"]}, {"_id": 0, "nom": 1})
        if driver:
            driver_name = driver["nom"]
    return OrderResponse(
        id=order["id"],
        order_number=order["order_number"],
        channel=order["channel"],
        customer_name=order["customer_name"],
        customer_phone=order["customer_phone"],
        customer_email=order.get("customer_email"),
        type_fulfillment=order["type_fulfillment"],
        delivery_address=order.get("delivery_address"),
        delivery_notes=order.get("delivery_notes"),
        status=order["status"],
        total_amount=order["total_amount"],
        payment_mode=order["payment_mode"],
        payment_status=order["payment_status"],
        assigned_driver_id=order.get("assigned_driver_id"),
        assigned_driver_name=driver_name,
        items=order.get("items", []),
        created_at=order["created_at"],
        updated_at=order["updated_at"]
    )

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(data: OrderCreate, user: dict = Depends(get_optional_user)):
    order_id = str(uuid.uuid4())
    order_number = generate_order_number()
    items = []
    total = 0.0
    for item in data.items:
        product = await db.products.find_one({"id": item.product_id, "is_active": True}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Produit {item.product_id} non trouvé")
        item_total = product["prix"] * item.quantite
        total += item_total
        items.append({
            "id": str(uuid.uuid4()),
            "product_id": item.product_id,
            "nom_snapshot": product["nom"],
            "prix_unitaire": product["prix"],
            "quantite": item.quantite,
            "options_snapshot_json": item.options_snapshot_json
        })
    now = datetime.now(timezone.utc).isoformat()
    order = {
        "id": order_id,
        "order_number": order_number,
        "channel": Channel.WEB.value,
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "customer_email": data.customer_email,
        "type_fulfillment": data.type_fulfillment.value,
        "delivery_address": data.delivery_address,
        "delivery_notes": data.delivery_notes,
        "status": OrderStatus.RECUE.value,
        "total_amount": total,
        "payment_mode": data.payment_mode.value,
        "payment_status": PaymentStatus.PENDING.value,
        "assigned_driver_id": None,
        "items": items,
        "user_id": user["id"] if user else None,
        "created_at": now,
        "updated_at": now
    }
    await db.orders.insert_one(order)
    await manager.broadcast({"event": "order.created", "order_id": order_id, "order_number": order_number}, "kitchen")
    await manager.broadcast({"event": "order.created", "order_id": order_id, "order_number": order_number}, "cashier")
    return await build_order_response(order)

@api_router.post("/orders/manual", response_model=OrderResponse)
async def create_manual_order(data: ManualOrderCreate, user: dict = Depends(require_roles([Role.CAISSE, Role.SUPER_ADMIN]))):
    order_id = str(uuid.uuid4())
    order_number = generate_order_number()
    items = []
    total = 0.0
    for item in data.items:
        product = await db.products.find_one({"id": item.product_id, "is_active": True}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Produit {item.product_id} non trouvé")
        item_total = product["prix"] * item.quantite
        total += item_total
        items.append({
            "id": str(uuid.uuid4()),
            "product_id": item.product_id,
            "nom_snapshot": product["nom"],
            "prix_unitaire": product["prix"],
            "quantite": item.quantite,
            "options_snapshot_json": item.options_snapshot_json
        })
    now = datetime.now(timezone.utc).isoformat()
    order = {
        "id": order_id,
        "order_number": order_number,
        "channel": Channel.TELEPHONE.value,
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "customer_email": data.customer_email,
        "type_fulfillment": data.type_fulfillment.value,
        "delivery_address": data.delivery_address,
        "delivery_notes": data.delivery_notes,
        "status": OrderStatus.RECUE.value,
        "total_amount": total,
        "payment_mode": data.payment_mode.value,
        "payment_status": PaymentStatus.PENDING.value if data.payment_mode != PaymentMode.EN_LIGNE else PaymentStatus.PENDING.value,
        "assigned_driver_id": None,
        "items": items,
        "created_by": user["id"],
        "created_at": now,
        "updated_at": now
    }
    await db.orders.insert_one(order)
    await manager.broadcast({"event": "order.created", "order_id": order_id, "order_number": order_number}, "kitchen")
    await manager.broadcast({"event": "order.created", "order_id": order_id, "order_number": order_number}, "cashier")
    return await build_order_response(order)

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(status: Optional[str] = None, user: dict = Depends(require_roles([Role.CUISINE, Role.CAISSE, Role.SUPER_ADMIN]))):
    query = {}
    if status:
        query["status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [await build_order_response(o) for o in orders]

@api_router.get("/orders/my", response_model=List[OrderResponse])
async def get_my_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [await build_order_response(o) for o in orders]

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, user: dict = Depends(get_optional_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        order = await db.orders.find_one({"order_number": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    return await build_order_response(order)

@api_router.post("/orders/{order_id}/kitchen-ack")
async def kitchen_acknowledge(order_id: str, user: dict = Depends(require_roles([Role.CUISINE, Role.SUPER_ADMIN]))):
    now = datetime.now(timezone.utc).isoformat()
    result = await db.orders.update_one(
        {"id": order_id, "status": OrderStatus.RECUE.value},
        {"$set": {"status": OrderStatus.ACCUSEE_CUISINE.value, "updated_at": now}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Commande non trouvée ou déjà traitée")
    await manager.broadcast({"event": "order.kitchen_ack", "order_id": order_id}, "cashier")
    return {"message": "Commande accusée par la cuisine"}

@api_router.post("/orders/{order_id}/start-preparation")
async def start_preparation(order_id: str, user: dict = Depends(require_roles([Role.CUISINE, Role.SUPER_ADMIN]))):
    now = datetime.now(timezone.utc).isoformat()
    result = await db.orders.update_one(
        {"id": order_id, "status": {"$in": [OrderStatus.RECUE.value, OrderStatus.ACCUSEE_CUISINE.value]}},
        {"$set": {"status": OrderStatus.EN_PREPARATION.value, "updated_at": now}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Commande non trouvée ou déjà en préparation")
    await manager.broadcast({"event": "order.in_preparation", "order_id": order_id}, "cashier")
    return {"message": "Préparation commencée"}

@api_router.post("/orders/{order_id}/ready")
async def order_ready(order_id: str, user: dict = Depends(require_roles([Role.CUISINE, Role.SUPER_ADMIN]))):
    now = datetime.now(timezone.utc).isoformat()
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": OrderStatus.PRETE.value, "updated_at": now}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Commande non trouvée")
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    await manager.broadcast({"event": "order.ready", "order_id": order_id}, "cashier")
    await manager.broadcast({"event": "order.ready", "order_id": order_id}, "driver")
    return {"message": "Commande prête"}

@api_router.post("/orders/{order_id}/assign-delivery")
async def assign_delivery(order_id: str, data: AssignDriverRequest, user: dict = Depends(require_roles([Role.CAISSE, Role.SUPER_ADMIN]))):
    driver = await db.users.find_one({"id": data.driver_id, "role": Role.LIVREUR.value}, {"_id": 0})
    if not driver:
        raise HTTPException(status_code=400, detail="Livreur non trouvé")
    now = datetime.now(timezone.utc).isoformat()
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"assigned_driver_id": data.driver_id, "status": OrderStatus.ASSIGNEE_LIVREUR.value, "updated_at": now}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Commande non trouvée")
    await manager.broadcast({"event": "order.assigned", "order_id": order_id, "driver_id": data.driver_id}, "driver")
    return {"message": "Livreur assigné"}

@api_router.post("/orders/{order_id}/out-for-delivery")
async def out_for_delivery(order_id: str, user: dict = Depends(require_roles([Role.LIVREUR, Role.SUPER_ADMIN]))):
    now = datetime.now(timezone.utc).isoformat()
    query = {"id": order_id}
    if user["role"] == Role.LIVREUR.value:
        query["assigned_driver_id"] = user["id"]
    result = await db.orders.update_one(query, {"$set": {"status": OrderStatus.EN_LIVRAISON.value, "updated_at": now}})
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Commande non trouvée ou non assignée à vous")
    await manager.broadcast({"event": "order.out_for_delivery", "order_id": order_id}, "cashier")
    return {"message": "En livraison"}

@api_router.post("/orders/{order_id}/delivered")
async def mark_delivered(order_id: str, user: dict = Depends(require_roles([Role.LIVREUR, Role.SUPER_ADMIN]))):
    now = datetime.now(timezone.utc).isoformat()
    query = {"id": order_id}
    if user["role"] == Role.LIVREUR.value:
        query["assigned_driver_id"] = user["id"]
    result = await db.orders.update_one(query, {"$set": {"status": OrderStatus.LIVREE.value, "updated_at": now}})
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Commande non trouvée ou non assignée à vous")
    await manager.broadcast({"event": "order.delivered", "order_id": order_id}, "cashier")
    return {"message": "Livrée"}

@api_router.post("/orders/{order_id}/mark-paid")
async def mark_paid(order_id: str, user: dict = Depends(require_roles([Role.CAISSE, Role.SUPER_ADMIN, Role.LIVREUR]))):
    now = datetime.now(timezone.utc).isoformat()
    result = await db.orders.update_one({"id": order_id}, {"$set": {"payment_status": PaymentStatus.PAID.value, "updated_at": now}})
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Commande non trouvée")
    # Broadcast payment received event
    await manager.broadcast({"event": "order.paid", "order_id": order_id}, "cashier")
    return {"message": "Paiement marqué comme reçu"}

@api_router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, user: dict = Depends(require_roles([Role.CAISSE, Role.SUPER_ADMIN]))):
    now = datetime.now(timezone.utc).isoformat()
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": OrderStatus.ANNULEE.value, "updated_at": now}})
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Commande non trouvée")
    await manager.broadcast({"event": "order.cancelled", "order_id": order_id}, "kitchen")
    await manager.broadcast({"event": "order.cancelled", "order_id": order_id}, "cashier")
    return {"message": "Commande annulée"}

@api_router.get("/deliveries/my", response_model=List[OrderResponse])
async def get_my_deliveries(user: dict = Depends(require_roles([Role.LIVREUR]))):
    orders = await db.orders.find({
        "assigned_driver_id": user["id"],
        "status": {"$in": [OrderStatus.ASSIGNEE_LIVREUR.value, OrderStatus.EN_LIVRAISON.value, OrderStatus.PRETE.value]}
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [await build_order_response(o) for o in orders]

@api_router.get("/users/drivers", response_model=List[UserResponse])
async def get_drivers(user: dict = Depends(require_roles([Role.CAISSE, Role.SUPER_ADMIN]))):
    drivers = await db.users.find({"role": Role.LIVREUR.value, "is_active": True}, {"_id": 0}).to_list(100)
    return [UserResponse(id=d["id"], email=d["email"], nom=d["nom"], telephone=d.get("telephone"), role=d["role"], is_active=d["is_active"]) for d in drivers]

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(user: dict = Depends(require_roles([Role.SUPER_ADMIN]))):
    users = await db.users.find({}, {"_id": 0}).to_list(500)
    return [UserResponse(id=u["id"], email=u["email"], nom=u["nom"], telephone=u.get("telephone"), role=u["role"], is_active=u.get("is_active", True)) for u in users]

@api_router.post("/admin/users", response_model=UserResponse)
async def create_user_admin(data: UserCreate, user: dict = Depends(require_roles([Role.SUPER_ADMIN]))):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "email": data.email,
        "nom": data.nom,
        "telephone": data.telephone,
        "role": data.role.value,
        "hash_mot_de_passe": hash_password(data.password),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)
    return UserResponse(id=user_id, email=data.email, nom=data.nom, telephone=data.telephone, role=data.role.value, is_active=True)

@api_router.put("/admin/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: str, user: dict = Depends(require_roles([Role.SUPER_ADMIN]))):
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    new_status = not target.get("is_active", True)
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": new_status}})
    return {"is_active": new_status}

@api_router.get("/admin/settings")
async def get_settings(user: dict = Depends(require_roles([Role.SUPER_ADMIN]))):
    settings = await db.settings.find_one({"id": "main"}, {"_id": 0})
    if not settings:
        settings = {
            "id": "main",
            "restaurant_address": "3 Rue à la Paille, 28230 Épernon, France",
            "delivery_radius_km": 5,
            "delivery_fee": 0,
            "minimum_order": 0,
            "stripe_enabled": True,
            "stripe_api_key": "",
            "sendgrid_api_key": "",
            "sender_email": "",
            "twilio_account_sid": "",
            "twilio_auth_token": "",
            "twilio_phone_number": "",
            "cloudflare_account_id": "",
            "cloudflare_api_token": "",
            "paiement_hors_ligne_enabled": True
        }
        await db.settings.insert_one(settings)
    return settings

@api_router.put("/admin/settings")
async def update_settings(data: SettingsUpdate, user: dict = Depends(require_roles([Role.SUPER_ADMIN]))):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await db.settings.update_one({"id": "main"}, {"$set": update_data}, upsert=True)
    return await get_settings(user)

@api_router.get("/admin/stats")
async def get_stats(user: dict = Depends(require_roles([Role.SUPER_ADMIN]))):
    total_orders = await db.orders.count_documents({})
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today_orders = await db.orders.count_documents({"created_at": {"$gte": today_start}})
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    pending_orders = await db.orders.count_documents({"status": {"$in": [OrderStatus.RECUE.value, OrderStatus.ACCUSEE_CUISINE.value, OrderStatus.EN_PREPARATION.value]}})
    return {
        "total_orders": total_orders,
        "today_orders": today_orders,
        "total_revenue": total_revenue,
        "pending_orders": pending_orders
    }

@api_router.post("/payments/create-checkout")
async def create_checkout(data: CheckoutRequest, request: Request):
    order = await db.orders.find_one({"id": data.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    settings = await db.settings.find_one({"id": "main"}, {"_id": 0})
    stripe_key = os.environ.get('STRIPE_API_KEY', '')
    if settings and settings.get("stripe_api_key"):
        stripe_key = settings["stripe_api_key"]
    if not stripe_key:
        raise HTTPException(status_code=400, detail="Stripe non configuré")
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        webhook_url = f"{data.origin_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
        success_url = f"{data.origin_url}/suivi/{order['order_number']}?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{data.origin_url}/panier"
        checkout_request = CheckoutSessionRequest(
            amount=float(order["total_amount"]),
            currency="eur",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"order_id": data.order_id, "order_number": order["order_number"]}
        )
        session = await stripe_checkout.create_checkout_session(checkout_request)
        await db.payment_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "order_id": data.order_id,
            "session_id": session.session_id,
            "amount": order["total_amount"],
            "currency": "eur",
            "payment_status": "INITIATED",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"url": session.url, "session_id": session.session_id}
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    settings = await db.settings.find_one({"id": "main"}, {"_id": 0})
    stripe_key = os.environ.get('STRIPE_API_KEY', '')
    if settings and settings.get("stripe_api_key"):
        stripe_key = settings["stripe_api_key"]
    if not stripe_key:
        raise HTTPException(status_code=400, detail="Stripe non configuré")
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
        status = await stripe_checkout.get_checkout_status(session_id)
        if status.payment_status == "paid":
            tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if tx and tx.get("payment_status") != "PAID":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "PAID", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                if tx.get("order_id"):
                    await db.orders.update_one(
                        {"id": tx["order_id"]},
                        {"$set": {"payment_status": PaymentStatus.PAID.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
                    )
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        logger.error(f"Payment status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    settings = await db.settings.find_one({"id": "main"}, {"_id": 0})
    stripe_key = os.environ.get('STRIPE_API_KEY', '')
    if settings and settings.get("stripe_api_key"):
        stripe_key = settings["stripe_api_key"]
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        if webhook_response.payment_status == "paid":
            order_id = webhook_response.metadata.get("order_id")
            if order_id:
                await db.orders.update_one(
                    {"id": order_id},
                    {"$set": {"payment_status": PaymentStatus.PAID.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": "PAID", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ========== BLOG MODELS ==========
class BlogPostCreate(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    image_url: Optional[str] = None
    meta_description: str
    meta_keywords: List[str] = []
    author: str = "O'Delices"
    is_published: bool = True

class BlogPostResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str
    content: str
    image_url: Optional[str]
    meta_description: str
    meta_keywords: List[str]
    author: str
    is_published: bool
    created_at: str
    updated_at: str

# ========== BLOG ENDPOINTS ==========
@api_router.get("/blog/posts", response_model=List[BlogPostResponse])
async def get_blog_posts(published_only: bool = True):
    query = {"is_published": True} if published_only else {}
    posts = await db.blog_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts

@api_router.get("/blog/posts/{slug}")
async def get_blog_post(slug: str):
    post = await db.blog_posts.find_one({"slug": slug}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return post

@api_router.post("/blog/posts", response_model=BlogPostResponse)
async def create_blog_post(post: BlogPostCreate, user: dict = Depends(require_roles([Role.SUPER_ADMIN]))):
    existing = await db.blog_posts.find_one({"slug": post.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Un article avec ce slug existe déjà")
    now = datetime.now(timezone.utc).isoformat()
    new_post = {
        "id": str(uuid.uuid4()),
        **post.dict(),
        "created_at": now,
        "updated_at": now
    }
    await db.blog_posts.insert_one(new_post)
    return {k: v for k, v in new_post.items() if k != "_id"}

@api_router.put("/blog/posts/{post_id}")
async def update_blog_post(post_id: str, post: BlogPostCreate, user: dict = Depends(require_roles([Role.SUPER_ADMIN]))):
    existing = await db.blog_posts.find_one({"id": post_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    await db.blog_posts.update_one(
        {"id": post_id},
        {"$set": {**post.dict(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
    return updated

@api_router.delete("/blog/posts/{post_id}")
async def delete_blog_post(post_id: str, user: dict = Depends(require_roles([Role.SUPER_ADMIN]))):
    result = await db.blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return {"message": "Article supprimé"}

@app.websocket("/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str):
    await manager.connect(websocket, room)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast({"message": data}, room)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room)

@api_router.get("/")
async def root():
    return {"message": "O'Delices API", "version": "1.0.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("order_number", unique=True)
    await db.products.create_index("id", unique=True)
    await db.categories.create_index("id", unique=True)
    admin = await db.users.find_one({"role": Role.SUPER_ADMIN.value})
    if not admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "admin@odelices.fr",
            "nom": "Admin",
            "telephone": None,
            "role": Role.SUPER_ADMIN.value,
            "hash_mot_de_passe": hash_password("admin123"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin user created: admin@odelices.fr / admin123")
    
    # Seed blog posts if empty
    blog_count = await db.blog_posts.count_documents({})
    if blog_count == 0:
        blog_posts = [
            {
                "id": str(uuid.uuid4()),
                "title": "Commander facilement vos tacos, burgers et pizzas halal à Épernon",
                "slug": "commander-tacos-burgers-pizzas-halal-epernon",
                "excerpt": "Découvrez comment commander en ligne chez O'Delices : livraison rapide, à emporter ou sur place. Tacos, burgers, pizzas et kebabs 100% halal à Épernon.",
                "content": """Avant tout, parlons de vous. Quand la faim se fait sentir, vous cherchez sûrement un repas rapide, gourmand et préparé avec soin. Chez **O'Delices**, nous avons pensé à tout : la **livraison à domicile**, la **commande à emporter** et le **service sur place**. Peu importe votre envie ou votre emploi du temps, nous avons une solution simple et pratique pour vous régaler.

Dès que vous passez commande en ligne, vous entrez dans une expérience gourmande où la qualité et la générosité priment. Nos **tacos halal**, nos **burgers savoureux**, nos **pizzas artisanales** et nos **kebabs généreux** sont faits pour vous offrir une expérience culinaire sans compromis.

### La livraison : le confort sans bouger de chez vous

D'abord, imaginez une soirée pluvieuse. Vous n'avez pas envie de cuisiner, encore moins de sortir. Grâce à notre **service de livraison à Épernon et dans les villes voisines**, votre repas arrive directement chez vous.

Ensuite, la livraison, c'est la garantie de profiter de vos plats préférés sans effort. Plus besoin d'affronter la circulation ou de perdre du temps. Nos livreurs vous apportent vos **pizzas bien chaudes**, vos **tacos généreux**, vos **burgers juteux** à la maison.

Par ailleurs, la livraison, c'est aussi un excellent choix pour vos soirées entre amis ou vos repas en famille. Vous pouvez commander plusieurs plats et composer un menu varié qui plaît à tout le monde.

**Passez commande dès maintenant en ligne et faites-vous livrer sans attendre.**

### L'emporter : rapide, pratique et efficace

Ensuite, parlons des repas à emporter. Vous sortez du travail et vous n'avez pas envie de cuisiner ? Vous cherchez une solution rapide avant de rentrer chez vous ? Notre service **à emporter** est pensé pour ça.

D'un côté, vous évitez les files d'attente. Vous commandez en ligne, vous arrivez, et votre repas est prêt. De l'autre, vous gagnez du temps sans sacrifier le plaisir. Nos **tacos halal généreux**, nos **burgers fondants** et nos **pizzas artisanales** vous accompagnent partout.

**Commandez à emporter dès aujourd'hui et profitez d'un service rapide et pratique.**

### Pourquoi choisir O'Delices à Épernon ?

D'abord, parce que nous plaçons votre satisfaction au cœur de notre métier. Nous savons que vous cherchez à la fois le goût et la praticité. En commandant chez nous, vous gagnez du temps et profitez de repas copieux et savoureux.

Enfin, parce que nous faisons partie de votre quotidien local. Nous livrons à **Épernon** mais aussi dans les communes voisines : **Hanches, Droue-sur-Drouette, Gas, Maintenon, Nogent-le-Roi** et bien d'autres.

**Ne cherchez plus ailleurs : le meilleur fast-food halal d'Épernon est déjà tout proche de vous.**""",
                "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200",
                "meta_description": "Commander tacos, burgers, pizzas et kebabs halal à Épernon. Livraison rapide, à emporter. O'Delices - votre fast-food halal de qualité.",
                "meta_keywords": ["tacos halal épernon", "burger halal épernon", "pizza halal épernon", "livraison épernon", "fast food halal 28230"],
                "author": "O'Delices",
                "is_published": True,
                "created_at": "2025-01-15T10:00:00Z",
                "updated_at": "2025-01-15T10:00:00Z"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Les meilleurs tacos halal d'Épernon : découvrez nos recettes",
                "slug": "meilleurs-tacos-halal-epernon",
                "excerpt": "Chez O'Delices, nos tacos halal sont préparés avec des ingrédients frais et de qualité. Découvrez nos recettes généreuses qui font la différence.",
                "content": """Quand on parle de **tacos halal à Épernon**, une adresse sort du lot : **O'Delices**. Nos tacos sont devenus incontournables pour tous les amateurs de saveurs généreuses et authentiques.

### Des ingrédients frais et de qualité

Chez nous, chaque taco est préparé avec soin. La viande est **100% halal**, les légumes sont frais du jour, et nos sauces maison font toute la différence. Du **tacos poulet** au **tacos viande hachée**, en passant par le **tacos mixte**, nous avons de quoi satisfaire toutes les envies.

### Une générosité qui fait la différence

Nos tacos ne sont pas de simples snacks. Ce sont de véritables repas complets, garnis avec générosité. Chaque bouchée est une explosion de saveurs, avec le croustillant de la galette, le fondant de la viande et le croquant des crudités.

### Les garnitures qui font le succès

- **Sauce fromagère** crémeuse et onctueuse
- **Sauce algérienne** légèrement pimentée
- **Sauce blanche** fraîche et délicate
- **Frites croustillantes** directement dans le tacos

### Commander vos tacos préférés

La commande est simple : rendez-vous sur notre site, choisissez votre tacos, personnalisez vos garnitures et sauces, et validez. En livraison ou à emporter, vos tacos arrivent chauds et prêts à être dégustés.

**Commandez vos tacos halal dès maintenant et régalez-vous !**""",
                "image_url": "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=1200",
                "meta_description": "Meilleurs tacos halal à Épernon. Viande halal, sauces maison, garnitures généreuses. Commandez en ligne chez O'Delices - livraison rapide.",
                "meta_keywords": ["tacos halal épernon", "meilleur tacos 28230", "tacos livraison épernon", "tacos halal eure-et-loir"],
                "author": "O'Delices",
                "is_published": True,
                "created_at": "2025-02-10T14:00:00Z",
                "updated_at": "2025-02-10T14:00:00Z"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Livraison de pizzas halal à Épernon et alentours",
                "slug": "livraison-pizzas-halal-epernon",
                "excerpt": "Faites-vous livrer vos pizzas halal à domicile à Épernon. O'Delices livre également à Hanches, Gas, Droue-sur-Drouette et Maintenon.",
                "content": """Vous avez envie d'une **pizza halal** bien chaude, livrée directement chez vous ? Chez **O'Delices à Épernon**, nous avons fait de la livraison notre spécialité.

### Un service de livraison rapide et fiable

Notre équipe de livreurs connaît parfaitement Épernon et ses environs. Résultat : votre pizza arrive chaude, dans les meilleurs délais. Nous livrons également dans les communes voisines :

- **Hanches** (5 min)
- **Gas** (8 min)
- **Droue-sur-Drouette** (7 min)
- **Maintenon** (10 min)
- **Nogent-le-Roi** (12 min)

### Nos pizzas halal les plus populaires

Toutes nos pizzas sont préparées avec des ingrédients **100% halal** et une pâte fraîche du jour :

- **Margherita** : Tomate, mozzarella, basilic frais
- **Royale** : Tomate, mozzarella, champignons, jambon de dinde halal
- **Kebab** : Sauce blanche, viande kebab, oignons, tomates
- **4 Fromages** : Mozzarella, chèvre, emmental, gorgonzola
- **Orientale** : Merguez halal, poivrons, oignons, olives

### Comment commander ?

1. Rendez-vous sur notre site
2. Choisissez votre pizza et sa taille
3. Ajoutez vos accompagnements et boissons
4. Validez votre commande
5. Suivez votre livraison en temps réel

**Commandez votre pizza halal maintenant et profitez d'un repas savoureux livré chez vous.**""",
                "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200",
                "meta_description": "Livraison pizza halal Épernon et environs. Pizzas fraîches, viandes halal. Livraison rapide à Hanches, Gas, Maintenon. Commandez en ligne.",
                "meta_keywords": ["livraison pizza épernon", "pizza halal épernon", "pizzeria halal 28230", "commander pizza épernon"],
                "author": "O'Delices",
                "is_published": True,
                "created_at": "2025-03-05T11:30:00Z",
                "updated_at": "2025-03-05T11:30:00Z"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Burgers halal gourmands : notre sélection chez O'Delices",
                "slug": "burgers-halal-gourmands-odelices",
                "excerpt": "Découvrez nos burgers halal préparés avec du bœuf et poulet halal de qualité. Des recettes généreuses et savoureuses à Épernon.",
                "content": """Les **burgers halal** sont devenus un incontournable de la cuisine fast-food. Chez **O'Delices**, nous avons développé une gamme de burgers qui allie qualité, générosité et saveurs.

### Des viandes 100% halal sélectionnées

Nos steaks sont préparés avec du **bœuf halal** de qualité supérieure. Pour les amateurs de volaille, nous proposons également des **burgers au poulet halal** tout aussi savoureux.

### Notre sélection de burgers

**Le Classic** : Steak haché halal, salade, tomate, oignons, sauce burger
**Le Cheese Burger** : Steak halal, double cheddar fondu, cornichons, sauce spéciale
**Le Chicken Burger** : Filet de poulet pané, salade iceberg, sauce mayo maison
**Le Double** : Double steak halal, double fromage, bacon de dinde, sauce BBQ
**Le Veggie** : Galette de légumes, avocat, tomates séchées, sauce yaourt

### Les accompagnements parfaits

- Frites maison croustillantes
- Potatoes épicées
- Onion rings dorés
- Nuggets de poulet halal

### Un burger, c'est aussi une expérience

Chez O'Delices, nous pensons qu'un bon burger doit être généreux, savoureux et préparé avec passion. Chaque ingrédient est choisi pour vous offrir la meilleure expérience gustative.

**Commandez votre burger halal et laissez-vous surprendre par nos recettes gourmandes.**""",
                "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200",
                "meta_description": "Burgers halal gourmands à Épernon. Bœuf et poulet halal, recettes généreuses. Commandez en ligne chez O'Delices - livraison ou à emporter.",
                "meta_keywords": ["burger halal épernon", "hamburger halal 28230", "burger livraison épernon", "fast food halal épernon"],
                "author": "O'Delices",
                "is_published": True,
                "created_at": "2025-04-20T16:00:00Z",
                "updated_at": "2025-04-20T16:00:00Z"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Kebab halal à Épernon : tradition et saveurs orientales",
                "slug": "kebab-halal-epernon-tradition-saveurs",
                "excerpt": "Le kebab authentique façon O'Delices : viande grillée halal, pain frais, sauces maison. Découvrez nos recettes orientales à Épernon.",
                "content": """Le **kebab** est bien plus qu'un simple sandwich : c'est une tradition culinaire qui remonte à des siècles. Chez **O'Delices à Épernon**, nous honorons cette tradition avec des recettes authentiques et des ingrédients de qualité.

### Une viande kebab d'exception

Notre viande kebab est **100% halal**, marinée selon une recette traditionnelle et grillée à la broche. Le résultat : une viande tendre, parfumée et juteuse qui fond dans la bouche.

### Les classiques du kebab

**Kebab Sandwich** : Pain pita frais, viande kebab, salade, tomates, oignons, sauce au choix
**Kebab Assiette** : Viande kebab généreuse, frites maison, salade fraîche, sauces
**Kebab Galette** : Grande galette, viande kebab, frites, crudités, sauce fromagère
**Durum** : Galette roulée, viande kebab, garniture complète, sauce blanche

### Nos sauces signature

- **Sauce blanche** : Crémeuse et fraîche
- **Sauce samouraï** : Légèrement piquante
- **Sauce harissa** : Pour les amateurs de sensations fortes
- **Sauce algérienne** : Douce et parfumée

### L'authenticité au cœur de nos préparations

Chaque kebab est préparé à la commande, avec des ingrédients frais. Le pain est moelleux, la viande généreuse, les légumes croquants. C'est ça, l'expérience O'Delices.

**Commandez votre kebab halal et goûtez à l'authenticité des saveurs orientales.**""",
                "image_url": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=1200",
                "meta_description": "Kebab halal authentique à Épernon. Viande grillée halal, sauces maison, pain frais. Commandez en ligne chez O'Delices.",
                "meta_keywords": ["kebab halal épernon", "kebab livraison épernon", "doner kebab 28230", "kebab à emporter épernon"],
                "author": "O'Delices",
                "is_published": True,
                "created_at": "2025-05-12T09:00:00Z",
                "updated_at": "2025-05-12T09:00:00Z"
            }
        ]
        await db.blog_posts.insert_many(blog_posts)
        await db.blog_posts.create_index("slug", unique=True)
        logger.info(f"Seeded {len(blog_posts)} blog posts")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
