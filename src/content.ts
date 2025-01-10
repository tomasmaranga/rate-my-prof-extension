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

  document.body.appendChild(popup);
  return popup;
}

function showPopup(
  target: HTMLElement,
  data: any,
  selectedCourse: string = "all"
) {
  const popup =
    (document.getElementById("rmp-popup") as HTMLDivElement) || createPopup();

  popup.innerHTML = renderPopup(data, selectedCourse);

  const rect = target.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.display = "block";

  attachPopupHoverLogic(target, popup);
  attachDropdownChange(popup, data, target);
}

function hidePopup() {
  const popup = document.getElementById("rmp-popup");
  if (popup) {
    popup.style.display = "none";
  }
}

function attachPopupHoverLogic(professorDiv: HTMLElement, popup: HTMLElement) {
  professorDiv.addEventListener("mouseleave", (evt) => {
    if (popup.contains(evt.relatedTarget as Node)) return;
    hidePopup();
  });
  popup.addEventListener("mouseleave", (evt) => {
    if (professorDiv.contains(evt.relatedTarget as Node)) return;
    hidePopup();
  });
}

function attachDropdownChange(
  popup: HTMLElement,
  originalData: any,
  professorDiv: HTMLElement
) {
  const dropdown = popup.querySelector("#course-dropdown") as HTMLSelectElement;
  if (!dropdown) return;

  dropdown.addEventListener("change", () => {
    const selectedCourse = dropdown.value;

    let filteredRatings;
    if (selectedCourse === "all") {
      filteredRatings = originalData.allRatings;
    } else {
      filteredRatings = originalData.allRatings.filter(
        (r: any) => r.class === selectedCourse
      );
    }

    const updatedDistribution = computeRatingsDistribution(filteredRatings);
    const updatedStats = computeNewAverages(filteredRatings);

    const newData = {
      ...originalData,
      ratings: filteredRatings,
      ratingsDistribution: updatedDistribution,
      avgRatingRounded: updatedStats.avgRatingRounded,
      avgDifficulty: updatedStats.avgDifficulty,
      numRatings: filteredRatings.length,
    };

    showPopup(professorDiv, newData, selectedCourse);
  });
}

function computeRatingsDistribution(ratings: any[]) {
  const dist = { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, total: 0 };

  for (const r of ratings) {
    const q = Math.round(r.qualityRating || 0);
    if (q >= 1 && q <= 5) {
      dist[`r${q}` as "r1"]++;
    }
    dist.total++;
  }
  return dist;
}

function computeNewAverages(ratings: any[]) {
  if (!ratings.length) {
    return {
      avgRatingRounded: 0,
      avgDifficulty: 0,
    };
  }
  let sumQuality = 0;
  let sumDiff = 0;
  for (const r of ratings) {
    sumQuality += r.qualityRating || 0;
    sumDiff += r.difficultyRatingRounded || 0;
  }
  const avgQ = sumQuality / ratings.length;
  const avgD = sumDiff / ratings.length;
  return {
    avgRatingRounded: Math.round(avgQ * 10) / 10,
    avgDifficulty: Math.round(avgD * 10) / 10,
  };
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
          const allRatings = response.ratings || [];
          const data = {
            ...response,
            ratings: allRatings,
            allRatings,
          };
          resolve(data);
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
      const info = await fetchProfessorBasicInfo(
        professorName,
        "U2Nob29sLTEwNDA="
      );
      if (info) {
        showPopup(professorDiv, info, "all");
      }
    }
  });
}

function monitorForNewProfessorElements() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        const profs = document.querySelectorAll("div.tfp-ins");
        profs.forEach((el) => processProfessorElement(el as HTMLElement));
      }
    }
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
