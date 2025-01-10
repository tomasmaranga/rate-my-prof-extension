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

  const tagsHtml = topTags
    .map(
      (tag) =>
        `<span class="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded-md text-sm mr-1">${tag.tagName}</span>`
    )
    .join("");

  return `
      <div>
        <h3 class="font-bold text-lg">${data.firstName} ${data.lastName}</h3>
        <p>Department: <span class="font-medium">${data.department}</span></p>
        <p>Rating: <span class="font-medium">${data.avgRatingRounded}</span></p>
        <p>Difficulty: <span class="font-medium">${
          data.avgDifficulty
        }</span></p>
        <p>Would Take Again: <span class="font-medium">${
          data.wouldTakeAgainPercentRounded
        }%</span></p>
        <p>Number of Ratings: <span class="font-medium">${
          data.numRatings
        }</span></p>
        <h4 class="font-bold mt-4">Ratings Distribution:</h4>
        <ul>
          <li>5 Stars: ${data.ratingsDistribution.r5}</li>
          <li>4 Stars: ${data.ratingsDistribution.r4}</li>
          <li>3 Stars: ${data.ratingsDistribution.r3}</li>
          <li>2 Stars: ${data.ratingsDistribution.r2}</li>
          <li>1 Star: ${data.ratingsDistribution.r1}</li>
          <li>Total: ${data.ratingsDistribution.total}</li>
        </ul>
        <h4 class="font-bold mt-4">Top Tags:</h4>
        <div>${
          tagsHtml || "<span class='text-gray-500'>No tags available</span>"
        }</div>
      </div>
    `;
}
