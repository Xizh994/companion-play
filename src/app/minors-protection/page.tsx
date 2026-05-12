"use client";

import Link from "next/link";

export default function MinorsProtectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition mb-6 text-sm">
          <span>←</span> <span>返回</span>
        </Link>

        <div className="glass rounded-3xl p-6 sm:p-10 glow-card">
          <div className="text-center mb-8">
            <span className="text-4xl">🛡️</span>
            <h1 className="text-2xl font-bold text-white mt-3">未成年人保护声明</h1>
            <p className="text-gray-400 text-sm mt-2">更新日期：2025年5月</p>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">引言</h2>
              <p>
                搭子星致力于为游戏爱好者提供安全、健康的陪玩社交平台。我们高度重视未成年人保护工作，严格按照《中华人民共和国未成年人保护法》
                《儿童个人信息网络保护规定》等法律法规要求，制定本未成年人保护声明。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">一、我们如何保护未成年人</h2>
              <h3 className="text-base font-medium text-gray-200 mt-3 mb-2">1.1 实名认证</h3>
              <p className="text-sm">我们要求用户在使用平台的核心功能前完成实名认证，通过身份证信息核验确认用户年龄，防止未成年人冒用他人身份注册。</p>

              <h3 className="text-base font-medium text-gray-200 mt-3 mb-2">1.2 内容安全</h3>
              <p className="text-sm">我们建立了内容安全审核机制，对平台上发布的文字、图片等信息进行审核，过滤不适宜未成年人接触的内容。</p>

              <h3 className="text-base font-medium text-gray-200 mt-3 mb-2">1.3 隐私保护</h3>
              <p className="text-sm">对于未成年用户的个人信息，我们采取额外的保护措施，包括但不限于限制信息收集范围、加强数据加密和安全防护。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">二、给监护人的建议</h2>
              <p className="text-sm">我们建议监护人：</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>了解并监督未成年人的网络活动</li>
                <li>引导未成年人合理使用网络，控制上网时间</li>
                <li>帮助未成年人建立正确的网络安全意识</li>
                <li>妥善保管支付密码，避免未成年人擅自消费</li>
                <li>及时关注未成年人的社交动态和心理状态</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">三、儿童（14周岁以下）个人信息特别保护</h2>
              <p className="text-sm">
                根据《儿童个人信息网络保护规定》，对于未满14周岁的儿童，我们在收集其个人信息前将征得其监护人的明示同意。
                监护人有权要求查阅、更正或删除儿童的个人信息，也有权撤回同意。如您需要行使上述权利，请通过本声明末尾的联系方式与我们联系。
              </p>
              <p className="text-sm mt-2">
                我们仅在实现服务目的所需的最短期限内保留儿童个人信息，超出期限后将及时删除或匿名化处理。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">四、举报与投诉</h2>
              <p className="text-sm">如果您发现平台存在危害未成年人权益的内容或行为，请立即通过以下方式举报：</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>举报邮箱</strong>：623701305@qq.com</li>
                <li><strong>平台内举报</strong>：在相关内容或用户页面使用举报功能</li>
              </ul>
              <p className="text-sm mt-2">我们将在24小时内处理您的举报，并按规定向主管部门报告。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">五、联系我们</h2>
              <p className="text-sm">如您对未成年人保护有任何疑问或建议，请通过以下方式与我们联系：</p>
              <p className="text-sm mt-1">电子邮箱：623701305@qq.com</p>
              <p className="text-sm">回复时限：15个工作日内</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
