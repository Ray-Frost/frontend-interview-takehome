## 发现的问题

### 1. Next.js 安全漏洞

- 初始版本 `next@14.2.3` 命中了已知的生产依赖安全公告。
- 升级到 `14.2.35` 后，原先更严重的生产告警已移除，但 `npm audit --omit=dev` 仍剩 `1` 个 `next` 高危告警。
- 根据当前 audit 结果，彻底清除该告警需要升级到 `next@16.2.0+`，属于跨大版本变更。

### 2. Lint 机制不完整

- 在当前使用的 `next@14.2.35` 中，`next lint` 默认只覆盖 `pages`、`app`、`components`、`lib`、`src`；因此 `context`、`hooks`、`types` 没有被显式纳入检查范围。
- 项目缺少一个直接可用的自动修复入口，不利于快速处理可自动修复的 ESLint 问题。

### 3. Booking Grid 的 hover 状态放大了渲染成本

- `Booking Calendar` 里的 `hoveredCell` 放在全局 `AppContext` 中，任意单元格 hover 都会更新 context。
- `RoomRow` 依赖这个 context 后，鼠标在网格中移动时会触发所有行重新执行，放大了 hover 交互的渲染成本。

### 4. Booking Grid 横向滚动的渲染成本过高

- `Booking Calendar` 的横向虚拟化依赖 `visibleRange`，但初始实现把连续变化的 `scrollLeft` 直接放进 React state。
- 结果是只要发生横向滚动，`BookingGrid` 就会在几乎每个 `scroll` event 上重渲染，并带着所有 `RoomRow` 一起重新执行。
- 同时，`RoomRow` 每次渲染还会重复做按房间筛 booking、日期偏移计算和状态色计算，进一步放大跨列更新时的成本。

### 5. Booking Grid 横向窗口对齐不完整

- 旧的横向窗口逻辑只维护列范围，没有消费列内像素偏移，导致表头和主体内容只在“跨列”时同步，在同一列内继续滚动时仍可能错位。
- 可见列数写死为 `14`，窗口范围没有根据真实容器宽度动态变化；在不同 viewport 下，表头、网格单元和 booking bar 的对齐基础并不稳定。
- `RoomRow` 里的背景格子和 booking bar 使用的是相对可见窗口的定位方式，而不是完整轨道坐标，这让横向滚动时多个渲染层更容易各自计算、相互漂移。

### 6. 消息页选中态存在多份来源并发生残留

- `messages` 页面同时从 URL query、SSR `initialTicketId` 和 `MessagesContext.activeTicketId` 三处决定当前选中的 ticket。
- `MessagesContext` 里的 `activeTicketId` / `currentHouse` 通过 `useEffect` 从 query 写入本地 state，但 query 消失时不会清空旧值。
- 结果是从 `/messages?ticketId=...` 回到 `/messages` 后，页面仍可能继续展示上一次选中的会话，状态来源发生漂移。

### 7. 侧边栏未读数依赖消息页副作用初始化

- `Sidebar` 直接读取 `MessagesContext.unreadCount`，但旧实现把它初始化为 `0`，真正的值只会在 `pages/messages/index.tsx` 里通过 `useEffect` 写回 context。
- 如果用户首次进入 `/` 而不是 `/messages`，全局 provider 在首屏没有任何机会拿到真实未读数，侧边栏就会先基于错误的初始值渲染。

## 应用的修复

### 1. Next.js 安全漏洞

- 已将 `next` 从 `14.2.3` 升级到 `14.2.35`，优先修复已确认的生产安全问题，同时尽量保持框架行为不变。
- 其余问题继续基于稳定的 `14.x` 主线修复，避免把业务问题和框架升级问题混在一起排查。

### 2. Lint 机制补全

- 新增 `lint:fix`，让项目可以直接执行 `next lint --fix` 处理可自动修复的问题。
- 在 `next.config.js` 中补全 `eslint.dirs`，让 `next lint` 同时覆盖 `context`、`hooks`、`types`，并保留 `app`、`src` 兼容性。
- 相关代码改动仅限于通过 lint 所必需的未使用导入和未使用变量清理。

### 3. Booking Grid hover 渲染优化

- 移除 `AppContext` 中的 `hoveredCell` 与 `setHoveredCell`，不再用 React 全局状态驱动网格 hover。
- `RoomRow` 改为只消费静态配置；行高亮和单元格高亮统一交给 CSS 的 `:hover` 规则处理。
- 默认背景色也一并从内联样式挪到样式表，避免内联 `background: white` 覆盖 hover 背景，确保行和房间名单元格的高亮能正常生效。

### 4. Booking Grid 横向滚动渲染优化

- `useVisibleRange` 改为只维护离散的 `{ startIndex, endIndex }`，并且只有在横向滚动跨过列边界时才更新 state，避免同一列内的细小滑动持续触发 React 重渲染。
- `BookingGrid` 统一使用 `config.dateRangeStart` 作为日历起点，提前构建 day labels，并按房间预计算 `PositionedBooking`，把日期偏移和状态色从 `RoomRow` 中移出。
- `RoomRow` 改为消费预计算后的 `positionedBookings` 并用 `React.memo` 包装，让组件只负责可见区过滤和渲染，减少跨列更新时的重复计算。

### 5. Booking Grid 横向窗口对齐修复

- 横向虚拟滚动原实现只按列索引跳转窗口，可见列数也写死为 `14`，导致表头、网格单元和 booking bar 在同一列内继续横向滑动时仍可能错位。
- `useVisibleRange` 改为根据真实滚动容器宽度和左侧固定列宽计算 `{ startIndex, endIndex, offsetPx }`，并在容器 resize 时同步更新窗口。
- 抽出共享的 `VisibleDayColumns` 组件，统一处理可见列索引展开和窗口层定位；`BookingGrid` 用它消费 `offsetPx` 平移表头日期窗口，`RoomRow` 则继续在完整轨道坐标中渲染背景格子和 booking bar。

### 6. 消息页选中态统一到 URL

- 删除 `pages/messages/index.tsx` 中基于 `initialTicketId` 的 SSR fallback，只保留一条选中链路。
- `MessagesContext` 不再把 `activeTicketId` 和 `currentHouse` 存成可残留的本地 state，而是每次 render 直接从 `router.query` 派生。
- 消息页现在只消费 context 中派生出来的 `activeTicketId`；当 URL 里没有 `ticketId` 时，选中态会自然回到 `null`。

### 7. 侧边栏未读数统一到全局消息数据源

- 把 `tickets` 请求和 `unreadCount` 派生移动到 `_app` 下全局挂载的 `MessagesProvider`，让所有入口页都消费同一份消息数据。
- 消息页不再通过页面级 `useEffect` 反向同步未读数，而是直接读取 context 中的 `tickets` 和 `unreadCount`。
- 首屏加载后，仅在 `Messages` 的 badge 区域展示**有效**数字。

## 权衡取舍

### 1. Next.js 安全漏洞

- 当前继续停留在 `14.x` 的代价是：`npm audit --omit=dev` 仍会保留 `1` 个 `next` 高危告警；若要完全清除，需要直接进入 `16.2.0+`。
- 直接从 `Next 14` 升到 `Next 16` 在技术上可行，但会同时引入 `React 19`、lint 迁移、Node 基线确认和额外回归验证成本。
- 在面试时间受限的前提下，我选择先交付一个更稳、更容易解释的 `14.x` 版本，再把 `16.x` 升级留到独立分支评估。

### 2. Lint 机制补全

- 这次只补全现有 lint 工作流和覆盖范围，没有进一步引入新的 lint 工具链或更重的质量平台，以避免把工具治理扩展成额外的架构改造。

### 3. Booking Grid hover 渲染优化

- 这次只处理了 hover 触发的 render storm，把状态更新从 React 链路中拿掉；没有在同一提交里继续处理横向滚动导致的重渲染，以避免把不同触发路径的性能问题混成一个补丁。
- 采用 CSS hover 的代价是视觉状态改由样式优先级控制，因此默认态和 hover 态都需要放在同一套样式规则下维护，不能再把默认背景留在内联样式里。

### 4. Booking Grid 横向滚动渲染优化

- 这次先把性能问题和对齐问题拆成两步处理：先降低横向滚动时的 React 更新频率和重复计算，再单独补齐表头与主体的像素级同步，避免一次提交同时混入两类风险。

### 5. Booking Grid 横向窗口对齐修复

- 这次继续沿用现有的 30 天日历范围和左侧固定房间列；旧实现里写死的 `14` 指的是可见窗口列数，不是整体日期范围。没有把日期范围生成、布局体系或样式系统一起重做，避免把一次对齐修复扩展成更大范围的 UI 重构。
- `useVisibleRange` 现在同时承担窗口范围和像素偏移的计算职责，职责比原来更重一些，但换来的是滚动性能和视觉对齐都能由同一个数据源驱动。
- 我接受这层耦合，因为在当前规模下，把窗口计算再拆成更多 hook 或状态层并不会明显降低复杂度，反而会增加同步成本。
- 我接受新增一个很薄的 `VisibleDayColumns` 组件，把“可见列展开 + 绝对定位窗口层”这段重复逻辑收敛起来；但 booking bar 的位置计算仍然留在 `RoomRow`，避免把抽象边界扩张到具体业务布局。
- 固定列仍然通过内联样式显式设置宽度和背景色，这会让布局约束比较集中，但代价是这部分样式还没有进一步抽到共享样式层。

### 6. 消息页选中态统一到 URL

- 这次选择 URL 作为唯一的 source of truth，因为“当前展示哪条会话”本质上是导航状态，天然应该和浏览器地址保持一致。
- 代价是 `MessagesContext` 不再持有一份可主动写入的 `activeTicketId/currentHouse` state；如果后续需要支持脱离 URL 的草稿态或临时选中态，应当新增独立状态，而不是重新把路由状态写回 context。
- 选择去掉 `getServerSideProps` 里的 `initialTicketId` 是因为它只是 query 的镜像，没有引入额外信息；继续保留只会制造双份同源状态和同步成本。

### 7. 侧边栏未读数统一到全局消息数据源

- 我接受把消息列表请求提升到 `MessagesProvider`，因为 `Sidebar` 本来就属于全局 UI；让 provider 拥有这份数据比继续依赖页面副作用更符合组件层级。
- 首屏进入 `/` 时，`Messages` badge 会短暂处于未加载状态，这比错误显示 `0` 更符合真实语义。
- 当前实现已经在模拟真实后端的 API 边界；如果后续把项目内的 mock API 替换成真实后端服务，仍应保留“由全局 provider 持有消息数据”这条职责边界。考虑到侧边栏挂在 `_app`，要为这次问题引入 SSR `prefetch + hydrate` 会连带扩大到全局数据获取方式调整，所以我先保留当前首屏短暂 loading 的权衡。

## 如果有更多时间

### 1. Next.js 安全漏洞

- 在主线完成后，新开分支升级到 `Next 16.2.0+`，并同步处理 `React 19`、ESLint CLI 迁移、Node LTS 基线和完整构建验证。
- 对比 `14.2.35` 和 `16.x` 的收益与额外复杂度，再决定是否值得把最终交付切换到新主版本。

### 4. Booking Grid 横向滚动体验

- 在当前渲染降噪基础上，再评估是否值得接入 `visibleColumnsBuffer` 或进一步收敛虚拟化实现细节。

### 5. Booking Grid 横向窗口对齐修复

- 把 `TOTAL_DAYS` 从固定常量改为由 `dateRangeStart` / `dateRangeEnd` 推导，消除 30 天窗口和配置范围之间潜在的不一致。

### 6. 消息页选中态统一到 URL

- 如果后续消息页需要支持首条会话自动选中，可以显式定义一条新规则，例如“只有 URL 缺省且用户首次进入 `/messages` 时才自动跳转到第一条会话”，而不是重新恢复多来源 fallback。
