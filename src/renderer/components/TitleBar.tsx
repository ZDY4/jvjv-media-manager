import React from 'react';
import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useAppStore } from '../store/useAppStore';
import { useMediaActions } from '../hooks/useMediaActions';

const useStyles = makeStyles({
  root: {
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colorMix(tokens.colorNeutralBackground2, 0.86),
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backdropFilter: 'blur(12px)',
    position: 'relative',
    zIndex: 50,
    userSelect: 'none',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
    paddingLeft: tokens.spacingHorizontalS,
  },
  appName: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    marginRight: tokens.spacingHorizontalS,
  },
  iconButton: {
    minWidth: '36px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
  },
  windowControl: {
    height: '100%',
    minWidth: '40px',
    borderRadius: 0,
  },
  closeControl: {
    ':hover': {
      backgroundColor: tokens.colorPaletteRedBackground3,
      color: tokens.colorNeutralForegroundOnBrand,
    },
  },
});

function colorMix(color: string, alpha: number): string {
  const percent = Math.max(0, Math.min(1, alpha)) * 100;
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

const MenuIcon: React.FC = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={16} height={16}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const SettingsIcon: React.FC = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={16} height={16}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.6}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MinimizeIcon: React.FC = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={16} height={16}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const MaximizeIcon: React.FC = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={16} height={16}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
    />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={16} height={16}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const TitleBar: React.FC = () => {
  const styles = useStyles();

  const { setShowSettings } = useAppStore();
  const { handleAddFiles, handleAddFolder } = useMediaActions();

  return (
    <div className={styles.root} style={{ WebkitAppRegion: 'drag' }}>
      <div className={styles.left} style={{ WebkitAppRegion: 'no-drag' }}>
        <span className={styles.appName}>媒体管理器</span>

        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="subtle"
              size="small"
              icon={<MenuIcon />}
              className={styles.iconButton}
              title="文件"
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem onClick={handleAddFiles}>添加文件... Ctrl+O</MenuItem>
              <MenuItem onClick={handleAddFolder}>添加文件夹... Ctrl+Shift+O</MenuItem>
              <MenuItem
                onClick={() => {
                  if (window.electronAPI) {
                    window.close();
                  }
                }}
              >
                退出 Ctrl+Q
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        <Button
          appearance="subtle"
          size="small"
          icon={<SettingsIcon />}
          className={styles.iconButton}
          onClick={() => setShowSettings(true)}
          title="设置 (Ctrl+,)"
        />
      </div>

      <div className={styles.controls} style={{ WebkitAppRegion: 'no-drag' }}>
        <Button
          appearance="subtle"
          icon={<MinimizeIcon />}
          className={styles.windowControl}
          onClick={() => window.electronAPI?.minimizeWindow?.()}
          title="最小化"
        />
        <Button
          appearance="subtle"
          icon={<MaximizeIcon />}
          className={styles.windowControl}
          onClick={() => window.electronAPI?.maximizeWindow?.()}
          title="最大化"
        />
        <Button
          appearance="subtle"
          icon={<CloseIcon />}
          className={`${styles.windowControl} ${styles.closeControl}`}
          onClick={() => window.electronAPI?.closeWindow?.()}
          title="关闭"
        />
      </div>
    </div>
  );
};
