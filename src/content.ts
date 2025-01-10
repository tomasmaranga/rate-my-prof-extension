import { renderPopup } from "./popupRenderer";

console.log("Rate My Professor Extension content script loaded");

// Set of already processed professor elements
const observedElements = new Set<HTMLElement>();

// Helper function to create a popup
function createPopup() {
  const popup = document.createElement("div");
  popup.id = "rmp-popup";
  popup.className =
    "absolute bg-white text-black p-4 shadow-lg rounded-lg border border-gray-300 z-50";
  popup.style.display = "none";
  popup.style.position = "absolute";
  popup.style.width = "800px";
  popup.style.pointerEvents = "none";
  document.body.appendChild(popup);
  return popup;
}

// Function to show a popup with professor info
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
    ratingsDistribution: {
      r1: number;
      r2: number;
      r3: number;
      r4: number;
      r5: number;
      total: number;
    };
    teacherRatingTags: { tagName: string; tagCount: number }[];
  }
) {
  const popup = document.getElementById("rmp-popup") || createPopup();

  popup.innerHTML = renderPopup(data);

  const rect = target.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.display = "block";
}

// Function to hide the popup
function hidePopup() {
  const popup = document.getElementById("rmp-popup");
  if (popup) popup.style.display = "none";
}

// Function to fetch professor information from the background script
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
  ratingsDistribution: {
    r1: number;
    r2: number;
    r3: number;
    r4: number;
    r5: number;
    total: number;
  };
  teacherRatingTags: { tagName: string; tagCount: number }[];
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

          resolve({
            firstName: response.firstName,
            lastName: response.lastName,
            avgDifficulty: response.avgDifficulty || 0,
            avgRatingRounded: response.avgRatingRounded || 0,
            department: response.department || "N/A",
            numRatings: response.numRatings || 0,
            wouldTakeAgainPercentRounded:
              response.wouldTakeAgainPercentRounded || 0,
            ratingsDistribution: response.ratingsDistribution || {
              r1: 0,
              r2: 0,
              r3: 0,
              r4: 0,
              r5: 0,
              total: 0,
            },
            teacherRatingTags: response.teacherRatingTags || [],
          });
        }
      }
    );
  });
}

function processProfessorElement(professorDiv: HTMLElement) {
  if (observedElements.has(professorDiv)) return;
  observedElements.add(professorDiv);

  professorDiv.style.outline = "2px solid red";

  professorDiv.addEventListener("mouseenter", async () => {
    const professorName = professorDiv.textContent?.trim();
    if (professorName) {
      const basicInfo = await fetchProfessorBasicInfo(
        professorName,
        "U2Nob29sLTEwNDA="
      );
      if (basicInfo) showPopup(professorDiv, basicInfo);
    }
  });

  professorDiv.addEventListener("mouseleave", hidePopup);
}

function monitorForNewProfessorElements() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        const professorElements = document.querySelectorAll("div.tfp-ins");
        professorElements.forEach((el) =>
          processProfessorElement(el as HTMLElement)
        );
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log("Monitoring for new professor elements...");
}

function runExtensionScript() {
  console.log("Checking if on search results page...");
  if (window.location.hash.includes("search_results")) {
    console.log("Content script is active on search results page");
    monitorForNewProfessorElements();
  } else {
    console.log("Not on search results page. Waiting for navigation...");
  }
}

runExtensionScript();

window.addEventListener("hashchange", () => {
  console.log("URL hash changed, re-running script...");
  runExtensionScript();
});
