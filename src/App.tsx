import { useEffect, useState } from "react";

function App() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    chrome.storage.local.get("extensionEnabled", (data) => {
      const isExtensionEnabled = data.extensionEnabled !== false;
      setIsEnabled(isExtensionEnabled);
      updateIcon(isExtensionEnabled);
    });
  }, []);

  const handleToggleChange = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    chrome.storage.local.set({ extensionEnabled: newState });
    updateIcon(newState);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  const updateIcon = (enabled: boolean) => {
    const iconPath = enabled
      ? {
          16: "icon-16.png",
          48: "icon-48.png",
          128: "icon-128.png",
        }
      : {
          16: "icon-16-disabled.png",
          48: "icon-48-disabled.png",
          128: "icon-128-disabled.png",
        };

    chrome.action.setIcon({ path: iconPath });
  };

  const openLink = () => {
    window.open("https://forms.gle/Z17XMjh2qoVzNW9w8", "_blank");
  };

  const toggleText = isEnabled ? "Disable" : "Enable";

  return (
    <div className="flex flex-col items-center justify-center h-[100px] w-[180px] bg-gray-100">
      <button
        onClick={handleToggleChange}
        className="px-2 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
      >
        {toggleText}
      </button>

      {showMessage && (
        <p className="text-[11px] text-gray-600">
          Reload the page to apply changes.
        </p>
      )}

      <button
        onClick={openLink}
        className="mt-2 px-2 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
      >
        Send Feedback!
      </button>
    </div>
  );
}

export default App;
