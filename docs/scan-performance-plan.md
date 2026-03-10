### 大媒体库扫描稳定性改造方案（对齐系统播放器体验）

#### Summary
当前卡顿/崩溃的核心不是“扫描慢”本身，而是架构路径不同：
1. 现状是主进程同步做重活（逐文件探测、缩略图、同步写库），并频繁通过 IPC 传大批对象。  
2. 前端每批数据都触发全量去重、全量排序、全量过滤，扫描结束后还会再全量 `loadMedia()`。  
3. 列表模式是非虚拟化渲染，万级条目时 DOM 和重排压力很高。  

Windows 自带播放器/照片查看器通常是“后台索引 + 延迟元数据 + 虚拟列表 + 系统缓存（缩略图/索引）”，因此前台交互始终轻量。

---

### Implementation Changes
#### 1) 扫描任务模型（后台增量索引，支持暂停/取消）
- 新增 `ScanJobManager`（主进程单例）管理长任务状态：`queued/running/paused/cancelled/completed/failed`。
- 文件夹导入改为异步任务：
  - `start-scan(paths)` 返回 `jobId`（不再返回全量 `MediaFile[]`）。
  - 通过事件流推送 `scan-progress`、`scan-batch`、`scan-state`。
- 新增任务控制 IPC：
  - `pause-scan(jobId)`、`resume-scan(jobId)`、`cancel-scan(jobId)`、`get-scan-status(jobId)`。
- 默认单任务串行执行（避免磁盘/CPU 抢占导致播放器掉帧）。

#### 2) 三阶段处理流水线（快可用优先）
- Stage A: 仅遍历并收集候选文件路径（可分块上报进度）。
- Stage B: 快速入库基础字段（path/filename/type/size/mtime），批量事务写入（例如 200~500 条/事务）。
- Stage C: 元数据与缩略图异步补全（延迟生成）：
  - 仅在后台 worker 池内执行，限制并发（建议 2~4）。
  - 支持优先级：当前正在播放/可见项优先补全。
- 崩溃恢复：任务状态与游标落库，重启后可继续或重建任务。

#### 3) 主进程性能保护
- `addMedia` 改批处理接口（`addMediaBatch` + 事务），避免每条同步写库抖动。
- IPC payload 限流：
  - `scan-batch` 仅传轻量字段（首屏需要字段），缩略图 URL/详细 metadata 由后续补丁事件更新。
- 所有探测超时与错误都降级为“跳过并记录”，不阻塞整任务。
- 扫描与播放器解耦：扫描任务不在主事件循环做 CPU 密集操作，统一下沉 worker。

#### 4) 前端渲染与状态优化
- 移除“扫描完成后再次 `loadMedia()`”这类全量重载；改为纯增量更新。
- Store 改造：
  - 维护 `path -> id` 索引 map，增量去重 O(1)。
  - 批次合并后节流更新（例如 100~250ms flush 一次），避免每 20 条触发全量排序。
  - 排序/过滤改增量或按需计算（优先保证交互流畅）。
- 列表模式改虚拟化（与网格模式一致使用 windowing），彻底避免万级 DOM 渲染卡死。

#### 5) 设置与交互
- 扫描面板增加任务控制按钮：暂停、继续、取消。
- 扫描状态文案明确区分：
  - “已入库数量”
  - “元数据补全进度”
  - “缩略图生成进度”
- 首次大库导入默认提示“可先使用，后台继续完善”。

---

### Public API / Interface Changes
- 新增 IPC：
  - `start-scan(paths: string[]) -> { jobId: string }`
  - `pause-scan(jobId: string) -> { success: boolean }`
  - `resume-scan(jobId: string) -> { success: boolean }`
  - `cancel-scan(jobId: string) -> { success: boolean }`
  - `get-scan-status(jobId: string) -> ScanJobStatus`
- 事件扩展：
  - `scan-progress`（发现/入库进度）
  - `scan-batch`（增量媒体）
  - `scan-state`（paused/resumed/cancelled/completed/failed）
  - `media-enriched`（元数据/缩略图补丁更新）
- 兼容策略：
  - 旧 `add-media-folder/add-media-paths` 先保留，内部转发到 `start-scan`，返回值降级为摘要（新增数量、jobId），避免返回万级对象。

---

### Test Plan
- 功能场景：
  - 1万/5万媒体导入，UI可持续交互（搜索、播放、切换标签页不卡死）。
  - 扫描中播放视频，不卡顿、不崩溃。
  - 暂停/继续/取消任务行为正确，取消后无残留 worker。
- 稳定性场景：
  - 导入中关闭应用并重启，任务状态可恢复或安全终止。
  - 部分文件损坏/权限不足/ffprobe 超时，任务继续执行。
- 性能验收：
  - 扫描期间 renderer 主线程长任务显著下降（无持续 >100ms 卡顿）。
  - 主进程 CPU 峰值与内存占用可控（无持续线性失控增长）。
- 回归：
  - 小库（<1000）导入体验不退化；拖拽导入、播放列表、标签编辑保持可用。

---

### Assumptions & Defaults
- 采用你已确认的策略：
  - 扫描模式：后台增量索引。
  - 元数据策略：延迟生成。
  - 任务控制：支持暂停/继续/取消。
- 继续使用现有 SQLite（`better-sqlite3`）与 Electron 架构，不引入外部索引服务。
- 默认并发保守配置（worker 2~4），优先稳定性，再做参数化调优。
