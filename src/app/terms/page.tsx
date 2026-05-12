"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition mb-6 text-sm">
          <span>←</span> <span>返回</span>
        </Link>

        <div className="glass rounded-3xl p-6 sm:p-10 glow-card">
          <div className="text-center mb-8">
            <span className="text-4xl">📋</span>
            <h1 className="text-2xl font-bold text-white mt-3">用户服务协议</h1>
            <p className="text-gray-400 text-sm mt-2">更新日期：2025年5月</p>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">一、总则</h2>
              <p>欢迎使用搭子星（以下简称&ldquo;本平台&rdquo;）。本协议是您（以下简称&ldquo;用户&rdquo;）与搭子星之间关于使用本平台服务所订立的协议。</p>
            <p className="mt-2">您在注册页面点击&ldquo;同意并注册&rdquo;即表示您已阅读、理解并同意接受本协议的全部内容。如您不同意本协议的任何条款，请停止注册和使用本平台服务。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">二、账号注册与管理</h2>
              <h3 className="text-base font-medium text-gray-200 mt-3 mb-2">2.1 注册条件</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>您是具备完全民事行为能力的自然人，或依法设立的法人/其他组织</li>
                <li>您提供的注册信息是真实、准确、完整的</li>
                <li>您承诺不冒用他人信息注册账号</li>
              </ul>

              <h3 className="text-base font-medium text-gray-200 mt-3 mb-2">2.2 实名认证</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>根据《网络安全法》等法律法规要求，使用本平台特定功能（如下单、接单、店铺经营）需要完成实名认证</li>
                <li>您提交的实名信息将用于与权威数据源进行身份核验</li>
                <li>您的身份证信息将进行加密存储，仅供身份核验使用</li>
              </ul>

              <h3 className="text-base font-medium text-gray-200 mt-3 mb-2">2.3 账号安全</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>您有责任妥善保管账号密码和验证码，因账号保管不善造成的损失由您自行承担</li>
                <li>发现账号被盗用或异常登录时，应立即通知本平台</li>
                <li>您不得将账号转让、出租或出借给他人使用</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">三、用户行为规范</h2>
              <p>您在使用本平台服务时，不得从事以下行为：</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>发布或传播违法信息、色情内容、暴力恐怖信息</li>
                <li>侵犯他人知识产权、隐私权、名誉权等合法权益</li>
                <li>利用平台从事欺诈、虚假交易等不正当行为</li>
                <li>干扰或破坏平台系统的正常运行</li>
                <li>利用技术手段爬取、窃取平台数据</li>
                <li>发布与游戏陪玩无关的广告或垃圾信息</li>
                <li>在陪玩过程中从事代练、开挂等违反游戏服务条款的行为</li>
              </ul>
              <p className="text-sm mt-2">违反上述规范的用户，本平台有权视情节严重程度采取警告、限制功能、暂停服务、永久封禁账号等措施，并保留追究法律责任的权利。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">四、服务内容</h2>
              <p>本平台提供游戏陪玩匹配服务，包括但不限于：</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>用户注册、登录和账号管理</li>
                <li>实名认证和店铺资质认证</li>
                <li>陪玩师发现、浏览和筛选</li>
                <li>实时聊天和预约下单</li>
                <li>店铺展示和运营管理</li>
              </ul>
              <p className="text-sm mt-2">本平台保留对部分服务收取费用的权利，具体收费标准以页面公示为准。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">五、知识产权</h2>
              <p className="text-sm">本平台的所有内容，包括但不限于文字、图片、软件、代码、界面设计、数据等，其知识产权归本平台或相关权利人所有。未经许可，您不得复制、修改、传播、销售或用于商业目的。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">六、免责声明</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>本平台不对用户之间的陪玩服务质量做任何明示或默示的担保</li>
                <li>因网络故障、黑客攻击、系统维护等原因导致的服务中断，本平台将尽力恢复但不承担由此产生的直接或间接损失</li>
                <li>用户在陪玩过程中产生的纠纷由双方自行协商解决，本平台可提供调解协助但不承担连带责任</li>
                <li>不可抗力因素（自然灾害、政策变化等）导致协议无法履行的，双方互不承担责任</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">七、协议变更与终止</h2>
              <h3 className="text-base font-medium text-gray-200 mt-3 mb-2">7.1 协议变更</h3>
              <p className="text-sm">我们可能适时修订本协议，修订后的协议将在本页面发布。重大变更将通过弹窗或公告通知。如您不同意变更内容，应停止使用本平台服务。</p>

              <h3 className="text-base font-medium text-gray-200 mt-3 mb-2">7.2 账号注销</h3>
              <p className="text-sm">您可以在个人中心申请注销账号。注销后，我们将依法删除您的个人信息（法律法规要求保留的除外）。请谨慎操作，账号注销后不可恢复。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">八、法律适用与争议解决</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>本协议的订立、执行和解释适用中华人民共和国法律</li>
                <li>因本协议引起的争议，双方应友好协商解决；协商不成的，任何一方可向本平台运营方所在地有管辖权的人民法院提起诉讼</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">九、联系我们</h2>
              <p className="text-sm">如您对本协议有任何疑问，请通过以下方式联系我们：</p>
              <p className="text-sm mt-1">电子邮箱：623701305@qq.com</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
