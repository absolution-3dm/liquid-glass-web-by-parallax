"use client";

import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  FileCodeIcon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { highlightCode } from "./highlight-code";
import { useClipboard } from "./use-clipboard";

export function CodeBlock({
  label,
  code,
  language = "tsx",
  headerControl,
}: {
  label: string;
  code: string;
  language?: "bash" | "tsx";
  headerControl?: ReactNode;
}) {
  const { copied, copy } = useClipboard(code);

  return (
    <div className="code-block">
      <div className="code-block__header">
        <div className="code-block__meta">
          <span className="code-block__label">{label}</span>
          {headerControl}
          <span className="code-block__language">{language}</span>
        </div>
        <button
          type="button"
          className={`code-block__copy${copied ? " is-copied" : ""}`}
          onClick={() => void copy()}
          aria-label={copied ? "Copied" : `Copy ${label}`}
        >
          <HugeiconsIcon
            icon={copied ? Tick01Icon : Copy01Icon}
            size={14}
            color="currentColor"
            strokeWidth={1.75}
            aria-hidden
          />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre>
        <code
          dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
        />
      </pre>
    </div>
  );
}

export function RegistryAttachment({
  title,
  description,
  file,
  command,
}: {
  title: string;
  description: string;
  file: string;
  command: string;
}) {
  const { copied, copy } = useClipboard(command);

  return (
    <div className="attachment">
      <div className="attachment__media" aria-hidden>
        <HugeiconsIcon
          icon={FileCodeIcon}
          size={18}
          color="currentColor"
          strokeWidth={1.6}
          aria-hidden
        />
      </div>
      <div className="attachment__content">
        <div className="attachment__title">{title}</div>
        <div className="attachment__description">
          {file} · {description}
        </div>
      </div>
      <div className="attachment__actions">
        <button
          type="button"
          className={`attachment__action${copied ? " is-copied" : ""}`}
          onClick={() => void copy()}
          aria-label={copied ? `Copied ${title}` : `Copy install command for ${title}`}
        >
          <HugeiconsIcon
            icon={copied ? Tick01Icon : Copy01Icon}
            size={14}
            color="currentColor"
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}
