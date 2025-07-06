import React from "react";

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
  const id = React.useId();

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
      <div
        id={`platforms-container-${id}`}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {Object.entries(platforms).map(([platform, info]) => (
          <button
            key={platform}
            type="button"
            className={`platform-card p-4 rounded-lg border-2 transition-all duration-200 text-left
              ${
                info.enabled
                  ? selectedPlatforms.includes(platform)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer"
                    : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer"
                  : "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed"
              }`}
            onClick={() => info.enabled && onPlatformToggle(platform)}
            onKeyDown={(e) => {
              if (info.enabled && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onPlatformToggle(platform);
              }
            }}
            disabled={!info.enabled}
            aria-pressed={selectedPlatforms.includes(platform)}
            tabIndex={info.enabled ? 0 : -1}
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
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlatformSelector;
