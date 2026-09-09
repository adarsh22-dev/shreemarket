#!/usr/bin/env python3
import paramiko
import time
import sys

VM_HOST = "10.31.6.237"
VM_USER = "user1"
VM_PASS = "@spiriN"

def run_ssh_command(ssh, command, description=""):
    print(f"\n{'='*60}")
    print(f"Running: {description or command}")
    print(f"{'='*60}")
    stdin, stdout, stderr = ssh.exec_command(command, get_pty=True)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    error = stderr.read().decode()
    if output:
        print(output)
    if error:
        print(f"STDERR: {error}", file=sys.stderr)
    print(f"Exit status: {exit_status}")
    return exit_status, output, error

def main():
    print(f"Connecting to {VM_USER}@{VM_HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VM_HOST, username=VM_USER, password=VM_PASS, timeout=30)
        print("Connected successfully!")
    except Exception as e:
        print(f"Failed to connect: {e}")
        return 1

    # Step 1: Fix database schema - add missing columns
    print("\n" + "="*60)
    print("STEP 1: Fixing database schema - adding missing columns")
    print("="*60)

    SQL_FIX = """
DB_PASS=$(grep -oP 'DB_PASSWORD=\K.*' ~/s_market_updated/s_market_backend/.env 2>/dev/null || echo "smarketdb")
if [ -z "$DB_PASS" ] || [ "$DB_PASS" = "smarketdb" ]; then
    DB_PASS=$(grep -oP 'spring\.datasource\.password=\K.*' ~/s_market_updated/s_market_backend/src/main/resources/application.properties 2>/dev/null || echo "smarketdb")
fi
echo "Using DB password: $DB_PASS"

# Function to add column if missing
add_column() {
    local table=$1
    local col=$2
    local dtype=$3
    local default=$4
    mysql -u root -p"$DB_PASS" smarketdb -e "
        SELECT COUNT(*) INTO @exists FROM information_schema.columns
        WHERE table_schema='smarketdb' AND table_name='$table' AND column_name='$col';
        SET @sql = IF(@exists = 0,
            CONCAT('ALTER TABLE $table ADD COLUMN $col $dtype $default'),
            'SELECT 1'
        );
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    " 2>/dev/null && echo "  OK: $table.$col" || echo "  SKIP/ERR: $table.$col"
}

echo ""
echo "--- users table ---"
add_column "users" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "users" "deleted_at" "BIGINT" ""
add_column "users" "reset_token" "VARCHAR(255)" ""
add_column "users" "reset_token_expiry" "BIGINT" ""
add_column "users" "created_at" "BIGINT" ""
add_column "users" "updated_at" "BIGINT" ""

echo ""
echo "--- vendors table ---"
add_column "vendors" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "vendors" "deleted_at" "BIGINT" ""
add_column "vendors" "reset_token" "VARCHAR(255)" ""
add_column "vendors" "reset_token_expiry" "BIGINT" ""
add_column "vendors" "created_at" "BIGINT" ""
add_column "vendors" "updated_at" "BIGINT" ""
add_column "vendors" "payment_method" "VARCHAR(255)" ""
add_column "vendors" "payment_email" "VARCHAR(255)" ""
add_column "vendors" "terms_and_condition" "TINYINT(1)" ""
add_column "vendors" "marketplace_policies" "TINYINT(1)" ""
add_column "vendors" "vendor_rules" "TINYINT(1)" ""
add_column "vendors" "privacy_policy" "TINYINT(1)" ""
add_column "vendors" "newsletter" "TINYINT(1)" ""
add_column "vendors" "pan" "VARCHAR(255)" ""
add_column "vendors" "gst" "VARCHAR(255)" ""
add_column "vendors" "rating" "DOUBLE" ""
add_column "vendors" "order_count" "INT" ""
add_column "vendors" "total_revenue" "DOUBLE" ""
add_column "vendors" "tier" "VARCHAR(255)" ""
add_column "vendors" "kyc_status" "VARCHAR(255)" ""
add_column "vendors" "commission_rate" "DOUBLE" ""
add_column "vendors" "settings" "TEXT" ""

echo ""
echo "--- products table ---"
add_column "products" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "products" "deleted_at" "BIGINT" ""
add_column "products" "approval_status" "VARCHAR(255) DEFAULT 'Pending'" ""
add_column "products" "vendor_id" "BIGINT" ""
add_column "products" "is_featured" "TINYINT(1) DEFAULT 0" ""
add_column "products" "wholesale_only" "TINYINT(1)" ""
add_column "products" "supports_wholesale" "TINYINT(1)" ""
add_column "products" "wholesale_discount_type" "VARCHAR(255)" ""
add_column "products" "wholesale_price" "DOUBLE" ""
add_column "products" "minimum_wholesale_quantity" "INT" ""
add_column "products" "manufacturer_layout" "VARCHAR(255)" ""
add_column "products" "instagram_feed_layout" "VARCHAR(255)" ""
add_column "products" "instagram_feed_config" "TEXT" ""
add_column "products" "created_at" "BIGINT" ""
add_column "products" "updated_at" "BIGINT" ""

echo ""
echo "--- categories table ---"
add_column "categories" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "categories" "deleted_at" "BIGINT" ""

echo ""
echo "--- sub_categories table ---"
add_column "sub_categories" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "sub_categories" "deleted_at" "BIGINT" ""
add_column "sub_categories" "sort_order" "INT" ""

echo ""
echo "--- brands table ---"
add_column "brands" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "brands" "deleted_at" "BIGINT" ""

echo ""
echo "--- coupons table ---"
add_column "coupons" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "coupons" "deleted_at" "BIGINT" ""

echo ""
echo "--- banners table ---"
add_column "banners" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "banners" "deleted_at" "BIGINT" ""

echo ""
echo "--- blog_posts table ---"
add_column "blog_posts" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "blog_posts" "deleted_at" "BIGINT" ""

echo ""
echo "--- faqs table ---"
add_column "faqs" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "faqs" "deleted_at" "BIGINT" ""

echo ""
echo "--- delivery_partners table ---"
add_column "delivery_partners" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "delivery_partners" "deleted_at" "BIGINT" ""

echo ""
echo "--- tax_rates table ---"
add_column "tax_rates" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "tax_rates" "deleted_at" "BIGINT" ""

echo ""
echo "--- flash_sales table ---"
add_column "flash_sales" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "flash_sales" "deleted_at" "BIGINT" ""

echo ""
echo "--- shipping_zones table ---"
add_column "shipping_zones" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "shipping_zones" "deleted_at" "BIGINT" ""

echo ""
echo "--- size_guides table ---"
add_column "size_guides" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "size_guides" "deleted_at" "BIGINT" ""

echo ""
echo "--- testimonials table ---"
add_column "testimonials" "deleted" "TINYINT(1) DEFAULT 0" ""
add_column "testimonials" "deleted_at" "BIGINT" ""

echo ""
echo "--- Schema fix complete ---"
"""
    run_ssh_command(ssh, SQL_FIX, "Fix missing database columns")

    # Step 2: Push local code to git first
    print("\n" + "="*60)
    print("STEP 2: Push local code to git")
    print("="*60)
    run_ssh_command(ssh, """
        cd ~/s_market_updated &&
        git add -A &&
        git status
    """, "Check local changes")

    # Step 3: Pull latest code on VM
    print("\n" + "="*60)
    print("STEP 3: Pull latest code on VM")
    print("="*60)
    run_ssh_command(ssh, """
        cd ~/s_market_updated &&
        git fetch origin &&
        git reset --hard origin/main &&
        git pull origin main
    """, "Pull latest code")

    # Step 4: Build backend
    print("\n" + "="*60)
    print("STEP 4: Build backend")
    print("="*60)
    run_ssh_command(ssh, """
        cd ~/s_market_updated/s_market_backend &&
        mvn clean package -DskipTests
    """, "Build backend with mvn")

    # Step 5: Kill existing backend
    print("\n" + "="*60)
    print("STEP 5: Kill existing backend")
    print("="*60)
    run_ssh_command(ssh, "pkill -f 'spring-boot:run' || pkill -f 's_market_backend' || true", "Kill existing backend")
    time.sleep(3)

    # Step 6: Start backend
    print("\n" + "="*60)
    print("STEP 6: Start backend")
    print("="*60)
    run_ssh_command(ssh, """
        cd ~/s_market_updated/s_market_backend &&
        nohup mvn spring-boot:run > backend.log 2>&1 &
        echo "Backend starting... waiting 20s"
        sleep 20
        tail -40 backend.log
    """, "Start backend")

    # Step 7: Build frontend (Admin/Vendor UI)
    print("\n" + "="*60)
    print("STEP 7: Build frontend (Admin/Vendor UI)")
    print("="*60)
    run_ssh_command(ssh, """
        cd ~/s_market_updated/s_market_ui &&
        npm install && npm run build
    """, "Build Admin/Vendor frontend")

    # Step 8: Verify
    print("\n" + "="*60)
    print("STEP 8: Verify API endpoints")
    print("="*60)
    run_ssh_command(ssh, "sleep 5 && curl -s http://localhost:8082/api/admin/maintenance/status || true", "Check maintenance status")
    run_ssh_command(ssh, "curl -s http://localhost:8082/api/categories | head -c 500", "Test categories API")
    run_ssh_command(ssh, "curl -s http://localhost:8082/api/products/featured | head -c 500", "Test featured products API")
    run_ssh_command(ssh, "curl -s http://localhost:8082/api/testimonials/active | head -c 500", "Test testimonials API")
    run_ssh_command(ssh, "curl -s -X POST http://localhost:8082/api/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@smarket.com\",\"password\":\"admin123\"}' | head -c 500", "Test login API")

    ssh.close()
    print("\nDeployment complete!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
