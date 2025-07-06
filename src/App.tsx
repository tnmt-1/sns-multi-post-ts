import type React from "react";
import { useEffect, useState } from "react";
import { useApi } from "./components/hooks/useApi";
import { useToast } from "./components/hooks/useToast";
import Modal from "./components/Modal"; // Import the new Modal component
import PlatformSelector from "./components/PlatformSelector";
import PostForm from "./components/PostForm";

const App: React.FC = () => {
  // ダーク/ライト切り替え機能を削除
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isPlatformModalOpen, setIsPlatformModalOpen] =
    useState<boolean>(false); // State for modal visibility
  const { showToast, ToastContainer } = useToast();

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
      <div className="min-h-screen bg-gray-100 text-gray-900 flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 text-red-500 flex items-center justify-center">
        <p className="text-xl">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 transition-colors duration-300">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SNS Poster</h1>
        </header>
        <main>
          <button
            type="button"
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
