import type React from "react";
import { useEffect, useState } from "react";
import { useApi } from "./components/hooks/useApi";
import { useToast } from "./components/hooks/useToast";
import Modal from "./components/Modal"; // Import the new Modal component
import PlatformSelector from "./components/PlatformSelector";
import PostForm from "./components/PostForm";

const App: React.FC = () => {
  // ダーク/ライト切り替え機能を削除
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[] | null>(
    null,
  );
  const [isPlatformModalOpen, setIsPlatformModalOpen] =
    useState<boolean>(false); // State for modal visibility
  const { showToast, ToastContainer } = useToast();

  const { platforms, characterLimits, loading, error } = useApi();

  // Load from localStorage or API on initial render or when platforms change
  useEffect(() => {
    if (Object.keys(platforms).length > 0 && selectedPlatforms === null) {
      // Only initialize if platforms are loaded and selectedPlatforms is still null
      const savedPlatforms = localStorage.getItem("selectedPlatforms");
      if (savedPlatforms) {
        const parsedSavedPlatforms: string[] = JSON.parse(savedPlatforms);
        // Filter out any saved platforms that are no longer enabled by the API
        const validSavedPlatforms = parsedSavedPlatforms.filter(
          (platform) => platforms[platform]?.enabled,
        );
        setSelectedPlatforms(validSavedPlatforms);
      } else {
        const initialSelected = Object.entries(platforms)
          .filter(([, info]) => info.enabled)
          .map(([platform]) => platform);
        setSelectedPlatforms(initialSelected);
      }
    }
  }, [platforms, selectedPlatforms]); // Add selectedPlatforms to dependencies

  // Save selectedPlatforms to localStorage whenever it changes (and is not null)
  useEffect(() => {
    if (selectedPlatforms !== null) {
      localStorage.setItem(
        "selectedPlatforms",
        JSON.stringify(selectedPlatforms),
      );
    }
  }, [selectedPlatforms]);

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prevSelected) => {
      if (prevSelected === null) return [platform]; // Should not happen if initialized correctly
      if (prevSelected.includes(platform)) {
        return prevSelected.filter((p) => p !== platform);
      } else {
        return [...prevSelected, platform];
      }
    });
  };

  if (loading || selectedPlatforms === null) {
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
          <button
            type="button"
            onClick={() => setIsPlatformModalOpen(true)}
            className="p-2 rounded-full bg-transparent text-gray-300 transition-colors duration-300"
            title="投稿先SNSを選択"
          >
            ⚙️
          </button>
        </header>
        <main>
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
