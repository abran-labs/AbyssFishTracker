"use client";

import * as React from "react";
import { extractFishData, type OcrResult } from "@/lib/ocr";
import { IconPhoto, IconLoader2, IconInfoCircle } from "@tabler/icons-react";
import Image from "next/image";

interface ImagePasteZoneProps {
    onResult: (result: OcrResult) => void;
}

type Status = "idle" | "processing" | "done" | "error";

export function ImagePasteZone({ onResult }: ImagePasteZoneProps) {
    const [status, setStatus] = React.useState<Status>("idle");
    const [errorMsg, setErrorMsg] = React.useState("");
    const [dragOver, setDragOver] = React.useState(false);
    const [zoomed, setZoomed] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const processImage = React.useCallback(
        async (source: File | Blob) => {
            setStatus("processing");
            setErrorMsg("");

            if (previewUrl) URL.revokeObjectURL(previewUrl);
            const newUrl = URL.createObjectURL(source);
            setPreviewUrl(newUrl);

            try {
                const result = await extractFishData(source);
                setStatus("done");
                onResult(result);
                // Intentionally leaving it in "done" state so they can verify the image
            } catch (err) {
                console.error("OCR failed:", err);
                const isNonsense = err instanceof Error && err.message.includes("Invalid");
                setErrorMsg(isNonsense ? "Invalid screenshot: No fish data found." : "Failed to read image. Try pasting again.");
                setStatus("error");
                setTimeout(() => setStatus("idle"), 3000);
            }
        },
        [onResult, previewUrl]
    );

    // Global paste listener
    React.useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith("image/")) {
                    e.preventDefault();
                    const blob = item.getAsFile();
                    if (blob) processImage(blob);
                    return;
                }
            }
        };
        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [processImage]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith("image/")) {
            processImage(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processImage(file);
        // Reset so same file can be selected again
        e.target.value = "";
    };

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => status !== "processing" && fileInputRef.current?.click()}
            className={`
        relative rounded-md border border-dashed p-4 text-center transition-all cursor-pointer
        ${dragOver
                    ? "border-primary bg-primary/10"
                    : status === "error"
                        ? "border-destructive/50 bg-destructive/5"
                        : status === "done"
                            ? "border-green-500/50 bg-green-500/5"
                            : "border-border/60 hover:border-border hover:bg-secondary/30"
                }
      `}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {status === "processing" ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    <span>Scanning image…</span>
                </div>
            ) : status === "done" ? (
                <>
                    <div className="flex flex-col items-center justify-center gap-2 py-2">
                        <button
                            type="button"
                            className="flex flex-col items-center opacity-90 hover:opacity-100 transition-opacity cursor-zoom-in"
                            title="Click to view full size"
                            onClick={(e) => {
                                e.stopPropagation();
                                setZoomed(true);
                            }}
                        >
                            <div className="relative w-48 h-32 rounded overflow-hidden shadow-sm border border-border/50">
                                {previewUrl && (
                                    <Image
                                        src={previewUrl}
                                        alt="Uploaded screenshot"
                                        fill
                                        className="object-contain"
                                    />
                                )}
                            </div>
                        </button>

                        <div className="flex flex-col items-center mt-2 text-center pointer-events-none">
                            <span className="text-sm text-green-400 font-medium">✓ Auto-filled from image</span>
                            <span className="text-[11px] text-muted-foreground mt-1 max-w-[220px]">
                                OCR may contain errors.<br />Please verify the copied values.
                            </span>
                        </div>
                    </div>

                    {zoomed && previewUrl && (
                        <div
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
                            onClick={(e) => {
                                e.stopPropagation();
                                setZoomed(false);
                            }}
                        >
                            <div className="relative w-full max-w-2xl aspect-video rounded-md overflow-hidden bg-black/50 border border-border shadow-2xl">
                                <Image
                                    src={previewUrl}
                                    alt="Uploaded screenshot (Expanded)"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="absolute top-4 right-4 text-white/50 bg-black/50 px-3 py-1.5 rounded text-sm pointer-events-none">
                                Click anywhere to close
                            </div>
                        </div>
                    )}
                </>
            ) : status === "error" ? (
                <div className="flex items-center justify-center gap-2 text-sm text-destructive py-4">
                    <span>{errorMsg}</span>
                </div>
            ) : (
                <>
                    <div className="flex flex-col items-center justify-center gap-4 py-2">
                        <button
                            type="button"
                            className="flex flex-col items-center opacity-80 hover:opacity-100 transition-opacity cursor-zoom-in"
                            title="Click to view full size example"
                            onClick={(e) => {
                                e.stopPropagation();
                                setZoomed(true);
                            }}
                        >
                            <div className="relative w-48 h-32 rounded overflow-hidden shadow-sm border border-border/50">
                                <Image
                                    src="/ocr-example.png"
                                    alt="Example fish info panel"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </button>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <IconPhoto className="h-4 w-4" />
                            <span>
                                Paste screenshot, drag image, or <span className="underline">browse</span>
                            </span>
                        </div>
                    </div>

                    {zoomed && (
                        <div
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
                            onClick={(e) => {
                                e.stopPropagation();
                                setZoomed(false);
                            }}
                        >
                            <div className="relative w-full max-w-2xl aspect-video rounded-md overflow-hidden bg-black/50 border border-border shadow-2xl">
                                <Image
                                    src="/ocr-example.png"
                                    alt="Example fish info panel (Expanded)"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="absolute top-4 right-4 text-white/50 bg-black/50 px-3 py-1.5 rounded text-sm pointer-events-none">
                                Click anywhere to close
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
