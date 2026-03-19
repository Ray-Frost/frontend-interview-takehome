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

- 这次把优化重点放在“减少无意义的 React 更新”和“减少每次有效更新的行内计算”两层，没有继续处理表头与网格主体的像素级滚动对齐。
- 目前表头仍然按列窗口跳转，而主体内容按真实像素滚动；因此在同一列内横向滑动时，booking bar 和日期表头仍可能暂时错位。这是已知限制，不属于本次提交要解决的问题。
- 我选择先交付渲染降噪和数据预计算，因为它们直接解决 render storm；表头平滑对齐需要单独引入列内偏移同步逻辑，适合在下一步独立处理。

## 如果有更多时间

### 1. Next.js 安全漏洞

- 在主线完成后，新开分支升级到 `Next 16.2.0+`，并同步处理 `React 19`、ESLint CLI 迁移、Node LTS 基线和完整构建验证。
- 对比 `14.2.35` 和 `16.x` 的收益与额外复杂度，再决定是否值得把最终交付切换到新主版本。

### 4. Booking Grid 横向滚动体验

- 为表头补上列内像素偏移同步，让日期列和 booking bar 在同一列宽内横向滑动时也保持对齐。
- 在当前渲染降噪基础上，再评估是否值得接入 `visibleColumnsBuffer` 或进一步收敛虚拟化实现细节。
