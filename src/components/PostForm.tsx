import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import { postContent } from "./hooks/useApi";

interface PostFormProps {
  selectedPlatforms: string[] | null;
  characterLimits: { [key: string]: number };
  showToast: (
    message: string,
    options?: { type?: "success" | "error" | "info"; duration?: number },
  ) => void;
}

interface PostResult {
  platform: string;
  success: boolean;
  error?: string;
  message?: string;
}

interface ResultSummary {
  success: boolean;
  results: {
    [platform: string]: {
      success: boolean;
      error: string | null;
    };
  };
}

interface ResultSummaryResults {
  [platform: string]: {
    success: boolean;
    error: string | null;
  };
}

interface ResultSummaryTyped {
  success: boolean;
  results: ResultSummaryResults;
}

const PostForm: React.FC<PostFormProps> = ({
  selectedPlatforms,
  characterLimits,
  showToast,
}) => {
  const [postMode, setPostMode] = useState<"unified" | "individual">("unified");
  const [unifiedContent, setUnifiedContent] = useState<string>("");
  const [individualContents, setIndividualContents] = useState<{
    [key: string]: string;
  }>({});
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const unifiedContentRef = useRef<HTMLTextAreaElement>(null);
  const unifiedModeId = useId();
  const individualModeId = useId();
  const imageInputId = useId();
  const postButtonId = useId();

  // unifiedContentの変更をindividualContentsに同期
  useEffect(() => {
    if (postMode === "individual" && selectedPlatforms !== null) {
      const newIndividualContents: { [key: string]: string } = {};
      selectedPlatforms.forEach((platform) => {
        newIndividualContents[platform] = unifiedContent;
      });
      setIndividualContents(newIndividualContents);
    }
  }, [unifiedContent, postMode, selectedPlatforms]);

  // ページ表示時とモード切り替え時に自動フォーカス
  useEffect(() => {
    if (postMode === "unified" && unifiedContentRef.current) {
      unifiedContentRef.current.focus();
    }
  }, [postMode]);

  const handleUnifiedContentChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setUnifiedContent(e.target.value);
  };

  const handleIndividualContentChange = (
    platform: string,
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setIndividualContents((prev) => ({
      ...prev,
      [platform]: e.target.value,
    }));
  };

  const getUnifiedCharLimit = () => {
    if (selectedPlatforms === null || selectedPlatforms.length === 0)
      return 3000; // デフォルト値
    let min = 3000;
    selectedPlatforms.forEach((platform) => {
      if (characterLimits[platform] && characterLimits[platform] < min) {
        min = characterLimits[platform];
      }
    });
    return min;
  };

  const unifiedCharLimit = getUnifiedCharLimit();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = [...selectedImageFiles];
      for (const file of files) {
        if (newFiles.length < 4) {
          const compressed = await compressImage(file);
          newFiles.push(compressed);
        }
      }
      setSelectedImageFiles(newFiles.slice(0, 4));
      e.target.value = ""; // 同じファイルを再度選択できるようにクリア
    }
  };

  const handleImageRemove = (index: number) => {
    setSelectedImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData?.items) {
      for (const item of e.clipboardData.items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file && selectedImageFiles.length < 4) {
            compressImage(file).then((compressed) => {
              setSelectedImageFiles((prev) =>
                [...prev, compressed].slice(0, 4),
              );
            });
          }
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleSubmit = async () => {
    setIsPosting(true);
    try {
      if (selectedPlatforms === null || selectedPlatforms.length === 0) {
        throw new Error("投稿先のSNSを選択してください");
      }

      const postDataPerPlatform: { [key: string]: string } = {};
      if (postMode === "unified") {
        if (!unifiedContent.trim() && selectedImageFiles.length === 0) {
          throw new Error("投稿内容または画像を入力してください");
        }
        selectedPlatforms.forEach((platform) => {
          postDataPerPlatform[platform] = unifiedContent;
        });
      } else {
        let hasContentOrImage = false;
        if (selectedPlatforms !== null) {
          selectedPlatforms.forEach((platform) => {
            const content = individualContents[platform] || "";
            if (content.trim()) hasContentOrImage = true;
            postDataPerPlatform[platform] = content;
          });
        }
        if (!hasContentOrImage && selectedImageFiles.length === 0) {
          throw new Error("投稿内容または画像を入力してください");
        }
      }

      const results = await postContent(
        selectedPlatforms || [], // Pass an empty array if null
        postDataPerPlatform,
        selectedImageFiles,
      );

      const resultSummary: ResultSummaryTyped = {
        success: (results as PostResult[]).every((r: PostResult) => r.success),
        results: {},
      };

      (results as PostResult[]).forEach((r: PostResult) => {
        (resultSummary as ResultSummary).results[r.platform] = {
          success: r.success,
          error: r.error || r.message || null,
        };
      });
      showPostResult(resultSummary);
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, { type: "error" });
      } else {
        showToast("予期しないエラーが発生しました", { type: "error" });
      }
    } finally {
      setIsPosting(false);
    }
  };

  const showPostResult = (result: ResultSummaryTyped) => {
    let msg = "";
    if (result.success) {
      msg = "投稿に成功しました！";
    } else {
      msg = "一部のプラットフォームへの投稿に失敗しました。\n";
    }
    if (result.results) {
      Object.keys(result.results).forEach((platform) => {
        const platformResult = result.results[platform];
        const displayName =
          platform.charAt(0).toUpperCase() + platform.slice(1);
        msg +=
          `${displayName}: ${platformResult.success ? "成功" : `失敗 (${platformResult.error || "エラー"}`}` +
          `)\n`;
      });
    }
    showToast(msg, {
      type: result.success ? "success" : "error",
      duration: 6000,
    });

    if (result.success) {
      setUnifiedContent("");
      setIndividualContents({});
      setSelectedImageFiles([]);
    }
  };

  // Ctrl+Enterで投稿
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 画像圧縮ユーティリティ
  async function compressImage(
    file: File,
    maxSize = 1280,
    quality = 0.8,
  ): Promise<File> {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const ext = file.type === "image/png" ? "png" : "jpeg";
                resolve(new File([blob], file.name, { type: `image/${ext}` }));
              } else {
                resolve(file);
              }
            },
            file.type === "image/png" ? "image/png" : "image/jpeg",
            quality,
          );
        } else {
          resolve(file);
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex mb-4">
        <button
          type="button"
          className={`px-4 py-2 rounded-l-md ${postMode === "unified" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}
          onClick={() => setPostMode("unified")}
        >
          一括投稿
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-r-md ${postMode === "individual" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}
          onClick={() => setPostMode("individual")}
        >
          個別投稿
        </button>
      </div>
      {postMode === "unified" && (
        <div id={unifiedModeId}>
          <textarea
            ref={unifiedContentRef}
            id={`${unifiedModeId}-content`}
            className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={6}
            placeholder="投稿内容を入力..."
            value={unifiedContent}
            onChange={handleUnifiedContentChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            maxLength={unifiedCharLimit}
          ></textarea>
          <div className="text-right text-sm text-gray-500 mt-1">
            {unifiedContent.length} / {unifiedCharLimit}
          </div>
        </div>
      )}
      {postMode === "individual" && (
        <div id={individualModeId}>
          {selectedPlatforms === null || selectedPlatforms.length === 0 ? (
            <p className="text-gray-600">投稿先のSNSを選択してください</p>
          ) : (
            selectedPlatforms.map((platform) => {
              const limit = characterLimits[platform];
              const displayName =
                platform.charAt(0).toUpperCase() + platform.slice(1);
              const content = individualContents[platform] || "";
              return (
                <div
                  key={platform}
                  className="individual-post bg-gray-50 p-4 rounded-md mb-4"
                >
                  <div className="individual-post-header flex justify-between items-center mb-2">
                    <div className="individual-post-platform text-lg font-medium capitalize">
                      {displayName}
                    </div>
                    <div className="platform-limit text-sm text-gray-600">
                      最大 {limit} 文字
                    </div>
                  </div>
                  <div className="textarea-container">
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      rows={4}
                      placeholder={`${displayName}に投稿する内容を入力...`}
                      value={content}
                      onChange={(e) =>
                        handleIndividualContentChange(platform, e)
                      }
                      onPaste={handlePaste}
                      onKeyDown={handleKeyDown}
                      maxLength={limit}
                    ></textarea>
                    <div
                      className={`text-right text-sm mt-1 ${content.length > limit * 0.9 ? "text-red-500" : "text-gray-500"}`}
                    >
                      {content.length} / {limit}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      <input
        type="file"
        id={imageInputId}
        accept="image/*"
        multiple
        onChange={handleImageChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => document.getElementById(imageInputId)?.click()}
        className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        画像を選択 (最大4枚)
      </button>
      <div
        id={`${imageInputId}-filename`}
        className="text-sm text-gray-600 mt-2"
      >
        {selectedImageFiles.map((file) => file.name).join(", ")}
      </div>
      <div
        id={`${imageInputId}-preview-container`}
        className="flex flex-wrap gap-2 mt-2"
      >
        {selectedImageFiles.map((file, index) => (
          <div
            key={`${file.name}-${file.lastModified}`}
            className="image-preview-item relative w-24 h-24 border border-gray-300 rounded-md overflow-hidden"
          >
            <img
              src={URL.createObjectURL(file)}
              alt={`preview-${index}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              className="image-remove-btn absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
              onClick={() => handleImageRemove(index)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        id={postButtonId}
        className={`w-full mt-6 px-4 py-3 rounded-md text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 ${isPosting ? "bg-gray-200 text-gray-800 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}
        disabled={isPosting}
      >
        {isPosting ? "投稿中..." : "投稿する"}
      </button>
    </div>
  );
};

export default PostForm;
