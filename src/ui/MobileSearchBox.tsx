import { CompositionEvent, FormEvent, useEffect, useState } from "react";
import { CloseCircleFill } from "antd-mobile-icons";

type MobileSearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (word: string) => void;
};

export function MobileSearchBox({ value, onChange, onSubmit }: MobileSearchBoxProps) {
  const [draftValue, setDraftValue] = useState(value);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isComposing) {
      setDraftValue(value);
    }
  }, [isComposing, value]);

  function commit(next: string) {
    const normalized = next.trim();
    if (!normalized) {
      return;
    }
    onSubmit(normalized);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onChange(draftValue);
    commit(draftValue);
  }

  function handleCompositionStart() {
    setIsComposing(true);
  }

  function handleCompositionEnd(event: CompositionEvent<HTMLInputElement>) {
    const nextValue = event.currentTarget.value;
    setIsComposing(false);
    setDraftValue(nextValue);
    onChange(nextValue);
  }

  return (
    <form className="mobile-search-box" onSubmit={handleSubmit}>
      <label className="mobile-search-box__frame">
        <input
          value={draftValue}
          onChange={(event) => {
            const nextValue = event.target.value;
            setDraftValue(nextValue);
            if (!isComposing) {
              onChange(nextValue);
            }
          }}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder="请输入需要查找的内容"
          enterKeyHint="search"
          type="text"
        />
        {draftValue ? (
          <button
            aria-label="清空搜索内容"
            className="mobile-search-box__clear"
            onClick={() => {
              setDraftValue("");
              onChange("");
            }}
            type="button"
          >
            <CloseCircleFill />
          </button>
        ) : null}
      </label>
    </form>
  );
}
