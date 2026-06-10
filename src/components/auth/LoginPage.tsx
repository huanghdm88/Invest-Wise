import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { Logo } from "@/src/components/logo";
import { IconKey, IconMail, IconShieldCheck } from "@/src/lib/icons";

interface LoginPageProps {
  onLogin: () => void;
}

const kpis = [
  { num: "01", kpi: "5 大维度", label: "行业 / 团队 / 产品 / 财务 / 合规" },
  { num: "02", kpi: "R1-R5", label: "金融风险分级" },
  { num: "03", kpi: "100%", label: "页码 + 段落溯源" },
  { num: "04", kpi: "AI Copilot", label: "投委会质询生成" },
];

const kpiCardPositions = [
  "left-[0%] top-[54px] z-10 -rotate-[5deg]",
  "left-[24%] top-[18px] z-20 -rotate-[2deg]",
  "left-[48%] top-[54px] z-30 rotate-[2deg]",
  "left-[72%] top-[18px] z-20 rotate-[5deg]",
];

const widgetPanelClass = "rounded-[28px] border border-[#e7e7e7] bg-white p-5";
const widgetTitleClass = "text-[20px] font-semibold leading-8 text-[#1d1d1f]";
const widgetCaptionClass = "text-[12px] font-normal leading-normal text-[#a6a6a6]";
const widgetLabelClass = "text-[14px] font-normal leading-6 text-[#888]";
const widgetInputClass =
  "h-10 rounded-lg border-[#e7e7e7] bg-white pl-10 text-[16px] font-normal leading-6 text-black shadow-none placeholder:text-[#c8c8c8] focus-visible:ring-0 focus-visible:border-[#1d1d1f]";
const widgetIconClass =
  "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#888]";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("demo@investwise.ai");
  const [password, setPassword] = useState("••••••••");
  const [accepted, setAccepted] = useState(true);
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
    <div className="relative h-dvh max-h-dvh w-screen overflow-hidden bg-[#f9f9f9]">
      <div className="grid h-full max-h-dvh min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[1.04fr_0.96fr]">
        {/* 左侧：背景图直接填满半屏，不再包圆角卡片 */}
        <div className="relative hidden min-h-0 overflow-hidden lg:flex lg:flex-col lg:justify-center">
          <img
            src="/login-hero-gradient.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.16),transparent_28%),linear-gradient(180deg,rgba(4,9,35,0.16)_0%,rgba(4,8,35,0.72)_100%)]" />
          <div className="absolute -left-12 top-16 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="absolute left-8 top-8 z-10 xl:left-12 2xl:left-16">
            <div className="[&_*]:!text-white">
              <Logo />
            </div>
          </div>

          <div className="relative z-10 w-full px-8 lg:px-10 xl:px-16 2xl:px-20">
            <div className="max-w-[520px] xl:max-w-[640px] 2xl:max-w-[720px]">
              <p className="text-[12px] font-normal uppercase leading-normal tracking-[0.22em] text-cyan-100/80">
                Investment Intelligence
              </p>
              <h1 className="mt-4 text-[clamp(34px,4.2vw,56px)] font-semibold leading-[1.08] tracking-[-0.04em] text-white">
                让投委会决策
                <br />
                更快、更准、更可追溯。
              </h1>
              <p className="mt-5 max-w-[520px] text-[14px] font-normal leading-6 text-white/75 xl:text-[15px] xl:leading-7">
                基于投决议案、尽调报告与商业计划书，自动完成事实核验、风险分级、
                报告复核与挑战性问题生成。
              </p>
            </div>

            <div className="relative mt-9 h-[206px] w-full max-w-[560px] [perspective:900px] xl:mt-12 xl:h-[236px] xl:max-w-[720px] 2xl:max-w-[800px]">
              <div className="absolute left-5 top-20 h-24 w-[86%] rounded-full bg-black/32 blur-3xl" />
              {kpis.map((item, index) => (
                <div
                  key={item.num}
                  className={[
                    "absolute flex h-[128px] w-[26.5%] min-w-0 flex-col justify-between overflow-hidden rounded-[18px] border border-white/20 bg-white/[0.12] px-3.5 py-3 shadow-[0_22px_54px_rgba(0,0,0,0.26)] backdrop-blur-2xl transition-transform xl:h-[148px] xl:px-4 xl:py-3.5",
                    "before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(139,92,246,0.72),rgba(46,16,101,0.24)_48%,rgba(255,255,255,0.10))] before:content-['']",
                    "after:absolute after:-right-10 after:-top-10 after:h-24 after:w-24 after:rounded-full after:bg-cyan-300/20 after:blur-2xl after:content-['']",
                    index === 0 ? "bg-black/30" : "",
                    index === 1 ? "bg-violet-600/25" : "",
                    index === 2 ? "bg-indigo-500/35" : "",
                    index === 3 ? "bg-black/25" : "",
                    kpiCardPositions[index],
                  ].join(" ")}
                >
                  <div className="relative z-10">
                    <p className="text-[10px] font-normal uppercase leading-normal tracking-[0.14em] text-white/60">
                      Module
                    </p>
                    <p className="mt-1 text-[clamp(15px,1.55vw,20px)] font-semibold leading-[1.15] tracking-[-0.035em] text-white drop-shadow-sm">
                      {item.kpi}
                    </p>
                    <p className="mt-1.5 text-[10.5px] font-normal leading-[1.35] text-white/78 xl:text-[12px] xl:leading-[1.45]">
                      {item.label}
                    </p>
                  </div>
                  <div className="relative z-10 flex items-end justify-between">
                    <span className="h-6 w-[3px] rounded-full bg-white/60 shadow-[7px_0_0_rgba(255,255,255,0.18),14px_0_0_rgba(255,255,255,0.12)]" />
                    <span className="h-px w-12 rounded-full bg-white/28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：精致登录表单 */}
        <div className="flex h-full min-h-0 items-center justify-center overflow-hidden px-4 py-4 sm:px-8 lg:px-12">
          <div className="w-full max-w-[440px]">
            <div className="mb-4 lg:hidden">
              <Logo />
            </div>

            {!showForgot ? (
              <div className={`${widgetPanelClass} flex flex-col gap-5`}>
                <div className="flex flex-col gap-0.5">
                  <h2 className={widgetTitleClass}>开始智能投研</h2>
                  <p className={widgetCaptionClass}>
                    登录 Invest Wise 工作台，继续你的投决复核与风险分析。
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className={widgetLabelClass}>邮箱地址</label>
                    <div className="relative">
                      <SFIcon
                        icon={IconMail}
                        size={20}
                        className={widgetIconClass}
                      />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className={widgetInputClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className={widgetLabelClass}>密码</label>
                      <button
                        type="button"
                        className="text-[14px] font-normal leading-6 text-[#0285ff] hover:text-[#006fd6]"
                        onClick={() => setShowForgot(true)}
                      >
                        忘记密码？
                      </button>
                    </div>
                    <div className="relative">
                      <SFIcon
                        icon={IconKey}
                        size={20}
                        className={widgetIconClass}
                      />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="至少 8 位"
                        className={widgetInputClass}
                        required
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 text-[14px] font-normal leading-6 text-[#999]">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#d3d3d3] accent-black"
                    />
                    <span>我同意服务条款与隐私保护，Demo 数据仅用于演示。</span>
                  </label>

                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    className="h-11 w-full rounded-3xl bg-black text-[16px] font-normal text-white hover:bg-neutral-800 active:scale-[0.99]"
                    disabled={submitting || !accepted}
                  >
                    {submitting ? "登录中…" : "登录"}
                  </Button>

                  <p className="text-center text-[12px] font-normal leading-normal text-[#a6a6a6]">
                    Demo 环境：任意邮箱 + 任意密码即可进入演示
                  </p>
                </form>
              </div>
            ) : (
              <div className={`${widgetPanelClass} flex flex-col gap-5`}>
                <div className="flex flex-col gap-0.5">
                  <h2 className={widgetTitleClass}>找回密码</h2>
                  <p className={widgetCaptionClass}>
                    输入注册邮箱，系统将发送重置链接（Demo 中仅保留入口）。
                  </p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setShowForgot(false);
                  }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <label className={widgetLabelClass}>邮箱地址</label>
                    <div className="relative">
                      <SFIcon
                        icon={IconMail}
                        size={20}
                        className={widgetIconClass}
                      />
                      <Input
                        type="email"
                        placeholder="name@company.com"
                        className={widgetInputClass}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    className="h-11 w-full rounded-3xl bg-black text-[16px] font-normal text-white hover:bg-neutral-800 active:scale-[0.99]"
                  >
                    发送重置链接
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="h-11 w-full rounded-3xl border border-[#d3d3d3] bg-white text-[16px] font-normal text-black hover:bg-[#fafafa] active:scale-[0.99]"
                    onClick={() => setShowForgot(false)}
                  >
                    返回登录
                  </Button>
                </form>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-[12px] font-normal leading-normal text-[#a6a6a6]">
              <SFIcon icon={IconShieldCheck} size={16} className="text-[#888]" />
              数据隔离 · 私有化部署 · 仅本项目工作区可见
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
