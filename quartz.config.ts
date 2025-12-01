import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Patra 文档",
    pageTitleSuffix: " | Patra",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "zh-CN",
    baseUrl: "linqibin0826.github.io/Patra-docs",
    ignorePatterns: ["private", "templates", ".obsidian", ".claude", "00-inbox", "attachments", "_config.yml"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Noto Serif SC",      // 中文衬线标题
        body: "Noto Sans SC",         // 中文无衬线正文
        code: "JetBrains Mono",       // 代码字体
      },
      colors: {
        // 温暖舒适风格 - 类似 Notion/Obsidian
        lightMode: {
          light: "#faf9f6",           // 米白背景
          lightgray: "#f0ebe3",       // 浅暖灰
          gray: "#a8a29e",            // 中性暖灰
          darkgray: "#44403c",        // 深暖灰（正文）
          dark: "#292524",            // 深棕（标题）
          secondary: "#b45309",       // 琥珀色（链接）
          tertiary: "#78716c",        // 石灰色（悬停）
          highlight: "rgba(180, 83, 9, 0.1)",
          textHighlight: "#fef3c7",
        },
        darkMode: {
          light: "#1c1917",           // 深石墨
          lightgray: "#292524",       // 深暖灰
          gray: "#57534e",            // 中暖灰
          darkgray: "#d6d3d1",        // 浅暖灰（正文）
          dark: "#fafaf9",            // 米白（标题）
          secondary: "#fbbf24",       // 金黄色（链接）
          tertiary: "#a8a29e",        // 石灰色（悬停）
          highlight: "rgba(251, 191, 36, 0.1)",
          textHighlight: "#78350f",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
