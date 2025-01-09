console.log("Rate My Professor Extension content script loaded");

// Helper function to wait for a specific DOM element
function waitForElement(selector: string, callback: () => void) {
  const observer = new MutationObserver((_, obs) => {
    if (document.querySelector(selector)) {
      obs.disconnect();
      callback();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function runExtensionScript() {
  console.log("Checking if on search results page...");

  if (window.location.hash.includes("search_results")) {
    console.log("Content script is active on search results page");

    waitForElement("div.tfp-ins", () => {
      console.log(
        "Search results detected, running professor name detection..."
      );

      const professorElements = document.querySelectorAll("div.tfp-ins");
      console.log(`Found ${professorElements.length} professor elements`);

      professorElements.forEach((el, index) => {
        const professorDiv = el as HTMLElement;

        console.log(`Element ${index}:`, professorDiv.textContent?.trim());

        // Highlight each matched element for visibility
        professorDiv.style.outline = "2px solid red";

        professorDiv.addEventListener("mouseenter", () => {
          console.log("Professor hovered:", professorDiv.textContent?.trim());
          professorDiv.style.outline = "2px solid blue";
        });

        professorDiv.addEventListener("mouseleave", () => {
          professorDiv.style.outline = "none";
        });
      });
    });
  } else {
    console.log("Not on search results page. Waiting for navigation...");
  }
}

runExtensionScript();

// Detect hash changes for SPA navigation
window.addEventListener("hashchange", () => {
  console.log("URL hash changed, re-running script...");
  runExtensionScript();
});

// Create a popup element
function createPopup() {
  const popup = document.createElement("div");
  popup.id = "rmp-popup";
  popup.className =
    "absolute bg-white text-black p-4 shadow-lg rounded-lg border border-gray-300 z-50";
  popup.style.display = "none";
  popup.style.position = "absolute";
  popup.style.width = "200px";
  popup.style.pointerEvents = "none";
  document.body.appendChild(popup);
  return popup;
}

// Show popup near the hovered professor element
function showPopup(target: HTMLElement, name: string) {
  const popup = document.getElementById("rmp-popup") || createPopup();
  popup.innerHTML = `
      <div>
        <h3 class="font-bold text-lg">${name}</h3>
        <p>Rating: <span class="font-medium">N/A</span></p>
        <p>Difficulty: <span class="font-medium">N/A</span></p>
        <p>More info coming soon...</p>
      </div>
    `;
  const rect = target.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.display = "block";
}

// Hide the popup
function hidePopup() {
  const popup = document.getElementById("rmp-popup");
  if (popup) popup.style.display = "none";
}

// Attach hover event listeners to professor elements
function attachPopupListeners(professorElements: NodeListOf<HTMLElement>) {
  professorElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      showPopup(el, el.textContent?.trim() || "Unknown Professor");
    });
    el.addEventListener("mouseleave", hidePopup);
  });
}

// Main script logic
waitForElement("div.tfp-ins", () => {
  console.log("Adding hover popup listeners...");
  const professorElements = document.querySelectorAll(
    "div.tfp-ins"
  ) as NodeListOf<HTMLElement>;
  attachPopupListeners(professorElements);
});
