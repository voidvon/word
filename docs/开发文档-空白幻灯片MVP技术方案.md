# 空白幻灯片 MVP 技术方案

## 1. 文档目标

这份文档承接 [开发文档-空白幻灯片需求分析.md](/Users/yytest/Documents/projects/word/docs/开发文档-空白幻灯片需求分析.md)，进一步把需求收敛成可执行的 MVP 技术方案。

当前项目不是传统意义上的完整整屏词典 App，而是完整 App 的左侧边栏子应用。完整 App 会分成左右两栏：左栏承载当前词典、搜索、单词块、每日推荐、知识圈等模块，右栏承载用户正在浏览的英文网页或其它页面。

后续右栏网页会通过 App 内置通道读取左栏状态，并把网页内的选词、查词、加入学习、忽略等行为回传到左栏。产品最终还会通过 JS 注入到右侧网页中，实现类似 Relingo 的单词提示，并继续扩展更多网页增强能力。

重点回答 4 个问题：

1. 用什么数据结构实现
2. 页面如何拆组件
3. 核心流程如何串起来
4. 第一版开发任务怎么排

## 2. 当前仓库现状

当前仓库已经是 Vite + React + TypeScript 前端工程，核心内容包括：

1. `src/views` 页面实现
2. `src/services` 词典、用户状态、单词本等业务服务
3. `src/data/dictionary/*.json` 单词数据文件
4. `docs/空白幻灯片.pptx` 与配套需求/技术文档

从抽样文件看，`src/data/dictionary/*.json` 已经可以直接作为词典基础数据源，包含字段：

```json
{
  "word": "terminate",
  "ipa": "[ˈtɜ:mɪneɪt]",
  "frm": "terminated, terminating, terminates",
  "tags": ["CET6", "TEM4"],
  "spoken": {
    "rank": 4830,
    "total": 5005,
    "lemmas": "terminated[2262] terminating[426]"
  },
  "pos_percents": [
    {
      "pos": "VERB",
      "rank": 4481,
      "total": 221420
    }
  ],
  "trans_percents": [
    {
      "text": "终止",
      "percent": 86
    }
  ],
  "trans": [
    {
      "pos": "vt.",
      "text": "使终止；使结束；解雇"
    }
  ]
}
```

这意味着 MVP 阶段不需要先建设远端词典接口，可以先直接用本地 `json` 文件驱动页面。

## 3. 技术边界

当前工程采用：

1. React
2. TypeScript
3. 本地 JSON 文件作为词典数据源
4. LocalStorage 或 IndexedDB 作为用户状态存储
5. 前端路由承载左侧边栏中的独立模块

当前 MVP 的实现边界是左侧边栏。右侧网页容器、真实 WebView/浏览器壳、JS 注入脚本和跨栏桥接层可以先定义接口边界，不在首版完整实现。

后续如果 App 外壳明确为桌面端、移动端 WebView 或浏览器扩展，需要在桥接层适配对应运行时。

## 4. MVP 功能范围

第一版只实现：

1. 首页搜索框与搜索历史
2. 查词详情页基础展示
3. 单词块首页骨架与核心分类卡片
4. 我的单词本列表
5. 单词本详情页单词网格
6. 用户本地状态维护
7. 两种排序切换
8. 底部导航承载首页、每日推荐、单词块、知识圈
9. 为右侧网页读取和回传数据预留服务接口

第一版不实现：

1. 顶部黑色统计模块真实数据
2. OCR 导入
3. 单词册
4. 左上角完整功能菜单
5. 常查单词与忽略单词完整页面
6. 右侧网页容器
7. 生产级跨栏通信桥接
8. JS 注入脚本、网页内高亮、释义浮层等类 Relingo 能力

## 5. 推荐目录结构

当前前端工程建议按以下结构继续演进：

```text
src/
  views/
    HomePage.tsx
    WordDetailPage.tsx
    WdBookHomePage.tsx
    WdBookDetailPage.tsx
    DailyRecommendPage.tsx
    KnowledgeFeedPage.tsx
  components/
    search/
    history/
    word/
    wdbook/
    common/
  data/
    dictionary/
  services/
    dictionary.ts
    userState.ts
    wdbook.ts
    bridge.ts
    injection.ts
  store/
  types/
  utils/
  constants/
```

说明：

1. `src/data/dictionary` 存放现有词典 `json`
2. `services/dictionary` 负责词典读取
3. `services/user-state` 负责 `wordJsonU`、`searchList` 等本地状态
4. `services/wdbook` 负责单词本计算逻辑
5. `types` 统一类型定义
6. `services/bridge` 后续负责左栏与右侧网页之间的数据读取和行为回传
7. `services/injection` 后续负责注入脚本需要的词典查询、状态映射和提示数据组装

## 6. 数据模型设计

## 6.1 词典基础数据

建议直接把 `src/data/dictionary/*.json` 抽象成：

```ts
export type DictionaryWord = {
  word: string
  ipa?: string
  frm?: string
  tags?: string[]
  spoken?: {
    rank?: number
    total?: number
    lemmas?: string
  }
  pos_percents?: Array<{
    pos: string
    rank?: number
    total?: number
  }>
  trans_percents?: Array<{
    text: string
    percent: number
  }>
  trans?: Array<{
    pos: string
    text: string
  }>
}
```

## 6.2 用户单词状态

建议：

```ts
export type WordUserStatusType = "a" | "b" | "c" | "d"

export type WordUserState = {
  s: WordUserStatusType
  a?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
  sc: number
  t: number
  l: number[]
}

export type WordUserStateMap = Record<string, WordUserState>
```

字段语义：

1. `s`：学习状态
2. `a`：艾宾浩斯阶段
3. `sc`：查询次数
4. `t`：状态相关时间
5. `l`：所属单词本 id 列表

## 6.3 搜索历史

建议：

```ts
export type SearchList = string[]
```

规则：

1. 只保存单词
2. 最近查询放前面
3. 去重

## 6.4 待复习列表

建议：

```ts
export type StudyList = string[]
```

用途：

1. 驱动“待复习单词”分类
2. 加速首页概览计算

## 6.5 单词本结构

建议不要直接沿用 PPT 里过于压缩的字段格式，而是在实现里做可读性更高的版本：

```ts
export type WordBookId = number

export type WordBook = {
  id: WordBookId
  kind: "book"
  name: string
  report: {
    total: number
    mastered: number
  }
  wordsByAdd: string[]
  wordsByAlpha: string[]
  createdAt: number
  updatedAt: number
}

export type WordBookGroup = {
  id: WordBookId
  kind: "group"
  name: string
  bookIds: WordBookId[]
  createdAt: number
  updatedAt: number
}

export type WordBookEntity = WordBook | WordBookGroup

export type WordBookMap = Record<number, WordBookEntity>

export type WordBookList = number[]
```

这样比 `s:b`、`n:xxx` 这种缩写结构更易维护。

如果后面要兼容 PPT 里的精简存储格式，可以在落盘层做编码转换，但内存态不建议继续使用缩写字段。

## 6.6 本地存储总结构

建议统一保存在一个用户状态对象里：

```ts
export type AppUserData = {
  version: 1
  searchList: string[]
  studyList: string[]
  wordUserMap: WordUserStateMap
  wordBookList: WordBookList
  wordBookMap: WordBookMap
  updateList: Array<{
    type: string
    payload: unknown
    createdAt: number
  }>
}
```

优点：

1. 便于整体持久化
2. 便于版本迁移
3. 便于未来同步到服务端

## 7. 状态规则设计

## 7.1 艾宾浩斯阶段映射

建议在常量文件固定：

```ts
export const REVIEW_STAGE_DELAYS = {
  0: 0,
  1: 20 * 60 * 1000,
  2: 60 * 60 * 1000,
  3: 9 * 60 * 60 * 1000,
  4: 24 * 60 * 60 * 1000,
  5: 2 * 24 * 60 * 60 * 1000,
  6: 6 * 24 * 60 * 60 * 1000,
  7: 31 * 24 * 60 * 60 * 1000,
} as const
```

## 7.2 `t` 字段规则

必须统一约定：

1. `s = "a"` 时，`t` 表示下次应复习时间
2. `s = "b" | "c" | "d"` 时，`t` 表示最近状态变更时间

实现中建议封装 helper：

```ts
function getNextReviewTime(stage: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, now: number): number
```

## 7.3 查询行为规则

用户查词时：

1. 更新 `searchList`
2. 初始化或更新 `wordUserMap[word]`
3. `sc += 1`
4. 保留当前学习状态不变

注意：

1. 查词不应强行改变 `s`
2. 查词不应自动加入单词本

## 7.4 加入学习流规则

用户把一个词加入学习流时：

1. 若该词无用户状态，则初始化
2. `s = "a"`
3. `a = 0`
4. `t = now`
5. 写入 `studyList`
6. 写入指定单词本

## 7.5 忽略规则

用户忽略一个词时：

1. `s = "b"`
2. `t = now`
3. 该词从“应学习集合”中剔除

## 7.6 掌握规则

用户掌握一个词时：

1. `s = "c"` 或 `s = "d"`
2. `t = now`
3. 所属单词本 `mastered` 统计增加

当前产品歧义依然存在：

1. `c`
2. `d`

这两个状态的业务差异在开发前仍然需要确认。

## 8. 页面组件设计

## 8.1 首页

推荐组件树：

```text
HomePage
  SearchHeader
    MenuButton
    SearchInput
    VoiceButton
    CameraButton
  SearchHistoryPanel
    SearchHistoryItem
```

组件职责：

1. `SearchHeader` 负责输入、聚焦状态、搜索提交
2. `SearchHistoryPanel` 负责渲染历史记录
3. 每日推荐、单词块、知识圈通过全局底部导航进入独立页面，不放在首页搜索框下方

## 8.2 查词详情页

推荐组件树：

```text
WordDetailPage
  WordDetailHeader
  WordBasicInfo
  WordMeaningList
  WordActionBar
```

当前 MVP 只要求做到：

1. 单词
2. 音标
3. 词义
4. 可选的“加入学习流”按钮

## 8.3 单词块首页

推荐组件树：

```text
WdBookHomePage
  WdBookSummaryHero
  AiBookSection
    AiBookCard
  UserBookSection
    UserBookCard
    CreateBookCard
```

说明：

1. `WdBookSummaryHero` 首版只做占位
2. `AiBookSection` 负责 6 个核心分类卡片
3. `UserBookSection` 负责我的单词本列表

## 8.4 单词本详情页

推荐组件树：

```text
WdBookDetailPage
  WdBookTopBar
  SortSwitcher
  WordGrid
    WordGridItem
```

关键点：

1. `WordGridItem` 根据状态决定颜色
2. `SortSwitcher` 实际上可以挂在左上角菜单中
3. 首版即使 UI 没做完整菜单，也要保留排序切换能力

## 9. 服务层设计

## 9.1 词典服务

建议提供以下接口：

```ts
type DictionaryService = {
  getWord(word: string): Promise<DictionaryWord | null>
  hasWord(word: string): Promise<boolean>
}
```

MVP 实现方式：

1. 直接按单词名读取 `src/data/dictionary/<word>.json`
2. 查不到则返回 `null`

注意：

1. 有连字符词，如 `black-and-blue.json`
2. 前端实现时要考虑 URL 编码和文件名映射

## 9.2 用户状态服务

建议接口：

```ts
type UserStateService = {
  getState(): AppUserData
  saveState(next: AppUserData): void
  touchSearchWord(word: string): AppUserData
  addWordToStudy(word: string, bookId: number): AppUserData
  ignoreWord(word: string): AppUserData
  masterWord(word: string): AppUserData
}
```

## 9.3 单词本服务

建议接口：

```ts
type WordBookService = {
  createBook(name: string): AppUserData
  renameBook(bookId: number, name: string): AppUserData
  deleteBook(bookId: number): AppUserData
  addWordToBook(bookId: number, word: string): AppUserData
  removeWordFromBook(bookId: number, word: string): AppUserData
  getBookWords(bookId: number, sortMode: "add" | "alpha"): string[]
}
```

## 9.4 跨栏桥接服务

跨栏桥接服务用于隔离左侧边栏状态和右侧网页环境。MVP 阶段可以先复用 LocalStorage 和普通函数，后续根据 App 外壳替换成 WebView bridge、postMessage、扩展 runtime message 或其它宿主能力。

建议接口：

```ts
type SidebarBridgeService = {
  getWordForPage(word: string): Promise<DictionaryWord | null>
  getWordUserState(word: string): WordUserState | null
  reportLookupFromPage(word: string, source: "hover" | "select" | "manual"): AppUserData
  reportWordActionFromPage(word: string, action: "add" | "ignore" | "master"): AppUserData
  subscribeStateChange(listener: (next: AppUserData) => void): () => void
}
```

设计约束：

1. 右侧网页不能直接读写任意左侧内部状态，只通过桥接服务访问有限能力
2. 写入类行为必须复用 `userState` 服务，避免出现两套状态更新规则
3. 桥接层要保留来源字段，后续区分左栏手动查词和网页注入触发的查词
4. 右侧网页刷新提示时应订阅状态变更，而不是反复全量扫描左栏数据

## 9.5 注入服务

注入服务面向右侧网页里的 JS 脚本，负责把词典和用户状态转换成网页可消费的数据。

建议首版只定义纯数据能力：

```ts
type InjectionService = {
  shouldAnnotateWord(word: string): Promise<boolean>
  getAnnotation(word: string): Promise<{
    word: string
    shortTranslation: string
    state: WordUserState | null
    status: "new" | "learning" | "ignored" | "mastered"
  } | null>
}
```

后续网页注入脚本再基于这层能力实现：

1. 网页正文单词识别
2. 单词高亮或下划线
3. 悬停/点击释义浮层
4. 加入学习、忽略、标记掌握等快捷动作
5. 与左栏页面的状态同步

## 10. 计算逻辑设计

## 10.1 AI 单词本分类计算

当前建议基于用户状态动态计算，不单独永久存储：

1. 待复习单词：`s = "a"` 且 `t <= now`
2. 今日新词：当天新加入学习流的词
3. 易错词：后续规则补充，MVP 可先留空或用占位数据
4. 不认识：后续规则补充，MVP 可先留空或用占位数据
5. 重点关注：后续规则补充，MVP 可先留空或用占位数据
6. 砍掉的单词：`s = "c"`

这部分 PPT 没有把所有分类的判定条件讲全，所以第一版不要把规则写死得太复杂。

## 10.2 单词本进度计算

对每个 book：

1. `total = wordsByAdd.length`
2. `mastered = 该 book 中状态为 c/d 的单词数`

然后生成：

```ts
report = {
  total,
  mastered,
}
```

## 10.3 单词色块颜色计算

建议通过状态映射：

```ts
function getWordTileColor(state: WordUserState | undefined): string
```

初版规则建议：

1. `undefined`：默认蓝灰
2. `s = "a"` 且到期：橙色
3. `s = "a"` 且未到期：蓝色或绿色
4. `s = "b"`：灰色
5. `s = "c"`：紫色或产品确认色
6. `s = "d"`：另一种完成态颜色

这里必须说明：PPT 没完整定义紫色，所以这部分需要产品二次确认。

## 11. 持久化建议

MVP 推荐优先用 LocalStorage，原因：

1. 数据量目前不大
2. 开发成本低
3. 易于调试

当单词本、状态变更日志和离线词典缓存继续扩大时，再迁移到 IndexedDB。

本地存储 key 建议：

```ts
const USER_STATE_STORAGE_KEY = "word-app-user-state-v1"
```

## 12. 路由建议

建议显式拆成 4 个页面：

1. `/`
2. `/word?wd=<word>&l=en`
3. `/wdbook`
4. `/wdbook/:bookId`
5. `/daily`
6. `/knowledge`

说明：

1. PPT 里 `wdBook` 同时指首页模块和详情模块，真实实现不要共用同一路由
2. 否则页面职责会混乱
3. 每日推荐和知识圈是底部导航里的独立模块，不作为首页内嵌 Tab

## 13. MVP 开发任务拆分

## 13.1 Phase 1 数据底座

1. 定义 TypeScript 类型
2. 定义 LocalStorage 存储结构
3. 实现词典读取服务
4. 实现用户状态服务
5. 实现单词本服务

## 13.2 Phase 2 首页与查词页

1. 首页搜索头部
2. 首页历史记录列表
3. 查词详情页基础信息展示
4. 查词动作联动用户状态

## 13.3 Phase 3 单词块模块

1. 单词块首页布局
2. AI 单词本卡片
3. 我的单词本列表
4. 创建单词本
5. 单词本详情页网格
6. 排序切换

## 13.4 Phase 4 补强

1. 完善分类统计
2. 完善单词颜色映射
3. 接入更多页面交互
4. 预留同步与 OCR 扩展点
5. 定义左栏与右侧网页之间的桥接服务
6. 定义注入脚本所需的单词提示数据结构

## 14. 风险与注意事项

## 14.1 风险一：PPT 存在概念未闭合

包括：

1. `c` 和 `d` 的差异
2. 紫色语义
3. AI 单词本中部分分类的判定规则

处理方式：

1. 第一版将这类逻辑配置化
2. 不把未确认规则硬编码到核心模型

## 14.2 风险二：`src/data/dictionary/*.json` 可能并不完整

当前只能确认它适合做查词页基础展示，不能确认它是否覆盖所有业务词。

处理方式：

1. 词典服务要允许返回 `null`
2. 页面要有“未找到词条”兜底状态

## 14.3 风险三：PPT 中“模块名”和“路由名”混用

例如 `wdBook` 同时被用于：

1. 单词块首页模块
2. 单词本详情页

处理方式：

1. 工程里分开命名
2. 路由和组件都不要沿用这个混合语义

## 14.4 风险四：跨栏运行时尚未确定

当前只知道右侧网页会通过 App 内置通道读取左栏数据并回传行为，但宿主形态还没有明确。

可能的运行时包括：

1. WebView bridge
2. iframe / postMessage
3. 浏览器扩展 runtime message
4. 宿主 App 自定义 JS API

处理方式：

1. 左栏业务服务先保持纯函数和本地状态接口
2. 把跨栏能力集中在 `bridge` 服务中
3. 注入脚本只依赖 `bridge` 暴露的有限接口，不直接耦合 React 页面

## 15. 下一步建议

如果继续往下推进，最合理的顺序是：

1. 补齐未完成的单词本管理能力：重命名、删除、详情页搜索
2. 让每日推荐优先使用 `src/data/dictionary/*.json` 中的真实词库数据
3. 把“常查”和“忽略”分类落成真实统计和页面入口
4. 抽出 `bridge` 服务，先用本地函数模拟右侧网页读取和回传
5. 再定义注入脚本的数据协议，为类 Relingo 的提示能力做准备

如果你要继续，我下一步可以直接开始做两种事情中的一种：

1. 继续补单词本管理功能
2. 先做 `bridge` / `injection` 的接口和本地模拟实现
