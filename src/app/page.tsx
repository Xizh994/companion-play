import Link from "next/link";

// 模拟数据 - 发现页陪玩师卡片
const PLAYERS = [
  {
    id: "1",
    nickname: "糖糖不甜",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sugar",
    role: "个人陪玩",
    gameCategories: ["王者荣耀", "英雄联盟"],
    pricePerHour: 35,
    rating: 4.9,
    orderCount: 1280,
    serviceTags: ["上分", "带飞", "温柔陪伴"],
    bio: "国服打野，野王在线，带飞上分！",
    online: true,
  },
  {
    id: "2",
    nickname: "夜落星河",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=star",
    role: "个人陪玩",
    gameCategories: ["原神", "崩坏：星穹铁道"],
    pricePerHour: 50,
    rating: 5.0,
    orderCount: 856,
    serviceTags: ["深渊", "剧情", "陪伴"],
    bio: "全角色满命满精，深度玩家，耐心教学",
    online: true,
  },
  {
    id: "3",
    nickname: "皮皮不皮",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=pepper",
    role: "陪玩店",
    shopName: "皮皮陪玩旗舰店",
    playerCount: 12,
    pricePerHour: 30,
    rating: 4.8,
    orderCount: 5680,
    serviceTags: ["上分", "教学", "陪聊", "声优"],
    bio: "专业陪玩团队，24小时在线服务",
    online: true,
  },
  {
    id: "4",
    nickname: "奶茶三分甜",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bubble",
    role: "个人陪玩",
    gameCategories: ["蛋仔派对", "第五人格"],
    pricePerHour: 25,
    rating: 4.7,
    orderCount: 432,
    serviceTags: ["上分", "声优", "聊天"],
    bio: "声甜可爱，会撒娇，适合治愈系玩家",
    online: false,
  },
  {
    id: "5",
    nickname: "电竞狂人小K",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=killer",
    role: "个人陪玩",
    gameCategories: ["CS2", "PUBG", "永劫无间"],
    pricePerHour: 60,
    rating: 4.9,
    orderCount: 2100,
    serviceTags: ["刚枪", "技术流", "上分"],
    bio: "FPS全能选手，枪刚人稳，技术教学",
    online: true,
  },
  {
    id: "6",
    nickname: "月光小雅",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=moon",
    role: "陪玩店",
    shopName: "月光陪玩小馆",
    playerCount: 8,
    pricePerHour: 40,
    rating: 4.6,
    orderCount: 3200,
    serviceTags: ["上分", "陪聊", "代练"],
    bio: "专注于MOBA类游戏，耐心细心",
    online: true,
  },
];

// 游戏分类数据
const GAME_CATEGORIES = [
  { name: "王者荣耀", icon: "👑" },
  { name: "英雄联盟", icon: "⚔️" },
  { name: "原神", icon: "🌟" },
  { name: "和平精英", icon: "🎮" },
  { name: "蛋仔派对", icon: "🥚" },
  { name: "第五人格", icon: "🏚️" },
  { name: "CS2", icon: "🔫" },
  { name: "永劫无间", icon: "⚔️" },
  { name: "更多", icon: "✨" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              CompanionPlay
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/discover" className="text-sm font-medium text-pink-400 hover:text-pink-300 transition">
              发现
            </Link>
            <Link href="/chat" className="text-sm font-medium text-gray-300 hover:text-pink-300 transition">
              消息
            </Link>
            <Link href="/profile" className="text-sm font-medium text-gray-300 hover:text-pink-300 transition">
              我的
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-300 hover:text-white transition"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="btn-gradient px-4 py-2 rounded-full text-sm font-medium"
            >
              入驻
            </Link>
          </div>
        </div>
      </header>

      {/* 英雄区域 */}
      <section className="relative py-20 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
            找到你的专属陪玩
          </h1>
          <p className="text-xl text-gray-400 mb-10">
            汇聚专业陪玩师与优质店铺，让游戏不再孤单
          </p>
          {/* 搜索框 */}
          <div className="glass rounded-2xl p-2 flex items-center gap-2 max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="搜索陪玩师、游戏或店铺..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white placeholder-gray-500"
            />
            <button className="btn-gradient px-8 py-3 rounded-xl font-medium">
              搜索
            </button>
          </div>

          {/* 热门标签 */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {["王者荣耀", "上分", "声优", "教学", "带飞"].map((tag) => (
              <span
                key={tag}
                className="tag-gradient px-4 py-2 rounded-full text-sm text-pink-300 cursor-pointer hover:bg-pink-500/20 transition"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 游戏分类 */}
      <section className="px-4 py-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">游戏分类</h2>
          <button className="text-sm text-gray-400 hover:text-pink-400 transition">
            查看全部 →
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-4">
          {GAME_CATEGORIES.map((game) => (
            <button
              key={game.name}
              className="glass rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition cursor-pointer"
            >
              <span className="text-3xl">{game.icon}</span>
              <span className="text-sm text-gray-300">{game.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 精选陪玩 */}
      <section className="px-4 py-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">🔥 精选陪玩</h2>
          <button className="text-sm text-gray-400 hover:text-pink-400 transition">
            查看全部 →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLAYERS.map((player) => (
            <Link
              key={player.id}
              href={`/profile/${player.id}`}
              className="glass rounded-2xl p-5 glow-card hover:scale-[1.02] transition-transform cursor-pointer block"
            >
              <div className="flex items-start gap-4 mb-4">
                {/* 头像 */}
                <div className="relative">
                  <img
                    src={player.avatar}
                    alt={player.nickname}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  {player.online && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a1a2e]" />
                  )}
                </div>
                {/* 基础信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white truncate">{player.nickname}</h3>
                    {player.role === "陪玩店" && (
                      <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded-full">
                        店铺
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {(player.gameCategories || []).join(" · ")}
                  </p>
                </div>
              </div>

              {/* 服务标签 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {player.serviceTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-pink-500/10 text-pink-300 text-xs rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 底部信息 */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-yellow-400">★ {player.rating}</span>
                  <span className="text-gray-400">{player.orderCount}单</span>
                  {'playerCount' in player && (
                    <span className="text-gray-400">{(player as any).playerCount}位陪玩师</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-pink-400">¥{player.pricePerHour}</span>
                  <span className="text-xs text-gray-500">/小时</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 底部 */}
      <footer className="glass mt-20 py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2024 CompanionPlay. 用 ❤️ 和代码构建</p>
        </div>
      </footer>
    </div>
  );
}