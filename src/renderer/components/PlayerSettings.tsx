import { useState, useEffect } from 'react';

interface PlayerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlayerConfig;
  onSettingsChange: (settings: PlayerConfig) => void;
}

export interface PlayerConfig {
  immersiveMode: boolean;
}

const defaultConfig: PlayerConfig = {
  immersiveMode: false,
};

export function PlayerSettings({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: PlayerSettingsProps) {
  const [localSettings, setLocalSettings] = useState<PlayerConfig>(settings);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  const handleToggle = (key: keyof PlayerConfig) => {
    const newSettings = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#2D2D2D] rounded-2xl w-[480px] p-6 shadow-2xl border border-[#3D3D3D]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#e0e0e0] text-xl font-semibold flex items-center gap-2">
            <span>⚙️</span> 播放器设置
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#e0e0e0] text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* 沉浸模式开关 */}
          <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-white/5 transition-colors">
            <div>
              <div className="text-[#e0e0e0] text-sm font-medium">全屏沉浸模式</div>
              <div className="text-gray-400 text-xs mt-0.5">双击播放器进入全屏，隐藏所有UI元素</div>
            </div>
            <button
              onClick={() => handleToggle('immersiveMode')}
              className={`w-12 h-6 rounded-full transition-all duration-200 relative ${
                localSettings.immersiveMode ? 'bg-[#005FB8]' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-[#e0e0e0] absolute top-0.5 transition-all duration-200 ${
                  localSettings.immersiveMode ? 'left-6.5' : 'left-0.5'
                }`}
                style={{ left: localSettings.immersiveMode ? '26px' : '2px' }}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#3D3D3D]">
          <div className="text-gray-400 text-xs">
            <div className="mb-2">💡 快捷键提示：</div>
            <div className="space-y-1 text-gray-500">
              <div>• 双击播放器：进入/退出全屏</div>
              <div>• 鼠标滚轮：放大/缩小画面</div>
              <div>• ESC：退出全屏</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-[#005FB8] hover:bg-[#0066CC] text-[#e0e0e0] px-6 py-2.5 rounded-lg font-medium transition-all duration-200"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

export { defaultConfig };
