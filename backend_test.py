#!/usr/bin/env python3
"""
O'Delices Backend API Test Suite
Tests all backend endpoints for the restaurant ordering system
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class ODelicesAPITester:
    def __init__(self, base_url: str = "https://restaurant-hub-34.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_token = None
        self.kitchen_token = None
        self.cashier_token = None
        self.driver_token = None
        self.test_order_id = None
        self.test_category_id = None
        self.test_product_id = None
        
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None, 
                 token: Optional[str] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        self.tests_run += 1
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if token:
            test_headers['Authorization'] = f'Bearer {token}'

        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - {name} (Status: {response.status_code})")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ FAILED - {name} (Expected {expected_status}, got {response.status_code})")
                self.log(f"   Response: {response.text[:200]}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            self.log(f"❌ FAILED - {name} (Error: {str(e)})", "ERROR")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_authentication(self):
        """Test authentication endpoints"""
        self.log("🔐 Testing Authentication System", "INFO")
        
        # Test admin login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/auth/login",
            200,
            data={"email": "admin@odelices.fr", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            self.log(f"✅ Admin token obtained")
        
        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST", 
            "/auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrong"}
        )
        
        # Test get current user
        if self.admin_token:
            self.run_test(
                "Get Current User",
                "GET",
                "/auth/me",
                200,
                token=self.admin_token
            )

    def test_menu_management(self):
        """Test menu categories and products"""
        self.log("🍽️ Testing Menu Management", "INFO")
        
        # Get categories
        success, categories = self.run_test(
            "Get Categories",
            "GET",
            "/menu/categories",
            200
        )
        
        # Create test category
        success, category = self.run_test(
            "Create Category",
            "POST",
            "/menu/categories",
            200,
            data={"nom": "Test Category", "ordre": 99},
            token=self.admin_token
        )
        if success and 'id' in category:
            self.test_category_id = category['id']
        
        # Get products
        success, products = self.run_test(
            "Get Products",
            "GET",
            "/menu/products",
            200
        )
        
        # Create test product
        if self.test_category_id:
            success, product = self.run_test(
                "Create Product",
                "POST",
                "/menu/products",
                200,
                data={
                    "category_id": self.test_category_id,
                    "nom": "Test Product",
                    "description": "Test description",
                    "prix": 9.99,
                    "image_url": "https://example.com/test.jpg"
                },
                token=self.admin_token
            )
            if success and 'id' in product:
                self.test_product_id = product['id']
        
        # Get specific product
        if self.test_product_id:
            self.run_test(
                "Get Specific Product",
                "GET",
                f"/menu/products/{self.test_product_id}",
                200
            )

    def test_order_workflow(self):
        """Test complete order workflow"""
        self.log("📦 Testing Order Workflow", "INFO")
        
        if not self.test_product_id:
            self.log("⚠️ Skipping order tests - no test product available", "WARN")
            return
        
        # Create order
        success, order = self.run_test(
            "Create Order",
            "POST",
            "/orders",
            200,
            data={
                "items": [{"product_id": self.test_product_id, "quantite": 2}],
                "customer_name": "Test Customer",
                "customer_phone": "0123456789",
                "customer_email": "test@example.com",
                "type_fulfillment": "LIVRAISON",
                "delivery_address": "123 Test Street",
                "payment_mode": "A_LA_LIVRAISON"
            }
        )
        if success and 'id' in order:
            self.test_order_id = order['id']
            self.log(f"✅ Order created: {order.get('order_number')}")
        
        # Get orders (requires admin/staff token)
        if self.admin_token:
            self.run_test(
                "Get All Orders",
                "GET",
                "/orders",
                200,
                token=self.admin_token
            )
        
        # Get specific order
        if self.test_order_id:
            self.run_test(
                "Get Specific Order",
                "GET",
                f"/orders/{self.test_order_id}",
                200
            )

    def test_kitchen_operations(self):
        """Test kitchen dashboard operations"""
        self.log("👨‍🍳 Testing Kitchen Operations", "INFO")
        
        if not self.test_order_id or not self.admin_token:
            self.log("⚠️ Skipping kitchen tests - missing order or token", "WARN")
            return
        
        # Kitchen acknowledge order
        self.run_test(
            "Kitchen Acknowledge Order",
            "POST",
            f"/orders/{self.test_order_id}/kitchen-ack",
            200,
            token=self.admin_token
        )
        
        # Start preparation
        self.run_test(
            "Start Preparation",
            "POST",
            f"/orders/{self.test_order_id}/start-preparation",
            200,
            token=self.admin_token
        )
        
        # Mark ready
        self.run_test(
            "Mark Order Ready",
            "POST",
            f"/orders/{self.test_order_id}/ready",
            200,
            token=self.admin_token
        )

    def test_cashier_operations(self):
        """Test cashier dashboard operations"""
        self.log("💰 Testing Cashier Operations", "INFO")
        
        if not self.admin_token:
            self.log("⚠️ Skipping cashier tests - no admin token", "WARN")
            return
        
        # Get drivers
        self.run_test(
            "Get Drivers",
            "GET",
            "/users/drivers",
            200,
            token=self.admin_token
        )
        
        # Mark order as paid
        if self.test_order_id:
            self.run_test(
                "Mark Order Paid",
                "POST",
                f"/orders/{self.test_order_id}/mark-paid",
                200,
                token=self.admin_token
            )

    def test_admin_operations(self):
        """Test admin dashboard operations"""
        self.log("⚙️ Testing Admin Operations", "INFO")
        
        if not self.admin_token:
            self.log("⚠️ Skipping admin tests - no admin token", "WARN")
            return
        
        # Get admin stats
        self.run_test(
            "Get Admin Stats",
            "GET",
            "/admin/stats",
            200,
            token=self.admin_token
        )
        
        # Get all users
        self.run_test(
            "Get All Users",
            "GET",
            "/admin/users",
            200,
            token=self.admin_token
        )
        
        # Get settings
        self.run_test(
            "Get Settings",
            "GET",
            "/admin/settings",
            200,
            token=self.admin_token
        )
        
        # Create test user
        self.run_test(
            "Create Test User",
            "POST",
            "/admin/users",
            200,
            data={
                "email": f"test-{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "testpass123",
                "nom": "Test User",
                "telephone": "0123456789",
                "role": "CUISINE"
            },
            token=self.admin_token
        )

    def test_capacity_scheduling(self):
        """Test capacity scheduling v2.0 features"""
        self.log("📊 Testing Capacity Scheduling (v2.0)", "INFO")
        
        # Test active order count endpoint (public)
        success, response = self.run_test(
            "Get Active Order Count",
            "GET",
            "/capacity/active-count",
            200
        )
        if success:
            self.log(f"   Active delivery orders: {response.get('total_active_delivery', 0)}")
            self.log(f"   Active takeaway orders: {response.get('total_active_takeaway', 0)}")
            self.log(f"   Threshold: {response.get('threshold', 0)}")
            self.log(f"   At capacity: {response.get('is_at_capacity', False)}")
        
        # Test available slots endpoint (public)
        success, response = self.run_test(
            "Get Available Delivery Slots",
            "GET",
            "/checkout/available-slots",
            200
        )
        if success:
            self.log(f"   At capacity: {response.get('is_at_capacity', False)}")
            if response.get('forced_slot'):
                slot = response['forced_slot']
                self.log(f"   Forced slot: {slot.get('start_time')} - {slot.get('end_time')}")

    def test_loyalty_program(self):
        """Test loyalty program v2.0 features"""
        self.log("🎁 Testing Loyalty Program (v2.0)", "INFO")
        
        test_phone = "0123456789"
        
        # Test loyalty check endpoint (public)
        success, response = self.run_test(
            "Check Loyalty Status",
            "GET",
            f"/loyalty/check/{test_phone}",
            200
        )
        if success:
            self.log(f"   Phone: {response.get('phone')}")
            self.log(f"   Orders count: {response.get('orders_count', 0)}")
            self.log(f"   Is eligible: {response.get('is_eligible', False)}")
        
        if not self.admin_token:
            self.log("⚠️ Skipping staff loyalty tests - no admin token", "WARN")
            return
        
        # Test get loyalty account (staff only)
        success, response = self.run_test(
            "Get Loyalty Account",
            "GET",
            f"/loyalty/{test_phone}",
            200,
            token=self.admin_token
        )
        if success:
            self.log(f"   Rewards claimed: {response.get('rewards_claimed', 0)}")
            self.log(f"   Eligible for reward: {response.get('is_eligible_for_reward', False)}")
        
        # Test get all loyalty accounts (admin only)
        success, accounts = self.run_test(
            "Get All Loyalty Accounts",
            "GET",
            "/loyalty/all",
            200,
            token=self.admin_token
        )
        if success:
            self.log(f"   Total loyalty accounts: {len(accounts)}")
        
        # Test claim loyalty reward (staff only) - only if eligible
        if success and response.get('is_eligible_for_reward'):
            self.run_test(
                "Claim Loyalty Reward",
                "POST",
                f"/loyalty/{test_phone}/claim",
                200,
                data={"order_id": self.test_order_id},
                token=self.admin_token
            )

    def test_admin_exports(self):
        """Test admin CSV export v2.0 features"""
        self.log("📊 Testing Admin Exports (v2.0)", "INFO")
        
        if not self.admin_token:
            self.log("⚠️ Skipping export tests - no admin token", "WARN")
            return
        
        # Test various export scopes
        export_scopes = [
            "orders",
            "order_items", 
            "customers_basic",
            "loyalty_accounts",
            "loyalty_events",
            "menu_products",
            "users"
        ]
        
        for scope in export_scopes:
            # Note: These return CSV files, so we expect different content-type
            # but 200 status should still work
            success, _ = self.run_test(
                f"Export {scope.title()}",
                "GET",
                f"/admin/exports/{scope}",
                200,
                token=self.admin_token
            )
            if success:
                self.log(f"   ✅ {scope} export available")

    def test_manual_order_creation(self):
        """Test manual order creation (phone orders)"""
        self.log("📞 Testing Manual Order Creation", "INFO")
        
        if not self.test_product_id or not self.admin_token:
            self.log("⚠️ Skipping manual order tests - missing requirements", "WARN")
            return
        
        self.run_test(
            "Create Manual Order",
            "POST",
            "/orders/manual",
            200,
            data={
                "items": [{"product_id": self.test_product_id, "quantite": 1}],
                "customer_name": "Phone Customer",
                "customer_phone": "0987654321",
                "type_fulfillment": "A_EMPORTER",
                "payment_mode": "SUR_PLACE"
            },
            token=self.admin_token
        )

    def cleanup_test_data(self):
        """Clean up test data"""
        self.log("🧹 Cleaning up test data", "INFO")
        
        if self.test_product_id and self.admin_token:
            self.run_test(
                "Delete Test Product",
                "DELETE",
                f"/menu/products/{self.test_product_id}",
                200,
                token=self.admin_token
            )
        
        if self.test_category_id and self.admin_token:
            self.run_test(
                "Delete Test Category",
                "DELETE",
                f"/menu/categories/{self.test_category_id}",
                200,
                token=self.admin_token
            )

    def run_all_tests(self):
        """Run all test suites"""
        self.log("🚀 Starting O'Delices Backend API Tests", "INFO")
        self.log(f"🌐 Testing against: {self.base_url}", "INFO")
        
        try:
            # Test basic connectivity
            self.run_test("API Health Check", "GET", "/", 200)
            
            # Run test suites
            self.test_authentication()
            self.test_menu_management()
            self.test_order_workflow()
            self.test_kitchen_operations()
            self.test_cashier_operations()
            self.test_admin_operations()
            self.test_manual_order_creation()
            
            # Test v2.0 features
            self.test_capacity_scheduling()
            self.test_loyalty_program()
            self.test_admin_exports()
            
            # Cleanup
            self.cleanup_test_data()
            
        except Exception as e:
            self.log(f"💥 Test suite failed with error: {e}", "ERROR")
        
        # Print results
        self.print_results()

    def print_results(self):
        """Print test results summary"""
        self.log("=" * 60, "INFO")
        self.log("📊 TEST RESULTS SUMMARY", "INFO")
        self.log("=" * 60, "INFO")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        self.log(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}", "INFO")
        self.log(f"📈 Success Rate: {success_rate:.1f}%", "INFO")
        
        if self.failed_tests:
            self.log("❌ Failed Tests:", "ERROR")
            for failure in self.failed_tests:
                self.log(f"   - {failure}", "ERROR")
        
        if success_rate >= 90:
            self.log("🎉 Backend API tests PASSED!", "INFO")
            return 0
        else:
            self.log("💥 Backend API tests FAILED!", "ERROR")
            return 1

def main():
    """Main test runner"""
    tester = ODelicesAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())