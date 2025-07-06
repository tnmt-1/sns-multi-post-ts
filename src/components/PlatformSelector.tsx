import type React from "react";

interface PlatformInfo {
  enabled: boolean;
  limit: number;
}

interface PlatformSelectorProps {
  platforms: { [key: string]: PlatformInfo };
  selectedPlatforms: string[];
  onPlatformToggle: (platform: string) => void;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  platforms,
  selectedPlatforms,
  onPlatformToggle,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-semibold mb-4">投稿先SNSを選択</h2>
      <div
        id="platforms-container"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {Object.entries(platforms).map(([platform, info]) => (
          <div
            key={platform}
            className={`platform-card p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${
                info.enabled
                  ? selectedPlatforms.includes(platform)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
                  : "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed"
              }`}
            onClick={() => info.enabled && onPlatformToggle(platform)}
          >
            <div className="platform-name text-lg font-medium capitalize">
              {platform}
            </div>
            <div className="platform-status text-sm mt-1">
              {info.enabled ? "連携済み" : "未連携"}
            </div>
            <div className="platform-limit text-sm text-gray-600 dark:text-gray-400 mt-1">
              最大 {info.limit} 文字
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatformSelector;
