#!/bin/bash
# ================================================================
#  搭子星 (DaziStar) — 部署公共函数库
#  被 deploy.sh / deploy-prod.sh / deploy-test.sh 引用
#
#  引用前需设置以下变量:
#    DEPLOY_APP_NAME  - PM2 应用名
#    DEPLOY_PORT      - 端口号
#    DEPLOY_LABEL     - 环境标签
#    LOG_PREFIX       - 日志文件前缀
#    ROLLBACK_APPS    - 回滚时重启的 app 列表 (空格分隔)
# ================================================================

set -euo pipefail

# scripts/ 绝对路径（source 时解析，避免 build 中 cd 后相对路径失效）
_SCRIPT_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ================================================================
# 共享配置
# ================================================================
PROJECT_DIR="${PROJECT_DIR:-/www/dazistar}"
BACKUP_DIR="${PROJECT_DIR}/backups"
LOG_DIR="${PROJECT_DIR}/logs"
ENV_FILE="${PROJECT_DIR}/.env"
HEALTH_RETRIES=12
HEALTH_INTERVAL=3
BUILD_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BUILD_LOG="${LOG_DIR}/deploy-${BUILD_TIMESTAMP}.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ================================================================
# 工具函数
# ================================================================
log()   { echo -e "[$(date '+%H:%M:%S')] $*" | tee -a "$BUILD_LOG"; }
info()  { log "${BLUE}[INFO]${NC} $*"; }
ok()    { log "${GREEN}[ OK ]${NC} $*"; }
warn()  { log "${YELLOW}[WARN]${NC} $*"; }
err()   { log "${RED}[ERR ]${NC} $*"; }
header(){ echo -e "\n${CYAN}============================================================${NC}" | tee -a "$BUILD_LOG"
          log "${CYAN}>>> $*${NC}"
          echo -e "${CYAN}============================================================${NC}\n" | tee -a "$BUILD_LOG"; }

die() {
  err "$*"
  err "部署失败，日志: $BUILD_LOG"
  exit 1
}

# ================================================================
# 1. 前置检查
# ================================================================
preflight_check() {
  mkdir -p "$LOG_DIR" "$BACKUP_DIR"

  header "1/7 前置检查"

  [ "$(id -u)" = "0" ] && warn "当前以 root 用户运行，建议使用普通用户以避免安全风险"

  command -v node  &>/dev/null || die "Node.js 未安装"
  command -v npm   &>/dev/null || die "npm 未安装"
  command -v pm2   &>/dev/null || die "PM2 未安装，请执行: npm install -g pm2"

  local node_ver=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$node_ver" -lt 18 ]; then
    die "Node.js 版本过低: $(node -v)，需要 >= 18"
  fi

  ensure_env

  ok "前置检查通过: Node $(node -v), npm $(npm -v), PM2 $(pm2 -v)"
}

# ================================================================
# 1.5 环境变量自动补齐
#   从 .env.example 读取所有 KEY，若 .env 中缺失则自动补入
#   本地只需维护 .env.example 并推送，服务器部署时自动合并
# ================================================================
ensure_env() {
  local env_example="${PROJECT_DIR}/.env.example"
  local env_file="$ENV_FILE"
  local added_count=0

  if [ ! -f "$env_example" ]; then
    warn ".env.example 不存在，跳过环境变量检查"
    return
  fi

  if [ ! -f "$env_file" ]; then
    info ".env 不存在，从 .env.example 生成模板..."
    cp "$env_example" "$env_file"
    warn "已从 .env.example 生成 .env，请编辑填入真实密钥: vim $env_file"
    return
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

    local key
    key=$(echo "$line" | sed -n 's/^[[:space:]]*\([A-Z_][A-Z0-9_]*\)=.*/\1/p')
    [ -z "$key" ] && continue

    if ! grep -q "^[[:space:]]*${key}=" "$env_file" 2>/dev/null; then
      warn "补入缺失配置: $key"
      echo "$line" >> "$env_file"
      added_count=$((added_count + 1))
    fi
  done < "$env_example"

  if [ "$added_count" -gt 0 ]; then
    warn "已从 .env.example 补入 $added_count 项缺失配置，请检查 $env_file 并填入真实值"
  else
    ok ".env 配置完整"
  fi
}

# ================================================================
# 2. 拉取最新代码
# ================================================================
pull_code() {
  header "2/7 拉取最新代码"

  if [ ! -d "${PROJECT_DIR}/.git" ]; then
    die "项目目录不是 Git 仓库: $PROJECT_DIR"
  fi

  cd "$PROJECT_DIR"

  local had_local_modifications=false
  if ! git diff --quiet 2>/dev/null; then
    had_local_modifications=true
    warn "检测到本地修改，执行 git stash"
    git stash push -m "auto-stash-before-deploy-${BUILD_TIMESTAMP}"
  fi

  local before_commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

  git fetch origin
  local current_branch=$(git rev-parse --abbrev-ref HEAD)
  git reset --hard "origin/${current_branch}"

  git clean -fd -e logs/ -e backups/ -e data/ 2>&1 | tee -a "$BUILD_LOG" || warn "git clean 有警告，继续部署"

  local after_commit=$(git rev-parse --short HEAD)
  local commit_msg=$(git log -1 --pretty=%B)

  if [ "$before_commit" = "$after_commit" ] && [ "$had_local_modifications" = "false" ]; then
    ok "代码已是最新 (${after_commit})"
    if [ ! -d "${PROJECT_DIR}/.next" ]; then
      warn ".next 构建产物不存在，继续完整构建流程"
    else
      local commit_file="${PROJECT_DIR}/.next/BUILD_COMMIT"
      if [ -f "$commit_file" ]; then
        local saved_commit=$(cat "$commit_file" 2>/dev/null || echo "")
        if [ "$saved_commit" = "$after_commit" ]; then
          ok "构建产物匹配当前版本 (${after_commit})，跳过构建"
          exit 0
        else
          warn "构建产物版本不匹配 (${saved_commit} vs ${after_commit})，继续完整构建流程"
        fi
      else
        warn ".next/BUILD_COMMIT 文件不存在，继续完整构建流程"
      fi
    fi
  else
    if [ "$had_local_modifications" = "true" ]; then
      info "之前存在本地修改，即使代码已是最新也执行完整构建流程"
    else
      ok "代码更新: ${before_commit} → ${after_commit}"
      info "提交信息: ${commit_msg}"
    fi
  fi
}

# ================================================================
# 3. 安装依赖
# ================================================================
install_deps() {
  header "3/7 安装依赖"

  cd "$PROJECT_DIR"

  if [ -f "package-lock.json" ]; then
    npm ci --production=false 2>&1 | tee -a "$BUILD_LOG" || {
      warn "npm ci 失败，回退到 npm install"
      npm install 2>&1 | tee -a "$BUILD_LOG"
    }
  else
    npm install 2>&1 | tee -a "$BUILD_LOG"
  fi

  ok "依赖安装完成"
}

# ================================================================
# 4. 编译构建
# ================================================================
build_project() {
  header "4/7 编译构建"

  cd "$PROJECT_DIR"

  info "生成 Prisma Client ..."
  npx prisma generate 2>&1 | tee -a "$BUILD_LOG" || die "Prisma generate 失败"

  info "应用数据库迁移 (仅 migrate deploy，禁止 db push/reset) ..."
  bash "${_SCRIPT_LIB_DIR}/prisma-migrate-deploy.sh" 2>&1 | tee -a "$BUILD_LOG" \
    || die "数据库迁移失败，见日志与 docs/DATABASE-MIGRATIONS.md（切勿 db push / migrate reset）"

  info "TypeScript 类型检查 ..."
  npx tsc --noEmit 2>&1 | tee -a "$BUILD_LOG" || warn "TypeScript 类型检查有警告，继续构建"

  if [ -d "${PROJECT_DIR}/.next" ]; then
    local backup_path="${BACKUP_DIR}/.next-${BUILD_TIMESTAMP}"
    info "备份旧构建产物 → ${backup_path}"
    cp -r "${PROJECT_DIR}/.next" "$backup_path"
    echo "$backup_path" > "${BACKUP_DIR}/latest.txt"
  fi

  info "清除旧构建产物，确保全量构建..."
  rm -rf "${PROJECT_DIR}/.next"

  info "Next.js 构建 (这可能需要几分钟)..."
  npm run build 2>&1 | tee -a "$BUILD_LOG" || {
    err "构建失败! 正恢复旧构建产物..."
    rollback_build
    die "构建失败，已回滚到上一版本"
  }

  local current_commit=$(git rev-parse --short HEAD)
  echo "$current_commit" > "${PROJECT_DIR}/.next/BUILD_COMMIT"
  ok "构建完成 (已记录版本: ${current_commit})"
}

# ================================================================
# 5. 部署单个 PM2 应用
# ================================================================
deploy_one() {
  local app_name=$1
  local label=$2

  cd "$PROJECT_DIR"

  local pm2_online=$(pm2 jlist 2>/dev/null | grep -c "\"name\":\"${app_name}\"" || true)

  if [ "$pm2_online" -gt 0 ]; then
    info "[${label}] PM2 零停机重载 ..."
    pm2 reload "$app_name" --update-env 2>&1 | tee -a "$BUILD_LOG" || die "[${label}] PM2 reload 失败"
  else
    info "[${label}] 首次启动 PM2 ..."
    pm2 start ecosystem.config.js --only "$app_name" 2>&1 | tee -a "$BUILD_LOG" || die "[${label}] PM2 start 失败"
    pm2 save
  fi

  ok "[${label}] 部署完成"
}

# ================================================================
# 6. 单个端口健康检查
# ================================================================
health_check_one() {
  local app_name=$1
  local label=$2
  local port=$3
  local fatal=${4:-true}
  local url="http://localhost:${port}"

  info "等待 ${label} 就绪 (最多 ${HEALTH_RETRIES} 次, 间隔 ${HEALTH_INTERVAL}s)..."

  for i in $(seq 1 $HEALTH_RETRIES); do
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$http_code" != "000" ] && [ "$http_code" -lt 500 ]; then
      ok "${label} 健康检查通过 (HTTP ${http_code}) — 第 ${i} 次尝试"
      return 0
    fi

    if [ "$i" -lt "$HEALTH_RETRIES" ]; then
      sleep "$HEALTH_INTERVAL"
    fi
  done

  if [ "$fatal" = "true" ]; then
    warn "${label} 健康检查失败，尝试进程诊断:"
    pm2 status "$app_name" 2>&1 | tee -a "$BUILD_LOG"
    pm2 logs "$app_name" --lines 20 --nostream 2>&1 | tee -a "$BUILD_LOG"

    err "健康检查失败! 正执行回滚..."
    rollback_build
    die "健康检查失败，已回滚到上一版本"
  else
    warn "${label} 健康检查失败 (非致命)，继续..."
  fi
}

# ================================================================
# 回滚
# ================================================================
rollback_build() {
  header "回滚操作"

  cd "$PROJECT_DIR"

  local latest_backup
  if [ -f "${BACKUP_DIR}/latest.txt" ]; then
    latest_backup=$(cat "${BACKUP_DIR}/latest.txt")
  else
    die "没有可用的备份，无法回滚"
  fi

  if [ ! -d "$latest_backup" ]; then
    die "备份目录不存在: $latest_backup"
  fi

  warn "从备份恢复: $latest_backup"
  rm -rf "${PROJECT_DIR}/.next"
  cp -r "$latest_backup" "${PROJECT_DIR}/.next"

  for app in $ROLLBACK_APPS; do
    pm2 restart "$app" 2>&1 | tee -a "$BUILD_LOG" || true
  done

  warn "已回滚到上一版本，请检查应用状态"
}

# ================================================================
# 7. 清理与收尾
# ================================================================
cleanup() {
  header "7/7 清理"

  cd "$PROJECT_DIR"

  local backup_count=$(ls -1d ${BACKUP_DIR}/.next-* 2>/dev/null | wc -l)
  if [ "$backup_count" -gt 5 ]; then
    info "清理旧备份 (保留最近5个)..."
    ls -1dt ${BACKUP_DIR}/.next-* | tail -n +6 | xargs rm -rf
  fi

  find "$LOG_DIR" \( -name "deploy-*.log" -o -name "deploy-prod-*.log" -o -name "deploy-test-*.log" \) -mtime +30 -delete 2>/dev/null || true

  ok "清理完成"
}
