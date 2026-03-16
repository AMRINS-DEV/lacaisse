"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmbedPdfPreview } from "@/components/pdf/EmbedPdfPreview";
import { cn } from "@/lib/utils";
import { Eye, FileText, ImageIcon, Loader2, Paperclip, UploadCloud, X } from "lucide-react";

type UploadedAttachment = {
  id: number;
  originalName: string;
  mimeType: string;
  path: string;
  sizeBytes: number;
};

interface Props {
  inputName?: string;
  label?: string;
  initialAttachmentId?: number | null;
  initialAttachmentName?: string | null;
  initialAttachmentPath?: string | null;
  initialAttachmentMimeType?: string | null;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(mimeType: string, name: string) {
  return mimeType === "application/pdf" || /\.pdf$/i.test(name);
}

function isImage(mimeType: string, name: string) {
  return mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
}

export function AttachmentUploadField({
  inputName = "attachment_id",
  label = "Fichier (optionnel)",
  initialAttachmentId = null,
  initialAttachmentName = null,
  initialAttachmentPath = null,
  initialAttachmentMimeType = null,
}: Props) {
  const fileInputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [attachment, setAttachment] = useState<UploadedAttachment | null>(
    initialAttachmentId && initialAttachmentName && initialAttachmentPath
      ? {
          id: initialAttachmentId,
          originalName: initialAttachmentName,
          mimeType: initialAttachmentMimeType ?? "",
          path: initialAttachmentPath,
          sizeBytes: 0,
        }
      : null
  );

  const resetSelection = useCallback(() => {
    setAttachment(null);
    setProgress(0);
    setError(null);
    setPreviewOpen(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;

    const handleFormReset = () => {
      resetSelection();
    };

    form.addEventListener("reset", handleFormReset);
    return () => {
      form.removeEventListener("reset", handleFormReset);
    };
  }, [resetSelection]);

  async function uploadFile(file: File) {
    setError(null);
    setProgress(0);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await new Promise<UploadedAttachment>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/uploads/recettes");

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const nextProgress = Math.round((event.loaded / event.total) * 100);
          setProgress(nextProgress);
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText) as UploadedAttachment;
              resolve(data);
            } catch {
              reject(new Error("Reponse invalide du serveur."));
            }
            return;
          }
          try {
            const payload = JSON.parse(xhr.responseText) as { error?: string };
            reject(new Error(payload.error || "Echec de l'upload."));
          } catch {
            reject(new Error("Echec de l'upload."));
          }
        };

        xhr.onerror = () => reject(new Error("Impossible d'uploader le fichier."));
        xhr.send(formData);
      });

      setAttachment(response);
      setProgress(100);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Echec de l'upload.";
      setError(message);
      setAttachment(null);
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  }

  const currentName = attachment?.originalName ?? "";
  const currentMime = attachment?.mimeType ?? "";
  const previewUrl = attachment?.id ? `/api/uploads/recettes/${attachment.id}/preview` : attachment?.path ?? "";
  const pdf = isPdf(currentMime, currentName);
  const image = isImage(currentMime, currentName);

  return (
    <div className="space-y-2">
      <input type="hidden" name={inputName} value={attachment?.id ? String(attachment.id) : ""} />

      <label htmlFor={fileInputId} className="text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="rounded-xl border border-dashed border-slate-300/80 bg-slate-50/70 p-3 dark:border-white/15 dark:bg-slate-800/40">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {attachment ? "Remplacer" : "Choisir un fichier"}
          </Button>

          {attachment ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-slate-500 hover:text-rose-600"
              onClick={resetSelection}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          id={fileInputId}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void uploadFile(file);
          }}
        />

        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Un seul fichier: PDF ou image (max 10 MB). Upload automatique avant envoi du formulaire.
          </p>

          {isUploading ? (
            <div className="space-y-1.5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                <div
                  className="h-full bg-[var(--logo-primary)] transition-all duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload en cours... {progress}%
              </p>
            </div>
          ) : null}

          {attachment ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-2 text-left transition hover:border-[var(--logo-primary)]/40 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-[var(--logo-secondary)]/40"
            >
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border",
                  pdf
                    ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                    : image
                      ? "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
                      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300"
                )}
              >
                {pdf ? <FileText className="h-3.5 w-3.5" /> : image ? <ImageIcon className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{attachment.originalName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {attachment.sizeBytes > 0 ? formatSize(attachment.sizeBytes) : "Fichier existant"} • Upload termine
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-white/80 px-2 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300">
                <Eye className="h-3.5 w-3.5" />
                Apercu
              </span>
            </button>
          ) : null}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pdf ? <FileText className="h-4 w-4 text-rose-500" /> : image ? <ImageIcon className="h-4 w-4 text-sky-500" /> : <Paperclip className="h-4 w-4" />}
              <span className="truncate">{attachment?.originalName ?? "Fichier"}</span>
            </DialogTitle>
          </DialogHeader>

          {attachment?.path ? (
            pdf ? (
              <EmbedPdfPreview src={previewUrl} className="h-[68vh]" />
            ) : image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={attachment.originalName}
                className="max-h-[68vh] w-full rounded-lg border border-slate-200/80 object-contain dark:border-white/10"
              />
            ) : (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-200"
              >
                <FileText className="h-4 w-4" />
                Ouvrir le fichier
              </a>
            )
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucun fichier a afficher.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
