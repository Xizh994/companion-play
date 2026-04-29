'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Gamepad2, Sword, Car, Dice6, Music, Code, Palette, Trophy, Heart, MessageCircle, Star, Filter, X, Store, Users } from 'lucide-react';

// Mock data for discover page
const GAME_CATEGORIES = [
  { id: 'all', name: '全部', icon: '🎮' },
  { id: 'moba', name: 'MOBA', icon: '⚔️' },
  { id: 'fps', name: 'FPS', icon: '🔫' },
  { id: 'mmorpg', name: 'MMORPG', icon: '🛡️' },
  { id: 'sports', name: '体育', icon: '⚽' },
  { id: 'racing', name: '竞速', icon: '🏎️' },
  { id: 'puzzle', name: '益智', icon: '🧩' },
  { id: 'horror', name: '恐怖', icon: '👻' },
  { id: 'casual', name: '休闲', icon: '🌸' },
];

const SHOPS = [
  {
    id: 'shop1',
    shopName: '星辰电竞馆',
    ownerName: '星辰老板',
    gameCategories: ['moba', 'fps'],
    playerCount: 28,
    rating: 4.9,
    totalOrders: 1520,
    serviceTags: ['陪练', '上分', '教学'],
    description: '专业电竞陪玩，主打LOL、王者荣耀上分服务',
    avatarSeed: '星辰电竞馆',
  },
  {
    id: 'shop2',
    shopName: '月亮陪玩社',
    ownerName: '月亮老板',
    gameCategories: ['mmorpg', 'casual'],
    playerCount: 15,
    rating: 4.7,
    totalOrders: 890,
    serviceTags: ['打金', '代练', '陪玩'],
    description: '魔兽世界、原神专业打金代练团队',
    avatarSeed: '月亮陪玩社',
  },
  {
    id: 'shop3',
    shopName: '极速赛车俱乐部',
    ownerName: '极速老板',
    gameCategories: ['racing', 'sports'],
    playerCount: 12,
    rating: 4.8,
    totalOrders: 620,
    serviceTags: ['竞速', '赛道教学', '漂移'],
    description: 'QQ飞车、极限竞速专业陪玩，赛道记录保持者',
    avatarSeed: '极速赛车俱乐部',
  },
];

const PLAYERS = [
  {
    id: 'player1',
    nickname: '影刃舞者',
    gameCategories: ['moba', 'fps'],
    pricePerHour: 35,
    rating: 4.9,
    orderCount: 328,
    serviceTags: ['上分', '教学', '深夜档'],
    bio: '王者荣耀巅峰赛2300分，深夜档优惠',
    online: true,
    avatarSeed: '影刃舞者',
  },
  {
    id: 'player2',
    nickname: '星空漫步',
    gameCategories: ['mmorpg'],
    pricePerHour: 28,
    rating: 4.7,
    orderCount: 195,
    serviceTags: ['打金', '带本', '风景党'],
    bio: '魔兽世界资深玩家，带刷副本效率',
    online: true,
    avatarSeed: '星空漫步',
  },
  {
    id: 'player3',
    nickname: '疾风少年',
    gameCategories: ['racing', 'sports'],
    pricePerHour: 32,
    rating: 4.8,
    orderCount: 256,
    serviceTags: ['竞速', '赛道记录', '教学'],
    bio: 'QQ飞车S车玩家，赛道记录保持者',
    online: false,
    avatarSeed: '疾风少年',
  },
  {
    id: 'player4',
    nickname: '甜心泡泡',
    gameCategories: ['casual', 'puzzle'],
    pricePerHour: 25,
    rating: 4.6,
    orderCount: 412,
    serviceTags: ['休闲', '聊天', '暖心'],
    bio: '温柔陪玩师，擅长休闲游戏和暖心聊天',
    online: true,
    avatarSeed: '甜心泡泡',
  },
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredShops = useMemo(() => {
    let result = [...SHOPS];
    if (selectedCategory !== 'all') {
      result = result.filter(shop => shop.gameCategories.includes(selectedCategory));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(shop => 
        shop.shopName.toLowerCase().includes(query) || 
        shop.description.toLowerCase().includes(query)
      );
    }
    return result;
  }, [searchQuery, selectedCategory]);

  const filteredPlayers = useMemo(() => {
    let result = [...PLAYERS];
    if (selectedCategory !== 'all') {
      result = result.filter(player => player.gameCategories.includes(selectedCategory));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(player => 
        player.nickname.toLowerCase().includes(query) || 
        player.bio.toLowerCase().includes(query)
      );
    }
    return result;
  }, [searchQuery, selectedCategory]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? 'all' : categoryId);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 pt-32 pb-20">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)'
        }} />
        
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            找到你的专属搭子
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            游戏不孤单，陪玩更精彩。专业陪玩师/陪玩店，等你来发现
          </p>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
              <Input
                type="text"
                placeholder="搜索陪玩师、店铺、游戏..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 py-6 text-lg bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-purple-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Game Categories */}
      <section className="px-4 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-5 w-5 text-purple-400" />
          <h2 className="text-2xl font-bold">游戏分类</h2>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {GAME_CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => handleCategoryClick(category.id)}
              className={`rounded-full px-6 py-2 transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  : 'border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>
      </section>

      {/* Recommended Shops */}
      <section className="px-4 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Store className="h-6 w-6 text-purple-400" />
          <h2 className="text-2xl font-bold">推荐陪玩店</h2>
        </div>

        {filteredShops.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">暂无符合条件的陪玩店</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop) => (
              <Card key={shop.id} className="group hover:border-purple-500/50 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border-2 border-purple-500/50">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(shop.avatarSeed)}&mouth=smile02`}
                        alt={shop.shopName}
                        className="w-full h-full object-cover"
                      />
                      <AvatarFallback>{shop.shopName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
                        <Link href={`/shop/${shop.id}`}>{shop.shopName}</Link>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{shop.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {shop.serviceTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                        {tag}
                      </Badge>
                    ))}
                    {shop.gameCategories.map((catId) => {
                      const cat = GAME_CATEGORIES.find(c => c.id === catId);
                      return cat ? (
                        <Badge key={catId} variant="outline" className="border-pink-500/30 text-pink-300">
                          {cat.icon} {cat.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="h-4 w-4 fill-yellow-400" />
                      <span className="font-semibold">{shop.rating}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="border-t border-white/10" />
      </div>

      {/* Recommended Players */}
      <section className="px-4 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-purple-400" />
          <h2 className="text-2xl font-bold">推荐个人陪玩</h2>
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">暂无符合条件的陪玩师</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlayers.map((player) => (
              <Card key={player.id} className="group hover:border-purple-500/50 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-purple-500/50">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.avatarSeed)}&mouth=smile02`}
                          alt={player.nickname}
                          className="w-full h-full object-cover"
                        />
                        <AvatarFallback>{player.nickname[0]}</AvatarFallback>
                      </Avatar>
                      {player.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
                        <Link href={`/profile/${player.id}`}>{player.nickname}</Link>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-purple-400 font-semibold">¥{player.pricePerHour}/小时</span>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="h-3 w-3 fill-yellow-400" />
                          <span className="text-sm">{player.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{player.bio}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {player.serviceTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                        {tag}
                      </Badge>
                    ))}
                    {player.gameCategories.map((catId) => {
                      const cat = GAME_CATEGORIES.find(c => c.id === catId);
                      return cat ? (
                        <Badge key={catId} variant="outline" className="border-pink-500/30 text-pink-300">
                          {cat.icon} {cat.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      联系搭子
                      <MessageCircle className="h-4 w-4 mr-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
