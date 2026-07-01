# 空白幻灯片 MVP 技术方案

## 1. 文档目标

这份文档承接 [开发文档-空白幻灯片需求分析.md](/Users/yytest/Documents/projects/word/docs/开发文档-空白幻灯片需求分析.md)，进一步把需求收敛成可执行的 MVP 技术方案。

重点回答 4 个问题：

1. 用什么数据结构实现
2. 页面如何拆组件
3. 核心流程如何串起来
4. 第一版开发任务怎么排

## 2. 当前仓库现状

当前仓库没有应用代码，只有两类内容：

1. `空白幻灯片.pptx`
2. `output/*.json` 单词数据文件

从抽样文件看，`output/*.json` 已经可以直接作为词典基础数据源，包含字段：

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

由于仓库里没有现成前端工程，当前技术方案只定义实现方向，不强绑定框架。

但为了后续开发效率，建议默认采用：

1. React
2. TypeScript
3. 本地 JSON 文件作为词典数据源
4. LocalStorage 或 IndexedDB 作为用户状态存储

如果后面你准备搭 Next.js、Vite React 或 Taro/uni-app，我可以再据此输出对应的项目脚手架方案。

## 4. MVP 功能范围

第一版只实现：

1. 首页搜索框与搜索历史
2. 查词详情页基础展示
3. 单词块首页骨架与核心分类卡片
4. 我的单词本列表
5. 单词本详情页单词网格
6. 用户本地状态维护
7. 两种排序切换

第一版不实现：

1. 底部导航真实交互
2. 顶部黑色统计模块真实数据
3. OCR 导入
4. 单词册
5. 左上角完整功能菜单
6. 常查单词与忽略单词完整页面

## 5. 推荐目录结构

如果新建前端工程，建议结构如下：

```text
src/
  app/
    routes/
      index/
      word-detail/
      wdbook-home/
      wdbook-detail/
  components/
    search/
    history/
    word/
    wdbook/
    common/
  data/
    output/
  services/
    dictionary/
    user-state/
    wdbook/
  store/
  types/
  utils/
  constants/
```

说明：

1. `data/output` 存放现有词典 `json`
2. `services/dictionary` 负责词典读取
3. `services/user-state` 负责 `wordJsonU`、`searchList` 等本地状态
4. `services/wdbook` 负责单词本计算逻辑
5. `types` 统一类型定义

## 6. 数据模型设计

## 6.1 词典基础数据

建议直接把 `output/*.json` 抽象成：

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
  HomeTabs
  SearchHistoryPanel
    SearchHistoryItem
```

组件职责：

1. `SearchHeader` 负责输入、聚焦状态、搜索提交
2. `HomeTabs` 负责展示 3 个 Tab
3. `SearchHistoryPanel` 负责渲染历史记录

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

1. 直接按单词名读取 `output/<word>.json`
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

说明：

1. PPT 里 `wdBook` 同时指首页模块和详情模块，真实实现不要共用同一路由
2. 否则页面职责会混乱

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

## 14. 风险与注意事项

## 14.1 风险一：PPT 存在概念未闭合

包括：

1. `c` 和 `d` 的差异
2. 紫色语义
3. AI 单词本中部分分类的判定规则

处理方式：

1. 第一版将这类逻辑配置化
2. 不把未确认规则硬编码到核心模型

## 14.2 风险二：`output/*.json` 可能并不完整

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

## 15. 下一步建议

如果继续往下推进，最合理的顺序是：

1. 先搭一个最小前端工程
2. 把 `output/*.json` 接成词典服务
3. 把这份技术方案落成类型定义和本地状态服务
4. 先做首页和查词页
5. 再做单词块首页和单词本详情页

如果你要继续，我下一步可以直接开始做两种事情中的一种：

1. 生成项目脚手架和基础代码
2. 继续补一份“接口与类型定义文档”，把所有 TS 类型和服务方法列全
