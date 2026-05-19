#!/bin/bash
# ================================================================
#  搭子星 (DaziStar) — 编译与发布脚本 (生产环境)
#  用途: 在服务器上拉取最新代码 → 构建 → 部署生产环境
#  使用:
#    bash scripts/deploy.sh             部署生产环境
#    bash scripts/deploy.sh --rollback  手动选择备份回滚
#
#  如需单独部署:
#    bash scripts/deploy-test.sh        仅测试环境 (3001)
#
#  前置条件 (仅需一次):
#    - Node.js 18+ / npm
#    - PM2 已安装
#    - .env 文件已配置
#    - PostgreSQL 数据库已就绪
# ================================================================

LOG_PREFIX="deploy"
ROLLBACK_APPS="dazistar"

source "$(dirname "$0")/_deploy_lib.sh"
BUILD_LOG="${LOG_DIR}/${LOG_PREFIX}-${BUILD_TIMESTAMP}.log"

print_summary() {
  echo ""
  echo -e "${CYAN}============================================================${NC}"
  echo -e "${GREEN}  搭子星 部署成功!${NC}"
  echo -e "${CYAN}============================================================${NC}"
  echo -e "  目标环境: 生产 (3000) + 测试 (3001)"
  echo -e "  提交版本: $(cd "$PROJECT_DIR" && git rev-parse --short HEAD)"
  echo -e "  分支:     $(cd "$PROJECT_DIR" && git rev-parse --abbrev-ref HEAD)"
  echo -e "  构建时间: ${BUILD_TIMESTAMP}"
  echo -e "  构建日志: ${BUILD_LOG}"
  echo ""
  echo -e "  常用命令:"
  echo -e "    pm2 status                查看进程状态"
  echo -e "    pm2 logs dazistar         查看生产环境日志"
  echo -e "    pm2 monit                 资源监控面板"
  echo -e "    bash scripts/deploy-test.sh   仅部署测试"
  echo ""
  echo -e "  回滚命令:"
  echo -e "    bash scripts/deploy.sh --rollback"
  echo -e "${CYAN}============================================================${NC}"
}

manual_rollback() {
  header "手动回滚"

  cd "$PROJECT_DIR"

  local backups=$(ls -1dt ${BACKUP_DIR}/.next-* 2>/dev/null || true)
  if [ -z "$backups" ]; then
    die "没有可用的备份"
  fi

  echo "可用备份:"
  local i=1
  local backup_array=()
  while IFS= read -r line; do
    echo "  $i) $line"
    backup_array+=("$line")
    ((i++))
  done <<< "$backups"

  read -rp "选择要恢复的备份 (1-${#backup_array[@]}): " choice
  if [ -z "$choice" ] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#backup_array[@]}" ]; then
    die "无效选择"
  fi

  local selected="${backup_array[$((choice-1))]}"
  info "恢复备份: $selected"

  rm -rf "${PROJECT_DIR}/.next"
  cp -r "$selected" "${PROJECT_DIR}/.next"
  pm2 restart dazistar 2>&1 | tee -a "$BUILD_LOG" || true

  ok "已回滚到 $selected"
}

main() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║     搭子星 编译与发布 (生产 + 测试)         ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"

  if [ "${1:-}" = "--rollback" ]; then
    manual_rollback
    exit 0
  fi

  [ $# -gt 0 ] && die "未知参数: $* (可用: --rollback)"

  preflight_check
  pull_code
  install_deps
  build_project

  header "5/6 部署发布"
  deploy_one "dazistar" "生产环境(3000)"

  header "6/6 健康检查"
  health_check_one "dazistar" "生产环境(3000)" "3000" "true"

  cleanup
  print_summary
}

main "$@"
