"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { PluginRegistry } from "@embedpdf/react-pdf-viewer";

const PDFViewer = dynamic(
  () => import("@embedpdf/react-pdf-viewer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Chargement du PDF...
      </div>
    ),
  }
);

type EmbedPdfPreviewProps = {
  src: string;
  className?: string;
};

export function EmbedPdfPreview({ src, className }: EmbedPdfPreviewProps) {
  const registryRef = useRef<PluginRegistry | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [openError, setOpenError] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const viewerConfig = useMemo(
    () => ({
      tabBar: "never" as const,
    }),
    []
  );

  const loadPdfBytes = useCallback(async (source: string, signal: AbortSignal) => {
    setIsFetching(true);
    setFetchError("");
    setOpenError("");
    setPdfBuffer(null);

    try {
      const response = await fetch(source, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const looksLikePdf =
        bytes.length >= 4 &&
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46; // %PDF

      if (!looksLikePdf) {
        throw new Error("La reponse n'est pas un PDF valide.");
      }

      setPdfBuffer(buffer);
    } catch (error) {
      if (signal.aborted) return;
      setFetchError(error instanceof Error ? error.message : "Impossible de charger le PDF.");
    } finally {
      if (!signal.aborted) {
        setIsFetching(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!src) return;
    const controller = new AbortController();
    void loadPdfBytes(src, controller.signal);
    return () => controller.abort();
  }, [src, loadPdfBytes]);

  const openBufferInViewer = useCallback(async (buffer: ArrayBuffer, source: string) => {
    const registry = registryRef.current;
    if (!registry) return;

    const provider = registry.getCapabilityProvider("document-manager");
    const capability = provider?.provides?.() as
      | {
          closeAllDocuments?: () => { toPromise: () => Promise<unknown> };
          openDocumentBuffer?: (options: {
            buffer: ArrayBuffer;
            name: string;
            autoActivate?: boolean;
          }) => { toPromise: () => Promise<unknown> };
        }
      | null
      | undefined;

    if (!capability?.openDocumentBuffer) {
      setOpenError("Capacite document-manager indisponible.");
      return;
    }

    setIsOpening(true);
    setOpenError("");

    try {
      if (capability.closeAllDocuments) {
        await capability.closeAllDocuments().toPromise();
      }
      const fileName = getFileNameFromSrc(source);
      await capability
        .openDocumentBuffer({
          buffer: buffer.slice(0),
          name: fileName,
          autoActivate: true,
        })
        .toPromise();
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : "Impossible d'ouvrir le PDF.");
    } finally {
      setIsOpening(false);
    }
  }, []);

  useEffect(() => {
    if (!pdfBuffer || !registryRef.current) return;
    void openBufferInViewer(pdfBuffer, src);
  }, [pdfBuffer, src, openBufferInViewer]);

  if (!src) {
    return (
      <div className={cn("flex h-[70vh] w-full flex-col items-center justify-center gap-3 rounded-lg border border-slate-200/80 p-4 text-center dark:border-white/10", className)}>
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">URL du PDF manquante.</p>
      </div>
    );
  }

  if (fetchError || openError) {
    const errorMessage = fetchError || openError;
    return (
      <div className={cn("flex h-[70vh] w-full flex-col gap-3 rounded-lg border border-slate-200/80 p-3 dark:border-white/10", className)}>
        <p className="text-center text-sm font-medium text-rose-600 dark:text-rose-400">
          Erreur EmbedPDF: {errorMessage}. Fallback navigateur active.
        </p>
        <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-slate-200/80 dark:border-white/10">
          <iframe title="PDF fallback preview" src={src} className="h-full w-full" />
        </div>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="mx-auto rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-slate-800/60"
        >
          Ouvrir le PDF directement
        </a>
      </div>
    );
  }

  return (
    <div className={cn("relative h-[70vh] w-full overflow-hidden rounded-lg border border-slate-200/80 dark:border-white/10", className)}>
      <PDFViewer
        key={src}
        config={viewerConfig}
        onReady={(registry) => {
          registryRef.current = registry;
          if (pdfBuffer) {
            void openBufferInViewer(pdfBuffer, src);
          }
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
      {(isFetching || isOpening) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 text-sm text-slate-700 backdrop-blur-[1px] dark:bg-slate-950/45 dark:text-slate-200">
          Chargement du PDF...
        </div>
      )}
    </div>
  );
}

function getFileNameFromSrc(source: string) {
  const raw = source.split("?")[0].split("/").pop() || "document";
  const decoded = decodeURIComponent(raw);
  if (/\.[a-z0-9]{2,8}$/i.test(decoded)) return decoded;
  return `${decoded}.pdf`;
}
