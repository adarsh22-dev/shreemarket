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

    # Reset VM repo to match local (discard local changes on VM)
    run_ssh_command(ssh, """
        cd ~/s_market_updated && 
        git fetch origin && 
        git reset --hard origin/main
    """, "Reset VM repo to match origin/main")

    # Build backend using mvn (not mvnw)
    run_ssh_command(ssh, """
        cd ~/s_market_updated/s_market_backend && 
        mvn clean package -DskipTests
    """, "Build backend with mvn")

    # Kill existing backend
    run_ssh_command(ssh, "pkill -f 'spring-boot:run' || pkill -f 's_market_backend' || true", "Kill existing backend")

    # Start backend in background
    run_ssh_command(ssh, """
        cd ~/s_market_updated/s_market_backend && 
        nohup mvn spring-boot:run > backend.log 2>&1 &
        sleep 15
        tail -30 backend.log
    """, "Start backend")

    # Check if backend is up
    run_ssh_command(ssh, "sleep 5 && curl -s http://localhost:8082/api/admin/maintenance/status || true", "Check maintenance status")

    # Verify API works
    run_ssh_command(ssh, "curl -s http://localhost:8082/api/categories | head -c 500", "Test categories API")
    run_ssh_command(ssh, "curl -s http://localhost:8082/api/products/featured | head -c 500", "Test featured products API")
    run_ssh_command(ssh, "curl -s http://localhost:8082/api/testimonials/active | head -c 500", "Test testimonials API")

    ssh.close()
    print("\nDeployment complete!")
    return 0

if __name__ == "__main__":
    sys.exit(main())