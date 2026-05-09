#!/bin/bash
# ================================================================
#  搭子星 (DaziStar) — 生产环境编译与发布脚本
#  使用: bash scripts/deploy-prod.sh
#  目标: PM2 dazistar, 端口 3000
# ================================================================

DEPLOY_APP_NAME="dazistar"
DEPLOY_PORT="3000"
DEPLOY_LABEL="生产环境(3000)"
LOG_PREFIX="deploy-prod"
ROLLBACK_APPS="$DEPLOY_APP_NAME"

# 生产环境的项目目录
PROJECT_DIR="/www/dazistar"
BACKUP_DIR="${PROJECT_DIR}/backups"
ENV_FILE="${PROJECT_DIR}/.env"

source "$(dirname "$0")/_deploy_lib.sh"
BUILD_LOG="${LOG_DIR}/${LOG_PREFIX}-${BUILD_TIMESTAMP}.log"

print_summary() {
  echo ""
  echo -e "${CYAN}============================================================${NC}"
  echo -e "${GREEN}  搭子星 (生产环境) 部署成功!${NC}"
  echo -e "${CYAN}============================================================${NC}"
  echo -e "  目标端口: ${DEPLOY_PORT}"
  echo -e "  提交版本: $(cd "$PROJECT_DIR" && git rev-parse --short HEAD)"
  echo -e "  分支:     $(cd "$PROJECT_DIR" && git rev-parse --abbrev-ref HEAD)"
  echo -e "  构建时间: ${BUILD_TIMESTAMP}"
  echo -e "  构建日志: ${BUILD_LOG}"
  echo ""
  echo -e "  常用命令:"
  echo -e "    pm2 logs dazistar         查看实时日志"
  echo -e "    pm2 status                查看进程状态"
  echo -e "    bash scripts/deploy-test.sh  部署测试环境"
  echo -e "    bash scripts/deploy.sh        同时部署生产+测试"
  echo -e "${CYAN}============================================================${NC}"
}

main() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║    搭子星 编译与发布 (生产环境 3000)        ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"

  preflight_check
  pull_code
  install_deps
  build_project
  header "5/7 部署发布"
  deploy_one "$DEPLOY_APP_NAME" "$DEPLOY_LABEL"
  header "6/7 健康检查"
  health_check_one "$DEPLOY_APP_NAME" "$DEPLOY_LABEL" "$DEPLOY_PORT" "true"
  cleanup
  print_summary
}

main "$@"
