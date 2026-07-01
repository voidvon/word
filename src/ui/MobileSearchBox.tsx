import { FormEvent, useState } from "react";
import { SearchBar } from "antd-mobile";

type MobileSearchBoxProps = {
  defaultValue?: string;
  onSubmit: (word: string) => void;
};

export function MobileSearchBox({ defaultValue = "", onSubmit }: MobileSearchBoxProps) {
  const [value, setValue] = useState(defaultValue);

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
      <div className="mobile-search-box__menu" aria-hidden="true">
        ≡
      </div>
      <SearchBar
        value={value}
        onChange={setValue}
        placeholder="查询单词或句子"
        showCancelButton={false}
        onSearch={commit}
      />
    </form>
  );
}
