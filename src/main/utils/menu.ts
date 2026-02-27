import { Menu, app, BrowserWindow, dialog } from 'electron';

export function createApplicationMenu(window: BrowserWindow) {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '添加文件...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            window.webContents.send('menu-add-files');
          },
        },
        {
          label: '添加文件夹...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            window.webContents.send('menu-add-folder');
          },
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: '视图',
      submenu: [
        {
          label: '设置',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            window.webContents.send('menu-settings');
          },
        },
        { type: 'separator' },
        {
          label: '重新加载',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            window.reload();
          },
        },
        {
          label: '切换开发者工具',
          accelerator: 'F12',
          click: () => {
            window.webContents.toggleDevTools();
          },
        },
      ],
    },
    {
      label: '窗口',
      submenu: [
        {
          label: '最小化',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            window.minimize();
          },
        },
        {
          label: '关闭',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            window.close();
          },
        },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(window, {
              type: 'info',
              title: '关于媒体管理器',
              message: '媒体管理器',
              detail: '一个简单易用的本地媒体管理工具',
              buttons: ['确定'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
