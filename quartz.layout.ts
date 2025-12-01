import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { FileTrieNode } from "./quartz/components/ExplorerNode"

// Explorer 配置：过滤、映射、排序
const explorerConfig = {
  title: "目录",
  folderDefaultState: "collapsed" as const,
  folderClickBehavior: "collapse" as const,
  // 过滤：隐藏 _MOC 索引文件（它们是文件夹的入口，不需要单独显示）
  filterFn: (node: FileTrieNode) => {
    // 空值保护：node.name 可能为 undefined
    if (!node.name) return true
    return !node.name.startsWith("_")
  },
  // 映射：简化 ADR 文件名显示
  mapFn: (node: FileTrieNode) => {
    const name = node.name ?? ""
    // ADR-001-xxx-yyy → ADR-001
    if (name.match(/^ADR-\d{3}/)) {
      node.displayName = name.replace(/^(ADR-\d{3})-.+$/, "$1")
    }
    // 文件夹名称中文化
    const folderNames: Record<string, string> = {
      "decisions": "📋 架构决策",
      "designs": "🏗️ 设计文档",
      "devlog": "📝 开发日志",
      "learning": "📖 学习笔记",
      "bugs": "🐛 Bug 记录",
      "til": "💡 TIL",
      "daily": "每日",
      "weekly": "周报",
      "monthly": "月报",
      "observability": "可观测性",
      "infrastructure": "基础设施",
    }
    if (node.isFolder && folderNames[name]) {
      node.displayName = folderNames[name]
    }
    return node
  },
  // 排序：文件夹优先，然后按名称排序
  sortFn: (a: FileTrieNode, b: FileTrieNode) => {
    // 文件夹优先
    if (a.isFolder && !b.isFolder) return -1
    if (!a.isFolder && b.isFolder) return 1
    // 同类型按名称排序（空值保护）
    const nameA = a.name ?? ""
    const nameB = b.name ?? ""
    return nameA.localeCompare(nameB, "zh-CN")
  },
}

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/linqibin0826/Patra-api",
      "文档源码": "https://github.com/linqibin0826/Patra-docs",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.DesktopOnly(Component.Explorer(explorerConfig)),
  ],
  right: [
    Component.DesktopOnly(Component.Graph()),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.DesktopOnly(Component.Backlinks()),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.DesktopOnly(Component.Explorer(explorerConfig)),
  ],
  right: [],
}
