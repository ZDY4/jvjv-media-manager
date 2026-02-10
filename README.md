# 媒体管理器 (Media Manager)

一个基于 Electron + React 的 Windows 媒体播放器和管理器。

## 功能特性

- 📁 **媒体库管理**：扫描文件夹，自动识别视频和图片
- 🏷️ **Tag 系统**：为视频/图片添加任意数量的标签
- 🔍 **标签搜索**：通过标签快速筛选媒体文件
- ▶️ **播放器**：支持主流视频格式和图片查看
- ✂️ **视频剪辑**：
  - 保留模式：提取指定时间段的视频
  - 删除模式：删除指定时间段的视频
- 🗑️ **删除功能**：右键菜单删除媒体文件

## 技术栈

- **框架**：Electron 28
- **前端**：React 18 + TypeScript + Tailwind CSS
- **构建**：Vite 5
- **数据库**：SQLite (better-sqlite3)
- **视频处理**：FFmpeg

## 安装依赖

```bash
npm install
```

## 开发运行

```bash
npm run dev
```

## 构建应用

```bash
npm run build
```

## 项目结构

```
media-manager/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── db/         # 数据库管理
│   │   └── utils/      # 工具类
│   ├── renderer/       # React 渲染进程
│   │   └── components/ # UI 组件
│   └── shared/         # 共享类型
├── package.json
└── vite.config.ts
```

## 使用说明

1. 点击左侧"扫描文件夹"按钮导入媒体
2. 点击媒体缩略图播放视频或查看图片
3. 在播放器界面为媒体添加标签
4. 使用左侧搜索栏按标签筛选
5. 右键点击媒体项可删除
6. 视频播放器中点击"剪辑视频"进行裁剪

## License

MIT
