"use client";

import { useCallback, useState } from "react";

type Props = {
  onUpload: (file: File) => void;
  isLoading?: boolean;
};

export function UploadZone({ onUpload, isLoading }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((file: File) => {
    setError(null);
    const name = file.name.toLowerCase();
    const ok =
      file.type === "application/pdf" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".pdf") ||
      name.endsWith(".docx");
    if (!ok) {
      setError("Please upload a PDF or DOCX file.");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB.");
      return false;
    }
    return true;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file && validate(file)) onUpload(file);
    },
    [onUpload, validate]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validate(file)) onUpload(file);
      e.target.value = "";
    },
    [onUpload, validate]
  );

  return (
    <div className="w-full">
      <label
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`
          flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer card
          min-h-[100px] py-5 px-4 sm:py-6 sm:px-6
          ${dragActive ? "border-white/40 bg-white/5" : "border-white/10 hover:border-white/20 hover:bg-white/[0.03]"}
          ${isLoading ? "pointer-events-none opacity-80" : ""}
        `}
      >
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleChange}
          className="hidden"
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <div className="w-9 h-9 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs sm:text-sm text-[var(--text-muted)]">Analyzing your resume…</span>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 shrink-0">
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-[var(--text)] font-semibold text-sm sm:text-base mb-0.5 text-center leading-snug">
              Drop your resume here
            </p>
            <p className="text-xs text-[var(--text-muted)] text-center">or click to browse</p>
            <span className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-1.5">PDF or DOCX · Max 5MB</span>
          </>
        )}
      </label>
      {error && (
        <p className="mt-4 text-sm text-[var(--error)] text-center">{error}</p>
      )}
    </div>
  );
}
