#!/usr/bin/env python3
import paramiko
import sys

VM_HOST = "10.31.6.237"
VM_USER = "user1"
VM_PASS = "@spiriN"

def run_cmd(ssh, cmd, desc=""):
    print(f"\n>>> {desc or cmd[:80]}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=120)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print(f"STDERR: {err}")
    return exit_status

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VM_HOST, username=VM_USER, password=VM_PASS, timeout=30)
    print("Connected!")

    # Fix DB schema
    SQL = r"""
mysql -u root -psmarketdb smarketdb -e "
-- users
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at BIGINT;

-- vendors
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deleted_at BIGINT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS reset_token_expiry BIGINT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS created_at BIGINT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS updated_at BIGINT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_email VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS terms_and_condition TINYINT(1);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS marketplace_policies TINYINT(1);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_rules TINYINT(1);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS privacy_policy TINYINT(1);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS newsletter TINYINT(1);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pan VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gst VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rating DOUBLE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS order_count INT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_revenue DOUBLE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tier VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS commission_rate DOUBLE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS settings TEXT;

-- products
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at BIGINT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status VARCHAR(255) DEFAULT 'Pending';
ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_id BIGINT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_only TINYINT(1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS supports_wholesale TINYINT(1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_discount_type VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price DOUBLE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_wholesale_quantity INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer_layout VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS instagram_feed_layout VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS instagram_feed_config TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at BIGINT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at BIGINT;

-- categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

-- sub_categories
ALTER TABLE sub_categories ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE sub_categories ADD COLUMN IF NOT EXISTS deleted_at BIGINT;
ALTER TABLE sub_categories ADD COLUMN IF NOT EXISTS sort_order INT;

-- brands
ALTER TABLE brands ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

-- coupons
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

-- banners
ALTER TABLE banners ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

-- blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

-- faqs
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

-- delivery_partners
ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

-- tax_rates
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

-- flash_sales
ALTER TABLE flash_sales ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE flash_sales ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

-- shipping_zones
ALTER TABLE shipping_zones ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE shipping_zones ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

-- size_guides
ALTER TABLE size_guides ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE size_guides ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

-- testimonials
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS deleted_at BIGINT;

SELECT 'SCHEMA FIX COMPLETE' AS status;
"
"""
    run_cmd(ssh, SQL, "Fix missing DB columns")

    # Pull latest code
    run_cmd(ssh, "cd ~/s_market_updated && git fetch origin && git reset --hard origin/main && git pull origin main 2>&1", "Pull latest code")

    # Build backend
    run_cmd(ssh, "cd ~/s_market_updated/s_market_backend && mvn clean package -DskipTests 2>&1 | tail -20", "Build backend")

    # Kill old backend
    run_cmd(ssh, "pkill -f 'spring-boot:run' || pkill -f 's_market_backend' || true", "Kill old backend")

    # Start backend
    run_cmd(ssh, "cd ~/s_market_updated/s_market_backend && nohup mvn spring-boot:run > backend.log 2>&1 &", "Start backend")

    ssh.close()
    print("\nDone!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
