import requests
import sys
import json
from datetime import datetime

class ODelicesAPITester:
    def __init__(self, base_url="https://restaurant-hub-34.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@odelices.fr", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            self.token = self.admin_token  # Set as current token
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_get_categories(self):
        """Test GET /api/menu/categories"""
        success, response = self.run_test(
            "Get Menu Categories",
            "GET",
            "menu/categories",
            200
        )
        if success:
            print(f"   Found {len(response)} categories")
            return response
        return []

    def test_get_products(self):
        """Test GET /api/menu/products"""
        success, response = self.run_test(
            "Get Menu Products",
            "GET",
            "menu/products",
            200
        )
        if success:
            print(f"   Found {len(response)} products")
            return response
        return []

    def test_create_category(self):
        """Test creating a new category"""
        success, response = self.run_test(
            "Create Category",
            "POST",
            "menu/categories",
            200,
            data={"nom": "Test Category", "ordre": 99}
        )
        if success:
            return response.get('id')
        return None

    def test_create_product(self, category_id):
        """Test creating a new product"""
        if not category_id:
            print("❌ Cannot create product without category")
            return None
            
        success, response = self.run_test(
            "Create Product",
            "POST",
            "menu/products",
            200,
            data={
                "nom": "Test Burger",
                "description": "Delicious test burger",
                "prix": 12.50,
                "category_id": category_id,
                "image_url": "https://example.com/burger.jpg"
            }
        )
        if success:
            return response.get('id')
        return None

    def test_create_order(self, product_id):
        """Test POST /api/orders"""
        if not product_id:
            print("❌ Cannot create order without product")
            return None
            
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data={
                "items": [
                    {
                        "product_id": product_id,
                        "quantite": 2
                    }
                ],
                "customer_name": "Test Customer",
                "customer_phone": "0123456789",
                "customer_email": "test@example.com",
                "type_fulfillment": "LIVRAISON",
                "delivery_address": "123 Test Street, Test City",
                "payment_mode": "EN_LIGNE"
            }
        )
        if success:
            return response.get('id')
        return None

    def test_get_orders(self):
        """Test GET /api/orders (requires authentication)"""
        success, response = self.run_test(
            "Get Orders",
            "GET",
            "orders",
            200
        )
        if success:
            print(f"   Found {len(response)} orders")
            return response
        return []

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200
        )
        if success:
            print(f"   Stats: {response}")
            return response
        return {}

    def test_admin_users(self):
        """Test admin users endpoint"""
        success, response = self.run_test(
            "Admin Users",
            "GET",
            "admin/users",
            200
        )
        if success:
            print(f"   Found {len(response)} users")
            return response
        return []

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"testuser{timestamp}@example.com",
                "password": "TestPass123!",
                "nom": "Test User",
                "telephone": "0123456789",
                "role": "CLIENT"
            }
        )
        if success and 'token' in response:
            print(f"   User registered successfully")
            return response['token']
        return None

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        if success:
            print(f"   Current user: {response.get('nom', 'Unknown')}")
            return response
        return {}

def main():
    print("🚀 Starting O'Delices API Testing...")
    print("=" * 50)
    
    tester = ODelicesAPITester()
    
    # Test basic connectivity
    if not tester.test_root_endpoint():
        print("❌ Root endpoint failed, stopping tests")
        return 1

    # Test admin login
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1

    # Test menu endpoints
    categories = tester.test_get_categories()
    products = tester.test_get_products()

    # Test admin functionality
    tester.test_admin_stats()
    tester.test_admin_users()
    
    # Test current user info
    tester.test_auth_me()

    # Test creating new category and product
    category_id = tester.test_create_category()
    product_id = None
    if category_id:
        product_id = tester.test_create_product(category_id)

    # Test order creation
    if product_id:
        order_id = tester.test_create_order(product_id)
    elif products:
        # Use existing product if available
        order_id = tester.test_create_order(products[0]['id'])
    else:
        print("⚠️  No products available for order testing")
        order_id = None

    # Test getting orders
    tester.test_get_orders()

    # Test user registration
    user_token = tester.test_user_registration()

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("✅ Backend API tests mostly successful!")
        return 0
    else:
        print("❌ Backend API tests have significant failures")
        return 1

if __name__ == "__main__":
    sys.exit(main())