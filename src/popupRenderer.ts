import { Buffer } from "buffer";

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  avgRatingRounded: number;
  avgDifficulty: number;
  wouldTakeAgainPercentRounded: number;
  numRatings: number;
  ratingsDistribution: {
    r1: number;
    r2: number;
    r3: number;
    r4: number;
    r5: number;
    total: number;
  };
  teacherRatingTags: { tagName: string; tagCount: number }[];
  ratings: {
    qualityRating: number;
    difficultyRatingRounded: number;
    iWouldTakeAgain: boolean;
    class: string;
  }[];
}

export interface PopupData extends Teacher {
  allRatings?: Teacher["ratings"];
  otherMatches?: Teacher[];
}

export function renderPopup(
  data: PopupData,
  selectedCourse: string = "all",
  selectedUniversity: string = "tufts"
) {
  const topTags = data.teacherRatingTags
    .sort((a, b) => b.tagCount - a.tagCount)
    .slice(0, 5);

  const tagsHtml =
    topTags.length > 0
      ? topTags
          .map(
            (tag) => `
              <span 
                class="inline-block rounded-full bg-gray-200 text-gray-800 px-3 py-1 text-sm font-medium mb-2 mr-2"
              >
                ${tag.tagName}
              </span>
            `
          )
          .join("")
      : `<span class="text-gray-500 text-sm">No tags available</span>`;

  const maxCount =
    Math.max(
      data.ratingsDistribution.r1,
      data.ratingsDistribution.r2,
      data.ratingsDistribution.r3,
      data.ratingsDistribution.r4,
      data.ratingsDistribution.r5
    ) || 1;

  const decodedId = Buffer.from(data.id, "base64").toString("utf-8");
  const professorId = decodedId.split("-")[1];
  const url = `https://www.ratemyprofessors.com/professor/${professorId}`;

  function renderBarRow(star: number) {
    const count = (data.ratingsDistribution as any)[`r${star}`] || 0;
    const percent = ((count / maxCount) * 100).toFixed(1);

    return `
      <div class="flex items-center mb-2">
        <div class="text-sm w-5 text-right mr-2">${star}</div>
        <div class="relative flex-1 h-10 bg-gray-200 rounded-sm overflow-hidden mr-3">
          <div
            class="absolute left-0 top-0 h-10 bg-[#0055FD] transition-all duration-300"
            style="width: ${percent}%;"
          ></div>
        </div>
        <div class="text-sm w-5 text-right">${count}</div>
      </div>
    `;
  }

  const distributionBars = [5, 4, 3, 2, 1].map(renderBarRow).join("");

  const courses = Array.from(
    new Set(data.allRatings?.map((r) => r.class).filter(Boolean) || [])
  );

  const otherMatchesHtml = `
    <div class="flex justify-between items-center mt-6">
      <h2 class="text-md font-bold">Were you looking for:</h2>
      <div class="flex space-x-2">
        <span 
          class="toggle-university-option cursor-pointer px-2 py-1 border rounded ${
            selectedUniversity === "tufts"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-800"
          }"
          data-value="tufts"
        >
          Tufts
        </span>
        <span 
          class="toggle-university-option cursor-pointer px-2 py-1 border rounded ${
            selectedUniversity === "all"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-800"
          }"
          data-value="all"
        >
          All Universities
        </span>
      </div>
    </div>
    <div class="mt-2 space-y-1">
      ${
        data.otherMatches
          ?.map((oth) => {
            const escapedData = JSON.stringify(oth)
              .replace(/\\/g, "\\\\")
              .replace(/"/g, "&quot;");
            return `
            <div class="flex justify-between items-center border-b py-1">
              <span>
                ${oth.firstName} ${oth.lastName} (${
              oth.department || "Unknown"
            })
              </span>
              <button
                class="choose-other text-blue-600 underline"
                data-oth="${escapedData}"
              >
                Select
              </button>
            </div>
          `;
          })
          .join("") ||
        `<span class="text-gray-500 text-sm">No other matches available</span>`
      }
    </div>
  `;

  return `
    <div class="w-[667px] h-auto bg-white p-4 text-gray-900">
      <div class="flex flex-wrap md:flex-nowrap md:space-x-8">
        <div class="w-full md:w-1/2 mb-6 md:mb-0">
          <div class="flex items-baseline space-x-2">
            <span class="text-5xl font-extrabold">
              ${data.avgRatingRounded.toFixed(1)}
            </span>
            <span class="text-xl text-gray-500">/ 5</span>
          </div>
          <p class="mt-1 text-sm text-gray-600">
            Overall Quality Based on 
            <span class="underline cursor-pointer">
              ${data.numRatings} Ratings
            </span>
          </p>
          <div class="flex flex-row gap-2 items-center">
            <h1 class="text-3xl text-black font-bold">
              ${data.firstName} ${data.lastName}
            </h1>
            <a
              href="${url}"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:text-blue-800 flex justify-center"
            >
              <svg
                stroke="currentColor"
                fill="currentColor"
                stroke-width="0"
                version="1.2"
                baseProfile="tiny"
                viewBox="0 0 24 24"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M14 3v2h3.59l-5.27 5.27 1.41 1.41L19 6.41V10h2V3z"></path>
                <path d="M19 13v8H5V5h8V3H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8h-2z"></path>
              </svg>
            </a>
          </div>
          <p class="text-gray-700 mt-1">
            Department: 
            <span class="font-medium">${data.department}</span><br />
            at Tufts University
          </p>
          <div class="flex items-center space-x-6 mt-6">
            <div class="text-center">
              <div class="text-3xl font-extrabold">
                ${data.wouldTakeAgainPercentRounded.toFixed(0)}%
              </div>
              <p class="text-sm text-gray-600">Would take again</p>
            </div>
            <div class="w-px h-8 bg-gray-300"></div>
            <div class="text-center">
              <div class="text-3xl font-extrabold">
                ${data.avgDifficulty.toFixed(1)}
              </div>
              <p class="text-sm text-gray-600">Level of Difficulty</p>
            </div>
          </div>
          <h2 class="text-lg font-bold mt-6">
            Professor ${data.lastName}'s Top Tags
          </h2>
          <div class="mt-3 flex flex-wrap">
            ${tagsHtml}
          </div>
        </div>
        <div class="w-full md:w-1/2">
          ${distributionBars}
          <div class="mt-6 flex items-center">
            <span class="text-sm text-gray-600 mr-2">
              Showing Results for:
            </span>
            <select
              id="course-dropdown"
              class="bg-gray-300 inline-flex items-center space-x-1 border border-gray-300 text-sm px-3 py-1 rounded-md hover:bg-gray-100"
            >
              <option value="all" ${selectedCourse === "all" ? "selected" : ""}>
                All Courses
              </option>
              ${courses
                .map(
                  (course) => `
                    <option
                      value="${course}"
                      ${course === selectedCourse ? "selected" : ""}
                    >
                      ${course}
                    </option>
                  `
                )
                .join("")}
            </select>
          </div>
        </div>
      </div>
      ${otherMatchesHtml}
    </div>
  `;
}
