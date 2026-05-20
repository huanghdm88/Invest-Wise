/**
 * 项目统一的图标映射 — 全部使用 Apple SF Symbols 7。
 *
 * 维护规则：
 * 1. 新增图标在此处加一条 `export { sfXxx as IconName } from ...`
 * 2. 业务文件统一从 `@/src/lib/icons` 引入语义化图标名
 *    （而不是直接 `import { sfXxx } from "@bradleyhodges/sfsymbols"`）
 * 3. 命名采用语义化 PascalCase，与 lucide-react 命名靠拢，方便未来切换
 *
 * SF Symbols 命名规则参考：
 *   "arrow.up"       → sfArrowUp
 *   "folder.fill"    → sfFolderFill
 *   "checkmark.circle.fill" → sfCheckmarkCircleFill
 */

export {
  // —— 方向 / 操作 ——
  sfArrowRight as IconArrowRight,
  sfArrowUp as IconArrowUp,
  sfArrowDownToLine as IconDownload,
  sfArrowUpToLine as IconUpload,
  sfArrowClockwise as IconRefresh,
  sfChevronDown as IconChevronDown,
  sfChevronLeft as IconChevronLeft,
  sfChevronRight as IconChevronRight,
  sfChevronUp as IconChevronUp,
  sfSidebarRight as IconSidebarRight,
  sfPlus as IconPlus,
  sfXmark as IconClose,
  sfEllipsis as IconMore,
  sfStopFill as IconStop,
  sfPaperplaneFill as IconSend,
  sfPaperclip as IconAttach,
  sfPencil as IconRename,
  sfTrash as IconDelete,
  sfArchivebox as IconArchive,

  // —— 文件 / 文档 ——
  sfDocument as IconFile,
  sfTextDocument as IconFileText,
  sfTablecells as IconFileSpreadsheet,
  sfDocumentCircleFill as IconFileCheck,

  // —— 文件夹 / 项目 ——
  sfFolderFill as IconFolderOpen,
  sfFolderBadgePlus as IconFolderPlus,
  sfSquareGrid2x2 as IconFolderManager,

  // —— 数据 / 系统 ——
  sfExternaldrive as IconDatabase,
  sfGearshape as IconSettings,
  sfGlobe as IconGlobe,
  sfInfoCircle as IconInfo,
  sfCheckmarkCircleFill as IconCheckCircle,
  sfQuestionmarkCircleFill as IconHelpCircle,

  // —— 模式 / 业务语义 ——
  sfCheckmarkSquare as IconFactCheck, // 事实验证
  sfBoltShield as IconChallenge,       // 挑战质询（盾+闪电，比 sword 更克制）
  sfSparkles as IconAuto,              // 智能路由
  sfFunction as IconCalculator,        // 估值
  sfChartLineUptrendXyaxis as IconTrendUp,
  sfListBulletClipboard as IconChecklist,
  sfScope as IconTarget,
  sfWandAndRays as IconWand,           // 自定义指令
  sfLightbulb as IconLightbulb,
  sfBubbleRight as IconMessage,

  // —— 安全 / 风险 ——
  sfExclamationmarkShieldFill as IconShieldAlert,
  sfCheckmarkShieldFill as IconShieldCheck,

  // —— 个人 / 公司 ——
  sfPersonFill as IconUser,
  sfBuilding2 as IconBuilding,
  sfSafari as IconCompass,             // 投资阶段（罗盘语义用 Safari）
  sfHandThumbsup as IconThumbUp,
  sfHandThumbsdown as IconThumbDown,

  // —— 登录 ——
  sfEnvelope as IconMail,
  sfKey as IconKey,
} from "@bradleyhodges/sfsymbols";
