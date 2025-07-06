import type React from "react";
import { useEffect, useState } from "react";
import { useApi } from "./components/hooks/useApi";
import { useToast } from "./components/hooks/useToast";
import PlatformSelector from "./components/PlatformSelector";
import PostForm from "./components/PostForm";
import Modal from "./components/Modal"; // Import the new Modal component

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode === "true"; // Default to light mode if no saved preference
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState<boolean>(false); // State for modal visibility
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const { platforms, characterLimits, loading, error } = useApi();

  useEffect(() => {
    // APIからプラットフォームが取得できたら、enabledなものをデフォルトで選択状態にする
    if (Object.keys(platforms).length > 0) {
      const initialSelected = Object.entries(platforms)
        .filter(([, info]) => info.enabled)
        .map(([platform]) => platform);
      setSelectedPlatforms(initialSelected);
    }
  }, [platforms]);

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prevSelected) => {
      if (prevSelected.includes(platform)) {
        return prevSelected.filter((p) => p !== platform);
      } else {
        return [...prevSelected, platform];
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-red-500 flex items-center justify-center">
        <p className="text-xl">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SNS Poster</h1>
          <button
            onClick={toggleDarkMode}
            className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            {isDarkMode ? "ライトモードへ切替" : "ダークモードへ切替"}
          </button>
        </header>
        <main>
          <button
            onClick={() => setIsPlatformModalOpen(true)}
            className="mb-4 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-300"
          >
            投稿先SNSを選択
          </button>

          <PostForm
            selectedPlatforms={selectedPlatforms}
            characterLimits={characterLimits}
            showToast={showToast}
          />

          <Modal
            isOpen={isPlatformModalOpen}
            onClose={() => setIsPlatformModalOpen(false)}
            title="投稿先SNSを選択"
          >
            <PlatformSelector
              platforms={platforms}
              selectedPlatforms={selectedPlatforms}
              onPlatformToggle={handlePlatformToggle}
            />
          </Modal>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default App;
