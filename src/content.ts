import { renderPopup } from "./popupRenderer";

console.log("Rate My Professor Extension content script loaded");

const observedElements = new Set<HTMLElement>();

function createPopup() {
  const popup = document.createElement("div");
  popup.id = "rmp-popup";
  popup.className =
    "absolute bg-white text-black p-4 shadow-lg rounded-lg border border-gray-300 z-50";
  popup.style.display = "none";
  popup.style.position = "absolute";
  popup.style.pointerEvents = "auto";

  popup.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    if (target.matches(".rmp-course-item")) {
      const courseName = target.getAttribute("data-course");
      console.log("User clicked course:", courseName);
      event.stopPropagation();
    }
  });

  document.body.appendChild(popup);
  return popup;
}

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
  const popup =
    (document.getElementById("rmp-popup") as HTMLDivElement) || createPopup();
  popup.innerHTML = renderPopup(data);

  const rect = target.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.display = "block";

  attachPopupHoverLogic(target, popup);
}

function hidePopup() {
  const popup = document.getElementById("rmp-popup");
  if (popup) {
    popup.style.display = "none";
  }
}

function attachPopupHoverLogic(professorDiv: HTMLElement, popup: HTMLElement) {
  professorDiv.addEventListener("mouseleave", (event) => {
    if (popup.contains(event.relatedTarget as Node)) {
      return;
    }
    hidePopup();
  });

  popup.addEventListener("mouseleave", (event) => {
    if (professorDiv.contains(event.relatedTarget as Node)) {
      return;
    }
    hidePopup();
  });
}

async function fetchProfessorBasicInfo(name: string, schoolId: string) {
  console.log("Fetching data for:", name);

  return new Promise<any>((resolve) => {
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
      if (basicInfo) {
        showPopup(professorDiv, basicInfo);
      }
    }
  });
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
