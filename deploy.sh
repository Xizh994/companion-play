#!/bin/bash
# ================================================================
# 搭子星（DaziStar）一键部署脚本
# 服务器：43.140.68.245 (OpenCloudOS 8)
# 域名：dazistar.com
# ================================================================

set -e
echo "🚀 搭子星部署开始..."

# ================================================================
# 1. 安装系统依赖
# ================================================================
echo ""
echo "=== [1/8] 安装系统依赖 ==="
dnf install -y curl wget git nginx postgresql-server postgresql-contrib

# ================================================================
# 2. 安装 Node.js 22
# ================================================================
echo ""
echo "=== [2/8] 安装 Node.js 22 ==="
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    dnf install -y nodejs
fi
node --version
npm --version

# ================================================================
# 3. 安装 PM2
# ================================================================
echo ""
echo "=== [3/8] 安装 PM2 ==="
npm install -g pm2
pm2 --version

# ================================================================
# 4. 初始化 PostgreSQL
# ================================================================
echo ""
echo "=== [4/8] 初始化 PostgreSQL ==="
if [ ! -d /var/lib/pgsql/data ]; then
    postgresql-setup --initdb
fi
systemctl enable postgresql
systemctl start postgresql

# 创建数据库和用户
sudo -u postgres psql -c "CREATE USER dazistar WITH PASSWORD 'DaziStar2026!';" 2>/dev/null || echo "用户已存在"
sudo -u postgres psql -c "CREATE DATABASE dazistar OWNER dazistar;" 2>/dev/null || echo "数据库已存在"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dazistar TO dazistar;"

# 修改 pg_hba.conf 允许密码认证
sed -i 's/ident/md5/g' /var/lib/pgsql/data/pg_hba.conf
sed -i 's/peer/md5/g' /var/lib/pgsql/data/pg_hba.conf
systemctl restart postgresql

echo "✓ PostgreSQL 已启动，数据库：dazistar"

# ================================================================
# 5. 克隆代码
# ================================================================
echo ""
echo "=== [5/8] 克隆代码 ==="
cd /www
mkdir -p /www
cd /www

if [ -d "dazistar" ]; then
    echo "目录已存在，拉取最新代码..."
    cd dazistar && git pull
else
    git clone https://github.com/Xizh994/companion-play.git dazistar
    cd dazistar
fi

# ================================================================
# 6. 配置环境变量
# ================================================================
echo ""
echo "=== [6/8] 配置环境变量 ==="
cat > /www/dazistar/.env << 'EOF'
# 数据库
DATABASE_URL="postgresql://dazistar:DaziStar2026!@localhost:5432/dazistar"

# NextAuth
NEXTAUTH_URL="https://dazistar.com"
NEXTAUTH_SECRET="dazistar-secret-key-2026-please-change-in-production"

# 应用配置
NODE_ENV="production"
PORT=3000
EOF

echo "✓ .env 已生成"

# ================================================================
# 7. 安装依赖 + 构建
# ================================================================
echo ""
echo "=== [7/8] 安装依赖并构建 ==="
cd /www/dazistar
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run build

# ================================================================
# 8. 配置 Nginx + SSL
# ================================================================
echo ""
echo "=== [8/8] 配置 Nginx ==="

cat > /etc/nginx/conf.d/dazistar.conf << 'EOF'
server {
    listen 80;
    server_name dazistar.com www.dazistar.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启动 Nginx
systemctl enable nginx
nginx -t && systemctl restart nginx

# 安装 certbot 并申请 SSL（需要先确保域名解析已生效）
echo ""
echo "=== 申请 SSL 证书 ==="
dnf install -y certbot python3-certbot-nginx
certbot --nginx -d dazistar.com -d www.dazistar.com --non-interactive --agree-tos --email admin@dazistar.com || echo "SSL 申请失败，请手动执行"

# ================================================================
# 9. 启动应用（PM2）
# ================================================================
echo ""
echo "=== 启动应用 ==="
cd /www/dazistar
pm2 start npm --name "dazistar" -- start
pm2 save
pm2 startup

# ================================================================
# 完成
# ================================================================
echo ""
echo "========================================"
echo "🎉 搭子星部署完成！"
echo ""
echo "🌐 访问地址：https://dazistar.com"
echo "📊 PM2 状态：pm2 status"
echo "📋 查看日志：pm2 logs dazistar"
echo ""
echo "如果域名还没解析，请先去腾讯云 DNS 添加："
echo "  A记录：dazistar.com → 43.140.68.245"
echo "========================================"
