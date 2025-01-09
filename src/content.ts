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

        professorDiv.addEventListener("mouseenter", async () => {
          const professorName = professorDiv.textContent?.trim();
          console.log("Fetching data for:", professorName);

          if (professorName) {
            const basicInfo = await fetchProfessorBasicInfo(
              professorName,
              "U2Nob29sLTEwNDA="
            );
            console.log("Fetched Basic Info:", basicInfo);

            if (basicInfo) {
              showPopup(professorDiv, basicInfo);
            }
          }
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
function showPopup(
  target: HTMLElement,
  data: {
    firstName: string;
    lastName: string;
    avgDifficulty: number;
    avgRatingRounded: number;
    department: string;
    numRatings: number;
    wouldTakeAgainPercentRounded: number;
  }
) {
  const popup = document.getElementById("rmp-popup") || createPopup();
  popup.innerHTML = `
      <div>
        <h3 class="font-bold text-lg">${data.firstName} ${data.lastName}</h3>
        <p>Department: <span class="font-medium">${data.department}</span></p>
        <p>Rating: <span class="font-medium">${data.avgRatingRounded}</span></p>
        <p>Difficulty: <span class="font-medium">${data.avgDifficulty}</span></p>
        <p>Would Take Again: <span class="font-medium">${data.wouldTakeAgainPercentRounded}%</span></p>
        <p>Number of Ratings: <span class="font-medium">${data.numRatings}</span></p>
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
    el.addEventListener("mouseenter", async () => {
      const professorName = el.textContent?.trim();
      if (professorName) {
        const basicInfo = await fetchProfessorBasicInfo(
          professorName,
          "U2Nob29sLTEwNDA="
        );
        if (basicInfo) {
          showPopup(el, basicInfo); // Pass the structured data
        }
      }
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

async function fetchProfessorBasicInfo(
  name: string,
  schoolId: string
): Promise<{
  firstName: string;
  lastName: string;
  avgDifficulty: number;
  avgRatingRounded: number;
  department: string;
  numRatings: number;
  wouldTakeAgainPercentRounded: number;
} | null> {
  console.log("Fetching data for:", name);

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "FETCH_PROFESSOR_INFO",
        name,
        schoolId,
      },
      (response: any) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error communicating with the background script:",
            chrome.runtime.lastError.message
          );
          resolve(null);
        } else if (!response) {
          console.error("No response from background script.");
          resolve(null);
        } else {
          console.log("Response received from background script:", response);
          resolve(response);
        }
      }
    );
  });
}
