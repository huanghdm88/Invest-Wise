import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Conversation, Project } from "@/src/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 简单的本地随机 ID */
export function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 是否应在侧边栏「项目子集 / 最近」中展示 */
export function isListedConversation(c: Conversation): boolean {
  return !c.isDraft;
}

/** 项目是否处于「解析中」状态：项目状态为解析中，或知识库内有文件正在上传/解析 */
export function isProjectAnalyzing(p: Project): boolean {
  if (p.status === "parsing") return true;
  return p.files.some((f) => f.status === "uploading" || f.status === "parsing");
}

/** 格式化"X 分钟/小时/天前" */
export function formatRelative(time: Date | string): string {
  const d = typeof time === "string" ? new Date(time) : time;
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString("zh-CN");
}
