import { renderPopup, PopupData, Teacher } from "./popupRenderer";

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

async function showPopup(
  target: HTMLElement,
  data: PopupData,
  hoveredName: string,
  selectedCourse: string = "all"
) {
  const popup =
    (document.getElementById("rmp-popup") as HTMLDivElement) || createPopup();

  popup.innerHTML = renderPopup(data, selectedCourse);

  const rect = target.getBoundingClientRect();

  const scaleFactor = 0.7;

  popup.style.transformOrigin = "top left";
  popup.style.transform = `scale(${scaleFactor})`;
  popup.style.top = `${rect.bottom + window.scrollY}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.display = "block";

  attachPopupHoverLogic(target, popup);
  attachDropdownChange(popup, data, hoveredName, target);
  attachOtherMatchesClick(popup, hoveredName, target, data);
}

function hidePopup() {
  const popup = document.getElementById("rmp-popup");
  if (popup) {
    popup.style.display = "none";
  }
}

async function parseAndFetchTeachers(
  fullName: string,
  schoolId: string
): Promise<Teacher[]> {
  const parted = fullName
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const count = parted.length;
  if (count >= 6) {
    console.log("6+ professors, skipping query");
    return [];
  }

  let allTeachers: Teacher[] = [];

  let maxResultsPer = 5;

  if (count === 1) {
    maxResultsPer = 5;
  } else if (count === 2) {
    maxResultsPer = 2;
  } else if (count >= 3 && count <= 5) {
    maxResultsPer = 1;
  }

  for (const sub of parted) {
    const { firstName, lastName } = parseFirstLast(sub);
    const processedName = `${firstName} ${lastName}`.trim();
    if (!processedName) continue;

    const partial = await callBackgroundRMP(
      processedName,
      schoolId,
      maxResultsPer
    );
    if (partial && partial.length > 0) {
      allTeachers = allTeachers.concat(partial);
    }
  }

  return allTeachers;
}

function parseFirstLast(subName: string): {
  firstName: string;
  lastName: string;
} {
  const tokens = subName.split(" ").filter(Boolean);
  if (tokens.length === 1) {
    return { firstName: tokens[0], lastName: "" };
  }
  return {
    firstName: tokens[0],
    lastName: tokens[tokens.length - 1],
  };
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
  originalData: PopupData,
  hoveredName: string,
  professorDiv: HTMLElement
) {
  const dropdown = popup.querySelector("#course-dropdown") as HTMLSelectElement;
  if (!dropdown) return;

  dropdown.addEventListener("change", () => {
    const selectedCourse = dropdown.value;

    let filteredRatings = originalData.allRatings || [];
    if (selectedCourse !== "all") {
      filteredRatings = filteredRatings.filter(
        (r) => r.class === selectedCourse
      );
    }

    const updatedDistribution = computeRatingsDistribution(filteredRatings);
    const updatedStats = computeNewAverages(filteredRatings);

    const newData: PopupData = {
      ...originalData,
      ratings: filteredRatings,
      ratingsDistribution: updatedDistribution,
      avgRatingRounded: updatedStats.avgRatingRounded,
      avgDifficulty: updatedStats.avgDifficulty,
      numRatings: filteredRatings.length,
    };

    showPopup(professorDiv, newData, hoveredName, selectedCourse);
  });
}

function attachOtherMatchesClick(
  popup: HTMLElement,
  hoveredName: string,
  professorDiv: HTMLElement,
  currentData: PopupData
) {
  popup.querySelectorAll(".choose-other").forEach((btn) => {
    btn.addEventListener("click", async (evt) => {
      evt.stopPropagation();
      const target = evt.currentTarget as HTMLElement;
      const profJson = target.getAttribute("data-oth");
      if (!profJson) {
        console.error("No data-oth attribute found for button.");
        return;
      }
      try {
        const chosenProf: Teacher = JSON.parse(profJson);

        await chrome.storage.local.set({
          [`pref_${hoveredName}`]: chosenProf,
        });

        const newMain = buildPopupDataFromTeacher(chosenProf);

        const leftover = (currentData.otherMatches || []).concat([currentData]);
        newMain.otherMatches = leftover.filter((o) => o.id !== chosenProf.id);

        showPopup(professorDiv, newMain, hoveredName, "all");
      } catch (error) {
        console.error("Failed to parse data-oth JSON:", error, profJson);
      }
    });
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

function buildPopupDataFromTeacher(t: Teacher): PopupData {
  return {
    ...t,
    allRatings: t.ratings,
    otherMatches: [],
  };
}

async function callBackgroundRMP(
  name: string,
  schoolId: string,
  maxResults: number
) {
  return new Promise<Teacher[]>((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "FETCH_PROFESSOR_INFO",
        name,
        schoolId,
        maxResults,
      },
      (response: any) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error with background script:",
            chrome.runtime.lastError.message
          );
          return resolve([]);
        }
        if (!response || !Array.isArray(response.teachers)) {
          console.error("No teachers array from background script");
          return resolve([]);
        }
        resolve(response.teachers);
      }
    );
  });
}

function processProfessorElement(professorDiv: HTMLElement) {
  if (observedElements.has(professorDiv)) return;
  observedElements.add(professorDiv);

  professorDiv.style.outline = "2px solid red";

  professorDiv.addEventListener("mouseenter", async () => {
    const professorName = professorDiv.textContent?.trim() || "";
    if (!professorName) return;

    const teachers = await parseAndFetchTeachers(
      professorName,
      "U2Nob29sLTEwNDA="
    );
    if (!teachers.length) return;

    const prefKey = `pref_${professorName}`;
    const stored = await chrome.storage.local.get(prefKey);

    let mainTeacher: Teacher;
    if (stored[prefKey]) {
      const found = teachers.find((t) => t.id === stored[prefKey].id);
      mainTeacher = found || teachers[0];
    } else {
      mainTeacher = teachers[0];
    }
    const others = teachers.filter((t) => t.id !== mainTeacher.id);

    const mainData = buildPopupDataFromTeacher(mainTeacher);
    mainData.otherMatches = others.map(buildPopupDataFromTeacher);

    showPopup(professorDiv, mainData, professorName, "all");
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
