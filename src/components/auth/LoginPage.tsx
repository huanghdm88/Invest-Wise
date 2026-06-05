import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { Logo } from "@/src/components/logo";
import { IconShieldCheck } from "@/src/lib/icons";

interface LoginPageProps {
  onLogin: () => void;
}

const kpis = [
  { kpi: "5 大维度", label: "行业 / 团队 / 产品 / 财务 / 合规" },
  { kpi: "5 级风险", label: "R1 低风险 → R5 高风险" },
  { kpi: "3 风格档位", label: "国资防守 / 稳健均衡 / 激进创投" },
  { kpi: "100% 溯源", label: "页码 + 段落 · 可追溯" },
];

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("demo@investwise.ai");
  const [password, setPassword] = useState("••••••••");
  const [showForgot, setShowForgot] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onLogin();
    }, 600);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* 左侧：彩色海报视觉 */}
        <div className="relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
          {/* 渐变底色 */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700" />
          {/* 流动 blob */}
          <div className="absolute -left-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-purple-400/40 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-[30rem] w-[30rem] rounded-full bg-cyan-300/30 blur-3xl" />
          <div className="absolute -right-16 top-10 h-80 w-80 rounded-full bg-blue-300/35 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-indigo-900/60 to-transparent" />

          <div className="relative z-10">
            <div className="[&_*]:!text-white">
              <Logo />
            </div>
          </div>

          <div className="relative z-10 space-y-7">
            <div>
              <p className="text-sm font-medium text-white/70">For 投委会 · 投资委员会</p>
              <h1 className="mt-2 text-[40px] font-semibold leading-[1.15] tracking-tight text-white">
                让每一笔投资决策
                <br />
                都有据可依、逻辑闭环。
              </h1>
              <p className="mt-5 max-w-md text-[13px] leading-relaxed text-white/80">
                基于投决议案、尽调报告、商业计划书的多维 Ontology 抽取，自动生成事实交叉验证与核心投资逻辑挑战质询，
                帮助投委会在高压决策中识别隐性矛盾。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {kpis.map((item) => (
                <div
                  key={item.kpi}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-white">{item.kpi}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/70">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-[11px] text-white/70">
            <SFIcon icon={IconShieldCheck} size={13} />
            数据隔离 · 私有化部署 · 仅本项目工作区可见
          </div>
        </div>

        {/* 右侧：极简表单 */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="lg:hidden">
              <Logo />
            </div>

            {!showForgot ? (
              <>
                <div className="space-y-2">
                  <h2 className="text-[30px] font-semibold tracking-tight text-gray-900">
                    欢迎回来
                  </h2>
                  <p className="text-[13px] text-gray-500">
                    使用邮箱与密码登录 Invest Wise 工作台
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-900">邮箱</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="h-11 rounded-xl text-[13.5px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-semibold text-gray-900">密码</label>
                      <button
                        type="button"
                        className="text-[12.5px] font-semibold text-gray-700 hover:text-gray-900"
                        onClick={() => setShowForgot(true)}
                      >
                        忘记密码？
                      </button>
                    </div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="至少 8 位"
                      className="h-11 rounded-xl text-[13.5px]"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    className="h-11 w-full rounded-xl text-[14px] font-semibold"
                    disabled={submitting}
                  >
                    {submitting ? "登录中…" : "登录"}
                  </Button>

                  <p className="pt-1 text-center text-[11.5px] text-gray-400">
                    Demo 环境：任意邮箱 + 任意密码即可进入演示
                  </p>
                </form>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="text-[30px] font-semibold tracking-tight text-gray-900">
                    找回密码
                  </h2>
                  <p className="text-[13px] text-gray-500">
                    输入注册邮箱，系统将发送重置链接（Demo 中仅保留入口）
                  </p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setShowForgot(false);
                  }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-900">邮箱</label>
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      className="h-11 rounded-xl text-[13.5px]"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    className="h-11 w-full rounded-xl text-[14px] font-semibold"
                  >
                    发送重置链接
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowForgot(false)}
                  >
                    返回登录
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
