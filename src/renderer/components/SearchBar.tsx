import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Field, Text, makeStyles, tokens } from '@fluentui/react-components';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  inputRef?: (el: HTMLInputElement | null | undefined) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagsChange,
  inputRef,
}) => {
  const styles = useStyles();
  const [inputValue, setInputValue] = useState(searchQuery);
  const inputElementRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (inputRef) {
      inputRef(inputElementRef.current);
    }
  }, [inputRef]);

  // 防抖搜索
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onSearchChange(value);
      }, 300);
    },
    [onSearchChange]
  );

  const handleInputChange = (value: string) => {
    setInputValue(value);
    debouncedSearch(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      // 检查是否以 # 开头，如果是则添加为标签
      const trimmedValue = inputValue.trim();
      if (trimmedValue.startsWith('#')) {
        const tagName = trimmedValue.slice(1);
        if (tagName && !selectedTags.includes(tagName)) {
          onTagsChange([...selectedTags, tagName]);
          // 清除输入框
          setInputValue('');
          onSearchChange('');
        }
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  const clearSearch = () => {
    setInputValue('');
    onSearchChange('');
    inputElementRef.current?.focus();
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  return (
    <div className={styles.root}>
      <Field label="搜索" size="small" className={styles.field}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputElementRef}
            type="text"
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索文件名或输入 #标签名 添加标签..."
            className={styles.input}
          />
          {inputValue && (
            <Button
              appearance="subtle"
              size="small"
              onClick={clearSearch}
              className={styles.clearButton}
              aria-label="清空搜索"
            >
              清除
            </Button>
          )}
        </div>
      </Field>
      <Text size={200} className={styles.hint}>
        提示：输入 #标签名 后按回车可添加标签筛选
      </Text>

      {/* 已选标签 */}
      {selectedTags.length > 0 && (
        <div className={styles.tagsSection}>
          <div className={styles.tagsHeader}>
            <Text size={200}>已选标签</Text>
            <Button
              appearance="subtle"
              size="small"
              onClick={clearAllTags}
            >
              清除全部
            </Button>
          </div>
          <div className={styles.tagsWrap}>
            {selectedTags.map(tag => (
              <Button
                key={tag}
                appearance="secondary"
                size="small"
                className={styles.tag}
                onClick={() => handleRemoveTag(tag)}
              >
                #{tag} ×
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

SearchBar.displayName = 'SearchBar';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  field: {
    marginBottom: 0,
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: colorMix(tokens.colorNeutralBackground3, 0.78),
    color: tokens.colorNeutralForeground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    outline: 'none',
    padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalM}`,
    paddingRight: '64px',
    fontSize: tokens.fontSizeBase300,
    transitionDuration: '120ms',
    transitionProperty: 'border-color, background-color',
  },
  clearButton: {
    position: 'absolute',
    right: tokens.spacingHorizontalXXS,
    minWidth: 'unset',
  },
  hint: {
    color: tokens.colorNeutralForeground3,
  },
  tagsSection: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  tagsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: tokens.colorNeutralForeground3,
  },
  tagsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXXS,
  },
  tag: {
    color: tokens.colorBrandForeground1,
    borderTopColor: colorMix(tokens.colorBrandStroke1, 0.58),
    borderRightColor: colorMix(tokens.colorBrandStroke1, 0.58),
    borderBottomColor: colorMix(tokens.colorBrandStroke1, 0.58),
    borderLeftColor: colorMix(tokens.colorBrandStroke1, 0.58),
    backgroundColor: colorMix(tokens.colorBrandBackground2, 0.38),
  },
});

function colorMix(color: string, alpha: number): string {
  const percent = Math.max(0, Math.min(1, alpha)) * 100;
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
