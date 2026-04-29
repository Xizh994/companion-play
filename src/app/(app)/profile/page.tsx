'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { 
  User, Settings, Shield, Bell, Moon, Sun, Gamepad2, 
  LogOut, Trash2, AlertTriangle, MessageCircle, Star,
  Trophy, Clock, CheckCircle, XCircle
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = () => {
    console.log('退出登录');
    router.push('/login');
  };

  const handleDeleteAccount = () => {
    console.log('注销账号');
    setShowDeleteConfirm(false);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-8 bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-32 w-32 border-4 border-purple-500/50">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent('当前用户')}&mouth=smile01`}
                  alt="头像"
                  className="w-full h-full object-cover"
                />
                <AvatarFallback className="text-4xl">用</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">习朝晖</h1>
                <p className="text-muted-foreground mb-4">游戏爱好者 / 老板</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                    <Trophy className="h-3 w-3 mr-1" />
                    钻石会员
                  </Badge>
                  <Badge variant="outline" className="border-green-500/30 text-green-300">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-1" />
                    在线
                  </Badge>
                </div>
              </div>

              <Button variant="outline" className="border-white/10 hover:border-purple-500/50">
                <Settings className="h-4 w-4 mr-2" />
                编辑资料
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: '订单', value: '28', icon: <MessageCircle className="h-5 w-5 text-purple-400" /> },
            { label: '评价', value: '4.9', icon: <Star className="h-5 w-5 text-yellow-400" /> },
            { label: '时长', value: '156h', icon: <Clock className="h-5 w-5 text-pink-400" /> },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6 text-center">
                {stat.icon}
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 border-white/10">
            <TabsTrigger value="orders">订单记录</TabsTrigger>
            <TabsTrigger value="reviews">我的评价</TabsTrigger>
            <TabsTrigger value="settings">账号设置</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle>最近订单</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { game: '王者荣耀', player: '影刃舞者', date: '2026-04-28', status: 'completed', amount: 70 },
                    { game: '原神', player: '星空漫步', date: '2026-04-27', status: 'completed', amount: 56 },
                    { game: 'QQ飞车', player: '疾风少年', date: '2026-04-26', status: 'pending', amount: 64 },
                  ].map((order, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <Gamepad2 className="h-10 w-10 text-purple-400" />
                        <div>
                          <p className="font-semibold">{order.game}</p>
                          <p className="text-sm text-muted-foreground">陪玩师: {order.player}</p>
                          <p className="text-xs text-muted-foreground">{order.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-400">¥{order.amount}</p>
                        {order.status === 'completed' ? (
                          <Badge className="bg-green-500/10 text-green-300 border-green-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            已完成
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/10 text-yellow-300 border-yellow-500/20">
                            <Clock className="h-3 w-3 mr-1" />
                            进行中
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle>我的评价</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { player: '影刃舞者', rating: 5, comment: '技术超好，带飞！下次还找他', date: '2026-04-28' },
                    { player: '星空漫步', rating: 4, comment: '打金效率高，很满意', date: '2026-04-27' },
                  ].map((review, i) => (
                    <div key={i} className="border-b border-white/10 pb-6 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{review.player}</p>
                          <p className="text-sm text-muted-foreground">{review.date}</p>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(review.rating)].map((_, j) => (
                            <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          {[...Array(5 - review.rating)].map((_, j) => (
                            <Star key={j} className="h-4 w-4 text-muted-foreground" />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle>偏好设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                      <span>深色模式</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDarkMode(!isDarkMode)}
                    >
                      {isDarkMode ? '开启' : '关闭'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      <span>消息通知</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNotifications(!notifications)}
                    >
                      {notifications ? '开启' : '关闭'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle>安全设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full border-white/10 hover:border-purple-500/50">
                    <Shield className="h-4 w-4 mr-2" />
                    修改密码
                  </Button>
                  <Button variant="outline" className="w-full border-white/10 hover:border-purple-500/50">
                    <User className="h-4 w-4 mr-2" />
                    实名认证
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* 退出登录 & 注销账号 - 页面底部 */}
        <div className="mt-12 pt-8 border-t border-white/10 space-y-4">
          <Button
            variant="outline"
            className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>

          <Button
            variant="outline"
            className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            注销账号
          </Button>

          {showDeleteConfirm && (
            <Card className="mt-4 bg-red-500/5 border-red-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-red-300 mb-2">确认注销账号？</h3>
                    <p className="text-sm text-red-200/70">
                      此操作不可逆，所有数据将被永久删除，包括订单记录、评价、余额等。
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/10"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={handleDeleteAccount}
                  >
                    确认注销
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
