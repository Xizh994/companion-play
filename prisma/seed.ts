import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始创建测试用户...\n");

  const password = await bcrypt.hash("123456", 10);

  const shopUser = await prisma.user.upsert({
    where: { phone: "13800000001" },
    update: {},
    create: {
      phone: "13800000001",
      passwordHash: password,
      role: "SHOP",
      nickname: "星空电竞",
      bio: "专业陪玩店铺，实力上分",
      status: "online",
      shopProfile: {
        create: {
          shopName: "星空电竞陪玩店",
          shopDesc: "⭐ 五年老店，金牌陪玩团队，王者荣耀/英雄联盟/和平精英/永劫无间，专业上分服务，安全可靠！\n🔥 当前在线陪玩师20+，欢迎咨询下单",
          shopCover: null,
          shopAddress: "线上服务",
          licenseType: "business_license",
          licenseImage: "/placeholder-license.png",
          contactName: "张店长",
          contactPhone: "13800000001",
          contactIdCard: "330000000000000000",
          playerCount: 25,
          rating: 4.9,
          orderCount: 3280,
        },
      },
    },
    include: { shopProfile: true },
  });

  console.log(`✅ 陪玩店用户创建成功:`);
  console.log(`   手机: 13800000001  密码: 123456`);
  console.log(`   店铺: ${shopUser.shopProfile?.shopName}`);
  console.log(`   角色: SHOP (陪玩店)\n`);

  const bossUser = await prisma.user.upsert({
    where: { phone: "13800000002" },
    update: {},
    create: {
      phone: "13800000002",
      passwordHash: password,
      role: "BOSS",
      nickname: "王者阿杰",
      bio: "找陪玩上分，王者荣耀重度玩家",
      status: "online",
    },
  });

  console.log(`✅ 老板用户创建成功:`);
  console.log(`   手机: 13800000002  密码: 123456`);
  console.log(`   昵称: ${bossUser.nickname}`);
  console.log(`   角色: BOSS (老板)\n`);

  console.log("🎉 测试用户创建完成！");
  console.log("=================================");
  console.log("  陪玩店登录: 13800000001 / 123456");
  console.log("  老板登录:   13800000002 / 123456");
  console.log("=================================");
}

main()
  .catch((e) => {
    console.error("❌ 种子数据创建失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
