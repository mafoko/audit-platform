"use client";
import { useRef, useState } from "react";
import { Upload, File, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Props {
  requestId: number;
  onUploaded?: () => void;
}

export function EvidenceUpload({ requestId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post(`/evidence-requests/${requestId}/files`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploaded(prev => [...prev, file.name]);
      onUploaded?.();
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    Array.from(e.dataTransfer.files).forEach(upload);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach(upload);
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
        )}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">
          {uploading ? "Uploading…" : "Drop files here or click to upload"}
        </p>
        <p className="text-xs text-slate-500 mt-1">PDF, Word, Excel, images supported</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} />
      </div>
      {uploaded.length > 0 && (
        <ul className="space-y-1.5">
          {uploaded.map(name => (
            <li key={name} className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
