"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition mb-6 text-sm">
          <span>←</span> <span>返回</span>
        </Link>

        <div className="glass rounded-3xl p-6 sm:p-10 glow-card">
          <div className="text-center mb-8">
            <span className="text-4xl">🔒</span>
            <h1 className="text-2xl font-bold text-white mt-3">隐私政策</h1>
            <p className="text-gray-400 text-sm mt-2">更新日期：2025年5月</p>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">引言</h2>
              <p>搭子星（以下简称&ldquo;我们&rdquo;）深知个人信息对您的重要性，并将按照法律法规的规定，保护您的个人信息及隐私安全。本隐私政策旨在向您说明我们如何收集、使用、存储、共享和转让您的个人信息，以及您所享有的权利。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">一、我们收集哪些信息</h2>
              <h3 className="text-base font-medium text-gray-200 mt-4 mb-2">1.1 账号注册与登录</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>手机号码</strong>：用于注册账号、登录验证、安全校验</li>
                <li><strong>昵称</strong>：作为您在平台上的显示名称</li>
                <li><strong>头像</strong>（可选）：用于个人资料展示</li>
                <li><strong>登录密码</strong>（可选）：如果您选择设置密码，密码将经过哈希加密存储</li>
              </ul>

              <h3 className="text-base font-medium text-gray-200 mt-4 mb-2">1.2 邮箱绑定（可选）</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>电子邮箱地址</strong>：用于账号找回、紧急登录和重要通知</li>
              </ul>

              <h3 className="text-base font-medium text-gray-200 mt-4 mb-2">1.3 实名认证（BOSS用户）</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>真实姓名</strong>：用于身份核验</li>
                <li><strong>身份证号码</strong>：经 AES-256 加密后存储，仅用于与权威数据库进行身份要素核验</li>
              </ul>

              <h3 className="text-base font-medium text-gray-200 mt-4 mb-2">1.4 店铺资质认证（SHOP用户）</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>店铺名称、简介</strong>：用于店铺信息展示</li>
                <li><strong>联系电话</strong>：作为店铺联系方式</li>
                <li><strong>负责人姓名</strong>：用于店铺负责人身份确认</li>
              </ul>

              <h3 className="text-base font-medium text-gray-200 mt-4 mb-2">1.5 设备与服务信息</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>设备信息</strong>：包括设备型号、操作系统版本、IP地址等，用于安全防护和服务优化</li>
                <li><strong>日志信息</strong>：操作日志，用于故障排查和安全审计</li>
                <li><strong>Cookie及同类技术</strong>：用于维持登录状态和提升使用体验</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">二、我们如何使用信息</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>创建、维护和验证您的账号</li>
                <li>完成实名认证和店铺资质审核</li>
                <li>保障平台交易安全和用户权益</li>
                <li>防范欺诈、滥用和安全风险</li>
                <li>优化和改善服务体验</li>
                <li>履行法律义务和响应监管要求</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">三、信息存储与保护</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>您的个人信息存储在中国境内</li>
                <li>身份证号使用 AES-256 强加密存储</li>
                <li>密码使用 bcrypt 单向哈希存储</li>
                <li>我们采取数据分类、加密传输（HTTPS）、访问控制、日志审计等措施保护您的信息</li>
                <li>发生个人信息安全事件时，我们将依法及时通知您并向主管部门报告</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">四、信息共享与披露</h2>
              <h3 className="text-base font-medium text-gray-200 mt-3 mb-2">4.1 第三方服务</h3>
              <p className="text-sm">为实现平台核心功能，我们可能与以下类型的第三方服务商共享必要信息：</p>
              <ul className="list-disc pl-5 space-y-1 text-sm mt-1">
                <li><strong>阿里云（短信服务）</strong>：发送短信验证码时，手机号将传递给阿里云短信服务</li>
                <li><strong>阿里云（邮件推送）</strong>：发送验证码邮件和 Magic Link 时，邮箱将传递给阿里云邮件服务</li>
                <li><strong>实名认证服务商</strong>：进行实名认证时，姓名和身份证号将传递给合规的实名认证服务商进行核验</li>
              </ul>
              <p className="text-sm mt-2">我们与上述第三方签订有数据保护协议，要求其严格保密并不得将信息用于其他目的。</p>

              <h3 className="text-base font-medium text-gray-200 mt-3 mb-2">4.2 法律要求披露</h3>
              <p className="text-sm">在法律法规要求、政府部门或司法机关依法要求的情况下，我们可能会披露您的个人信息。</p>

              <h3 className="text-base font-medium text-gray-200 mt-3 mb-2">4.3 未经您同意的共享</h3>
              <p className="text-sm">除上述情形外，未经您的明确同意，我们不会将您的个人信息转让或共享给任何第三方。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">五、您的权利</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>查询权</strong>：您可以在个人中心查看您的账号信息</li>
                <li><strong>更正权</strong>：您可以修改昵称、头像、密码等信息</li>
                <li><strong>删除权</strong>：您可以在个人中心申请注销账号，我们将在核实身份后删除您的个人信息（法律法规另有规定的除外）</li>
                <li><strong>撤回同意</strong>：您可以通过注销账号的方式撤回对本隐私政策的同意</li>
                <li><strong>投诉权</strong>：如您认为我们侵犯了您的个人信息权益，可向相关监管机构投诉</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">六、未成年人保护</h2>
              <p className="text-sm">
                我们的平台主要面向成年人提供服务。如果您是未满14周岁的未成年人，在使用我们的服务前，请务必在父母或监护人的监护、指导和同意下阅读本隐私政策及
                <Link href="/minors-protection" className="text-pink-400 hover:underline mx-1">未成年人保护声明</Link>
                。我们将根据国家相关法律法规保护未成年人的个人信息。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">七、政策更新</h2>
              <p className="text-sm">我们可能会适时修订本隐私政策。当发生重大变更时，我们将通过平台公告、弹窗提示等方式通知您。您继续使用我们的服务即表示同意更新后的隐私政策。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">八、联系我们</h2>
              <p className="text-sm">如您对本隐私政策有任何疑问、意见或建议，请通过以下方式与我们联系：</p>
              <p className="text-sm mt-1">电子邮箱：623701305@qq.com</p>
              <p className="text-sm">我们将在15个工作日内回复您的请求。</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
