#!/usr/bin/env bash
# ============================================
# NOVE Studio 鈥?涓€閿儴缃茶剼鏈?# 鐢ㄦ硶: curl -fsSL https://raw.githubusercontent.com/quanzhengnan520/NOVEstudioV1/main/deploy.sh | bash
# 鎴栬€? bash deploy.sh
# ============================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/nove}"
GIT_REPO="https://github.com/quanzhengnan520/NOVEstudioV1.git"
BRANCH="${BRANCH:-main}"

echo "================================================"
echo " NOVE Studio 閮ㄧ讲鑴氭湰"
echo " 鐩爣: $APP_DIR"
echo "================================================"

# --- 1. 瀹夎 Docker ---
if ! command -v docker &>/dev/null; then
  echo "[1/5] 瀹夎 Docker..."
  curl -fsSL https://get.docker.com | bash
  systemctl enable docker
  systemctl start docker
else
  echo "[1/5] Docker 宸插畨瑁?
fi

if ! docker compose version &>/dev/null; then
  echo "[1/5] 瀹夎 Docker Compose..."
  apt-get update -qq && apt-get install -y -qq docker-compose-plugin
fi
echo "    $(docker compose version)"

# --- 2. 鍏嬮殕/鏇存柊浠ｇ爜 ---
if [ -d "$APP_DIR/.git" ]; then
  echo "[2/5] 鏇存柊浠ｇ爜..."
  cd "$APP_DIR"
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  echo "[2/5] 鍏嬮殕浠ｇ爜..."
  git clone --depth 1 -b "$BRANCH" "$GIT_REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# --- 3. 鍒涘缓 .env 鏂囦欢锛堝鏋滀笉瀛樺湪锛?---
ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "[3/5] 鍒涘缓 .env 閰嶇疆鏂囦欢..."
  POSTGRES_PASS=$(openssl rand -hex 20)
  JWT_ACCESS=$(openssl rand -hex 32)
  JWT_REFRESH=$(openssl rand -hex 32)
  cat > "$ENV_FILE" <<- EOF
# NOVE Studio - 鐢熶骇鐜閰嶇疆
# 閮ㄧ讲鏃ユ湡: $(date -u '+%Y-%m-%d')

# --- 鏁版嵁搴?---
POSTGRES_PASSWORD=$POSTGRES_PASS
REDIS_PASSWORD=

# --- JWT锛堣嚜鍔ㄧ敓鎴愶紝淇濈暀涓嶈鏀癸級 ---
JWT_ACCESS_SECRET=$JWT_ACCESS
JWT_REFRESH_SECRET=$JWT_REFRESH

# --- 鍩熷悕锛堥儴缃插悗淇敼锛?---
FRONTEND_ORIGIN=http://localhost:3000
FRONTEND_URL=

# --- reCAPTCHA锛堥儴缃插悗閰嶏級 ---
# 鍏堢敤 beta 妯″紡缁曡繃 reCAPTCHA锛岄厤缃ソ鍩熷悕鍚庡啀姝ｅ紡鍚敤
NOVE_INTERNAL_BETA=1

# --- AI ---
NOVE_PROVIDERS_ENABLE_NETWORK=1
OPENAI_API_KEY=sk-xxx

# --- 绠＄悊鍛?---
BOOTSTRAP_ADMIN_EMAIL=
EOF
  chmod 600 "$ENV_FILE"
  echo "[3/5] .env 宸插垱寤猴細$ENV_FILE"
  echo "     璇风紪杈戝畠濉叆浣犵殑鍩熷悕鍜?API Key:"
  echo "     nano $ENV_FILE"
else
  echo "[3/5] .env 宸插瓨鍦紝璺宠繃"
fi

echo ""
echo "================================================"
echo " 涓嬩竴姝ワ紙鍒嗕袱姝ユ墽琛岋級"
echo "================================================"
echo ""
echo "绗竴姝ワ細缂栬緫鐜鍙橀噺"
echo "  nano $APP_DIR/.env"
echo "  鑷冲皯瑕佹敼锛?
echo "    - FRONTEND_ORIGIN=https://浣犵殑鍩熷悕"
echo "    - OPENAI_API_KEY=sk-xxx"
echo "    - BOOTSTRAP_ADMIN_EMAIL=浣犵殑閭锛堟垚涓虹鐞嗗憳锛?
echo ""
echo "绗簩姝ワ細鍚姩鏈嶅姟"
echo "  cd $APP_DIR && docker compose -f infra/docker-compose.prod.yml up -d --build"
echo ""
echo "鏌ョ湅鏃ュ織锛?
echo "  docker compose -f $APP_DIR/infra/docker-compose.prod.yml logs -f"
echo ""
echo "妫€鏌ュ仴搴风姸鎬侊細"
echo "  curl http://localhost/health"
