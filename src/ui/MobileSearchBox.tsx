import { FormEvent } from "react";
import { CloseCircleFill } from "antd-mobile-icons";

type MobileSearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (word: string) => void;
};

export function MobileSearchBox({ value, onChange, onSubmit }: MobileSearchBoxProps) {
  function commit(next: string) {
    const normalized = next.trim();
    if (!normalized) {
      return;
    }
    onSubmit(normalized);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    commit(value);
  }

  return (
    <form className="mobile-search-box" onSubmit={handleSubmit}>
      <label className="mobile-search-box__frame">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="请输入需要查找的内容"
          enterKeyHint="search"
          type="text"
        />
        {value ? (
          <button
            aria-label="清空搜索内容"
            className="mobile-search-box__clear"
            onClick={() => onChange("")}
            type="button"
          >
            <CloseCircleFill />
          </button>
        ) : null}
      </label>
    </form>
  );
}
