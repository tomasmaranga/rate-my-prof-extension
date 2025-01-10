export function renderPopup(data: {
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
}) {
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
  const maxCount = Math.max(
    data.ratingsDistribution.r1,
    data.ratingsDistribution.r2,
    data.ratingsDistribution.r3,
    data.ratingsDistribution.r4,
    data.ratingsDistribution.r5
  );
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

  return `
    <div class="w-[500px] h-[360px] bg-white">

      <div 
        class="origin-top-left transform scale-75" 
        style="width: 667px;"
      >
        <div class="p-4 text-gray-900">
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

              <h1 class="text-3xl text-black font-bold mt-4">
                ${data.firstName} ${data.lastName}
              </h1>
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
                  <p class="text-sm text-gray-600">
                    Would take again
                  </p>
                </div>
                <div class="w-px h-8 bg-gray-300"></div>
                <div class="text-center">
                  <div class="text-3xl font-extrabold">
                    ${data.avgDifficulty.toFixed(1)}
                  </div>
                  <p class="text-sm text-gray-600">
                    Level of Difficulty
                  </p>
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
                <button 
                  class="bg-gray-300 inline-flex items-center space-x-1 border border-gray-300 text-sm px-3 py-1 rounded-md hover:bg-gray-100"
                >
                  <span>All Courses</span>
                  <svg 
                    class="w-4 h-4 text-white" 
                    fill="none" 
                    stroke="white" 
                    stroke-width="2" 
                    viewBox="0 0 24 24" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div> 
  `;
}
