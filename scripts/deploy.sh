#!/bin/bash
# ================================================================
#  搭子星 (DaziStar) — 编译与发布脚本 (生产 + 测试)
#  用途: 在服务器上拉取最新代码 → 分别构建两个环境 → 部署两个环境
#  使用:
#    bash scripts/deploy.sh             部署生产 + 测试
#    bash scripts/deploy.sh --rollback  手动选择备份回滚
#
#  如需单独部署:
#    bash scripts/deploy-prod.sh        仅生产环境 (3000)
#    bash scripts/deploy-test.sh        仅测试环境 (3001)
#
#  前置条件 (仅需一次):
#    - Node.js 18+ / npm
#    - PM2 已安装
#    - .env 文件已配置
#    - PostgreSQL 数据库已就绪
# ================================================================

source "$(dirname "$0")/_deploy_lib.sh"

print_summary() {
  echo ""
  echo -e "${CYAN}============================================================${NC}"
  echo -e "${GREEN}  搭子星 部署成功!${NC}"
  echo -e "${CYAN}============================================================${NC}"
  echo -e "  目标环境: 生产 (3000) + 测试 (3001)"
  echo ""
  echo -e "  常用命令:"
  echo -e "    pm2 status                查看进程状态"
  echo -e "    pm2 logs dazistar         查看生产环境日志"
  echo -e "    pm2 logs dazistar-3001    查看测试环境日志"
  echo -e "    pm2 monit                 资源监控面板"
  echo -e "    bash scripts/deploy-prod.sh   仅部署生产"
  echo -e "    bash scripts/deploy-test.sh   仅部署测试"
  echo ""
  echo -e "  回滚命令:"
  echo -e "    bash scripts/deploy.sh --rollback"
  echo -e "${CYAN}============================================================${NC}"
}

manual_rollback() {
  header "手动回滚"

  # 回滚生产环境
  local prod_dir="/www/dazistar"
  local prod_backups=$(ls -1dt ${prod_dir}/backups/.next-* 2>/dev/null || true)
  if [ -z "$prod_backups" ]; then
    warn "生产环境没有可用备份"
  else
    echo "生产环境可用备份:"
    local i=1
    local prod_backup_array=()
    while IFS= read -r line; do
      echo "  $i) $line"
      prod_backup_array+=("$line")
      ((i++))
    done <<< "$prod_backups"

    read -rp "选择要恢复的生产环境备份 (1-${#prod_backup_array[@]}, 或回车跳过): " prod_choice
    if [ -n "$prod_choice" ] && [ "$prod_choice" -ge 1 ] && [ "$prod_choice" -le "${#prod_backup_array[@]}" ]; then
      local selected="${prod_backup_array[$((prod_choice-1))]}"
      info "恢复生产环境: $selected"
      rm -rf "${prod_dir}/.next"
      cp -r "$selected" "${prod_dir}/.next"
      pm2 restart dazistar 2>&1 || true
      ok "生产环境已回滚"
    else
      info "跳过生产环境回滚"
    fi
  fi

  # 回滚测试环境
  local test_dir="/www/dazistar-test"
  local test_backups=$(ls -1dt ${test_dir}/backups/.next-* 2>/dev/null || true)
  if [ -z "$test_backups" ]; then
    warn "测试环境没有可用备份"
  else
    echo ""
    echo "测试环境可用备份:"
    local i=1
    local test_backup_array=()
    while IFS= read -r line; do
      echo "  $i) $line"
      test_backup_array+=("$line")
      ((i++))
    done <<< "$test_backups"

    read -rp "选择要恢复的测试环境备份 (1-${#test_backup_array[@]}, 或回车跳过): " test_choice
    if [ -n "$test_choice" ] && [ "$test_choice" -ge 1 ] && [ "$test_choice" -le "${#test_backup_array[@]}" ]; then
      local selected="${test_backup_array[$((test_choice-1))]}"
      info "恢复测试环境: $selected"
      rm -rf "${test_dir}/.next"
      cp -r "$selected" "${test_dir}/.next"
      pm2 restart dazistar-3001 2>&1 || true
      ok "测试环境已回滚"
    else
      info "跳过测试环境回滚"
    fi
  fi

  ok "回滚操作完成"
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

  echo ""
  info ">>> 部署生产环境 (3000)"
  echo -e "${YELLOW}--------------------------------------------------------${NC}"
  bash "$(dirname "$0")/deploy-prod.sh"
  local prod_exit=$?
  if [ $prod_exit -ne 0 ]; then
    error "生产环境部署失败，退出码: $prod_exit"
    exit $prod_exit
  fi

  echo ""
  info ">>> 部署测试环境 (3001)"
  echo -e "${YELLOW}--------------------------------------------------------${NC}"
  bash "$(dirname "$0")/deploy-test.sh"
  local test_exit=$?
  if [ $test_exit -ne 0 ]; then
    error "测试环境部署失败，退出码: $test_exit"
    exit $test_exit
  fi

  print_summary
}

main "$@"
