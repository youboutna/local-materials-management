#!/usr/bin/env python3
"""
Mauritanian Materials Management System - Management Script
Usage: python3 scripts/manage.py [command] [options]
"""

import os
import sys
import json
import subprocess
import argparse
import logging
from pathlib import Path
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ProjectManager:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.config_file = self.project_root / 'scripts' / 'config.json'
        self.load_config()
    
    def load_config(self):
        """Load configuration from config.json or create default"""
        if self.config_file.exists():
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        else:
            self.config = {
                "database": {
                    "host": "localhost",
                    "port": 5432,
                    "database": "mauritanian_materials",
                    "user": "app_user"
                },
                "supabase": {
                    "local_url": "http://localhost:54321",
                    "local_anon_key": ""
                },
                "backup": {
                    "directory": "./backups",
                    "retention_days": 30
                }
            }
            self.save_config()
    
    def save_config(self):
        """Save configuration to file"""
        os.makedirs(self.config_file.parent, exist_ok=True)
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def run_command(self, command, capture_output=False):
        """Run shell command"""
        logger.info(f"Running: {command}")
        try:
            if capture_output:
                result = subprocess.run(command, shell=True, capture_output=True, text=True)
                return result.stdout.strip()
            else:
                subprocess.run(command, shell=True, check=True)
                return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Command failed: {e}")
            return False
    
    def get_db_connection(self):
        """Get database connection"""
        try:
            # Try to read password from .env.local
            env_file = self.project_root / '.env.local'
            if env_file.exists():
                with open(env_file, 'r') as f:
                    for line in f:
                        if line.startswith('DB_CONNECTION_STRING='):
                            conn_string = line.split('=', 1)[1].strip()
                            return psycopg2.connect(conn_string, cursor_factory=RealDictCursor)
            
            # Fallback to config
            password = input("Enter database password: ")
            return psycopg2.connect(
                host=self.config['database']['host'],
                port=self.config['database']['port'],
                database=self.config['database']['database'],
                user=self.config['database']['user'],
                password=password,
                cursor_factory=RealDictCursor
            )
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return None
    
    def install_dependencies(self):
        """Install project dependencies"""
        logger.info("Installing dependencies...")
        
        # Check Node.js
        node_version = self.run_command("node --version", capture_output=True)
        if not node_version:
            logger.error("Node.js not found. Please install Node.js 18+")
            return False
        
        logger.info(f"Node.js version: {node_version}")
        
        # Install npm dependencies
        if not self.run_command("npm install"):
            logger.error("Failed to install npm dependencies")
            return False
        
        # Install Python dependencies
        requirements_file = self.project_root / 'requirements.txt'
        if requirements_file.exists():
            self.run_command("pip3 install -r requirements.txt")
        
        logger.info("Dependencies installed successfully")
        return True
    
    def build_project(self):
        """Build the project"""
        logger.info("Building project...")
        
        if not self.run_command("npm run build"):
            logger.error("Build failed")
            return False
        
        logger.info("Project built successfully")
        return True
    
    def start_services(self, use_docker=False):
        """Start project services"""
        logger.info("Starting services...")
        
        if use_docker:
            if not self.run_command("docker-compose up -d"):
                logger.error("Failed to start Docker services")
                return False
        else:
            # Start development server
            if not self.run_command("npm run dev &"):
                logger.error("Failed to start development server")
                return False
        
        logger.info("Services started successfully")
        return True
    
    def stop_services(self):
        """Stop project services"""
        logger.info("Stopping services...")
        
        # Stop Docker services
        self.run_command("docker-compose down")
        
        # Stop PM2 processes
        self.run_command("pm2 stop all")
        
        logger.info("Services stopped")
    
    def backup_database(self):
        """Create database backup"""
        logger.info("Creating database backup...")
        
        backup_dir = Path(self.config['backup']['directory'])
        backup_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = backup_dir / f"backup_{timestamp}.sql"
        
        # Create backup
        db_config = self.config['database']
        backup_cmd = f"pg_dump -h {db_config['host']} -p {db_config['port']} -U {db_config['user']} -d {db_config['database']} > {backup_file}"
        
        if self.run_command(backup_cmd):
            logger.info(f"Backup created: {backup_file}")
            self.cleanup_old_backups()
            return str(backup_file)
        else:
            logger.error("Backup failed")
            return None
    
    def cleanup_old_backups(self):
        """Remove old backup files"""
        backup_dir = Path(self.config['backup']['directory'])
        retention_days = self.config['backup']['retention_days']
        
        if not backup_dir.exists():
            return
        
        cutoff_time = datetime.now().timestamp() - (retention_days * 24 * 60 * 60)
        
        for backup_file in backup_dir.glob("backup_*.sql"):
            if backup_file.stat().st_mtime < cutoff_time:
                backup_file.unlink()
                logger.info(f"Removed old backup: {backup_file}")
    
    def restore_database(self, backup_file):
        """Restore database from backup"""
        logger.info(f"Restoring database from: {backup_file}")
        
        if not Path(backup_file).exists():
            logger.error(f"Backup file not found: {backup_file}")
            return False
        
        db_config = self.config['database']
        restore_cmd = f"psql -h {db_config['host']} -p {db_config['port']} -U {db_config['user']} -d {db_config['database']} < {backup_file}"
        
        if self.run_command(restore_cmd):
            logger.info("Database restored successfully")
            return True
        else:
            logger.error("Database restore failed")
            return False
    
    def run_migrations(self):
        """Run database migrations"""
        logger.info("Running database migrations...")
        
        migrations_dir = self.project_root / 'supabase' / 'migrations'
        if not migrations_dir.exists():
            logger.warning("No migrations directory found")
            return True
        
        conn = self.get_db_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            
            # Create migrations table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS migrations (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) UNIQUE NOT NULL,
                    applied_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
            # Get applied migrations
            cursor.execute("SELECT filename FROM migrations")
            applied_migrations = {row['filename'] for row in cursor.fetchall()}
            
            # Apply new migrations
            migration_files = sorted(migrations_dir.glob('*.sql'))
            for migration_file in migration_files:
                if migration_file.name not in applied_migrations:
                    logger.info(f"Applying migration: {migration_file.name}")
                    
                    with open(migration_file, 'r') as f:
                        migration_sql = f.read()
                    
                    cursor.execute(migration_sql)
                    cursor.execute("INSERT INTO migrations (filename) VALUES (%s)", (migration_file.name,))
                    conn.commit()
                    
                    logger.info(f"Applied: {migration_file.name}")
            
            conn.close()
            logger.info("Migrations completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            if conn:
                conn.rollback()
                conn.close()
            return False
    
    def check_status(self):
        """Check system status"""
        logger.info("Checking system status...")
        
        status = {
            "node": self.run_command("node --version", capture_output=True),
            "npm": self.run_command("npm --version", capture_output=True),
            "docker": self.run_command("docker --version", capture_output=True),
            "postgres": self.run_command("psql --version", capture_output=True)
        }
        
        # Check database connection
        conn = self.get_db_connection()
        status["database"] = "Connected" if conn else "Failed"
        if conn:
            conn.close()
        
        # Check if services are running
        status["docker_compose"] = "Running" if self.run_command("docker-compose ps", capture_output=True) else "Stopped"
        
        print("\n📊 System Status:")
        print("=" * 50)
        for service, state in status.items():
            print(f"{service:15}: {state}")
        print("=" * 50)
        
        return status
    
    def setup_ssl(self, domain):
        """Setup SSL with Let's Encrypt"""
        logger.info(f"Setting up SSL for domain: {domain}")
        
        # Install certbot
        self.run_command("sudo apt-get update")
        self.run_command("sudo apt-get install -y certbot python3-certbot-nginx")
        
        # Get certificate
        ssl_cmd = f"sudo certbot --nginx -d {domain} --non-interactive --agree-tos --email admin@{domain}"
        
        if self.run_command(ssl_cmd):
            logger.info("SSL certificate installed successfully")
            
            # Setup auto-renewal
            self.run_command("sudo crontab -l | grep -q certbot || (crontab -l ; echo '0 12 * * * /usr/bin/certbot renew --quiet') | crontab -")
            
            return True
        else:
            logger.error("SSL setup failed")
            return False

def main():
    parser = argparse.ArgumentParser(description='Mauritanian Materials Management System')
    parser.add_argument('command', choices=[
        'install', 'build', 'start', 'stop', 'backup', 'restore', 
        'migrate', 'status', 'ssl', 'config'
    ], help='Command to execute')
    parser.add_argument('--docker', action='store_true', help='Use Docker for deployment')
    parser.add_argument('--file', help='File path for restore command')
    parser.add_argument('--domain', help='Domain name for SSL setup')
    
    args = parser.parse_args()
    
    manager = ProjectManager()
    
    try:
        if args.command == 'install':
            manager.install_dependencies()
        
        elif args.command == 'build':
            manager.build_project()
        
        elif args.command == 'start':
            manager.start_services(use_docker=args.docker)
        
        elif args.command == 'stop':
            manager.stop_services()
        
        elif args.command == 'backup':
            backup_file = manager.backup_database()
            if backup_file:
                print(f"✅ Backup created: {backup_file}")
        
        elif args.command == 'restore':
            if not args.file:
                print("❌ --file argument required for restore")
                sys.exit(1)
            manager.restore_database(args.file)
        
        elif args.command == 'migrate':
            manager.run_migrations()
        
        elif args.command == 'status':
            manager.check_status()
        
        elif args.command == 'ssl':
            if not args.domain:
                print("❌ --domain argument required for SSL setup")
                sys.exit(1)
            manager.setup_ssl(args.domain)
        
        elif args.command == 'config':
            print(f"📋 Configuration file: {manager.config_file}")
            print(json.dumps(manager.config, indent=2))
    
    except KeyboardInterrupt:
        logger.info("Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()