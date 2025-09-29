"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

interface FileWithPreview extends File {
  id: string;
  preview: string;
}

interface ConvertedFile {
  name: string;
  data: string;
  originalSize: number;
  compressedSize: number;
  reduction: number;
}

export default function Home() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [quality, setQuality] = useState(70);
  const [zipData, setZipData] = useState<string>("");
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter(
      (file) =>
        file.type.startsWith("image/") &&
        (file.type === "image/png" ||
          file.type === "image/jpeg" ||
          file.type === "image/webp")
    );

    const filesWithPreview = imageFiles.map((file) => {
      const fileWithPreview = Object.assign(file, {
        id: Math.random().toString(36).substr(2, 9),
        preview: URL.createObjectURL(file),
      });
      return fileWithPreview;
    });

    setFiles((prev) => [...prev, ...filesWithPreview]);

    // Auto-convert files after adding them
    if (filesWithPreview.length > 0) {
      setTimeout(() => {
        convertImages([...files, ...filesWithPreview]);
      }, 100);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const removeConvertedFile = (index: number) => {
    setConvertedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const convertImages = async (filesToConvert: FileWithPreview[] = files) => {
    if (filesToConvert.length === 0) return;

    setIsConverting(true);
    setConvertedFiles([]);

    try {
      const formData = new FormData();
      filesToConvert.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("quality", quality.toString());

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Conversion failed");
      }

      const result = await response.json();

      // Store zip data
      setZipData(result.zipData);

      // Calculate compression stats for each file
      const filesWithStats = result.files.map((file: any, index: number) => {
        const originalFile = filesToConvert[index];
        const originalSize = originalFile.size;
        const compressedSize = Math.round((file.data.length * 3) / 4); // Approximate base64 to bytes
        const reduction = Math.round(
          ((originalSize - compressedSize) / originalSize) * 100
        );

        return {
          ...file,
          originalSize,
          compressedSize,
          reduction: Math.max(0, reduction),
        };
      });

      setConvertedFiles(filesWithStats);
    } catch (error) {
      console.error("Conversion error:", error);
      alert("Failed to convert images. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const downloadFile = (file: ConvertedFile) => {
    const link = document.createElement("a");
    link.href = `data:image/webp;base64,${file.data}`;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = async () => {
    if (convertedFiles.length === 0) return;

    setIsGeneratingZip(true);
    try {
      // Create a new ZIP with current files
      const formData = new FormData();
      convertedFiles.forEach((file) => {
        // Convert base64 back to blob for API
        const byteCharacters = atob(file.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/webp" });
        formData.append("files", blob, file.name);
      });
      formData.append("quality", quality.toString());

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const link = document.createElement("a");
        link.href = `data:application/zip;base64,${result.zipData}`;
        link.download = "converted-images.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error creating ZIP:", error);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Bulk Image Converter
          </h1>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors mb-6 ${
            files.length > 0
              ? "border-green-400 bg-green-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {files.length === 0 ? (
            <div>
              <div className="text-6xl mb-4">☁️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Upload images or drag and drop
              </h3>
              <p className="text-gray-500 mb-4">
                Unlimited images, no size limits - JPEG, PNG, WEBP
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div>
              <div className="text-2xl mb-4 text-black">
                ✅ {files.length} files selected
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Add more files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Compression Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Quality: {quality}%
              </span>
              <span className="text-xs text-gray-500">
                {quality >= 90
                  ? "Highest Quality"
                  : quality >= 70
                  ? "High Quality"
                  : quality >= 50
                  ? "Medium Quality"
                  : "Lower Quality"}
              </span>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #22c55e 75%, #3b82f6 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Smaller file size</span>
                <span>Better quality</span>
              </div>
            </div>
          </div>
        </div>

        {/* Converted Files Display */}
        {convertedFiles.length > 0 && (
          <div className="space-y-4 mb-6">
            {convertedFiles.map((file, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={`data:image/webp;base64,${file.data}`}
                      alt={file.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">
                        {formatFileSize(file.originalSize)}
                      </span>
                      <span className="text-sm text-gray-500">→</span>
                      <span className="text-sm text-gray-500">
                        {formatFileSize(file.compressedSize)}
                      </span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        {file.reduction}% Smaller
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadFile(file)}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <span>📥</span>
                    <span>DOWNLOAD</span>
                  </button>
                  <button
                    onClick={() => removeConvertedFile(index)}
                    className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 transition-colors flex items-center space-x-1"
                  >
                    <span>🗑️</span>
                    <span>REMOVE</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Download All Button */}
        {convertedFiles.length > 0 && (
          <div className="flex justify-center items-center">
            <button
              onClick={downloadAll}
              disabled={isGeneratingZip}
              className={`px-8 py-4 rounded-lg transition-colors font-semibold text-lg flex items-center space-x-2 mx-auto cursor-pointer ${
                isGeneratingZip
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isGeneratingZip ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Generating ZIP...</span>
                </>
              ) : (
                <>
                  <span>📦</span>
                  <span>Download All ({convertedFiles.length}) as ZIP</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setFiles([]);
                setConvertedFiles([]);
                setZipData("");
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <span>🗑️</span>
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {isConverting && (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Processing images...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
