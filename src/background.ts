chrome.runtime.onMessage.addListener(
  (
    message: {
      type: string;
      name: string;
      schoolId: string;
      maxResults?: number;
    },
    _sender,
    sendResponse
  ) => {
    if (message.type === "FETCH_PROFESSOR_INFO") {
      const maxResults = message.maxResults || 5;
      const API_LINK = "https://www.ratemyprofessors.com/graphql";
      const AUTH_TOKEN = "dGVzdDp0ZXN0";

      const query = `
        query TeacherDetails($query: TeacherSearchQuery!) {
          search: newSearch {
            teachers(query: $query, first: ${maxResults}) {
              edges {
                node {
                  id
                  firstName
                  lastName
                  department
                  avgRatingRounded
                  avgDifficulty
                  wouldTakeAgainPercentRounded
                  numRatings
                  school {
                    id
                    name
                    city
                    state
                  }
                  ratingsDistribution {
                    r1
                    r2
                    r3
                    r4
                    r5
                    total
                  }
                  teacherRatingTags {
                    tagName
                    tagCount
                  }
                  ratings {
                    edges {
                      node {
                        qualityRating
                        difficultyRatingRounded
                        iWouldTakeAgain
                        class
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const variables = {
        query: {
          text: message.name,
          schoolID: message.schoolId || null,
        },
      };

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Basic ${AUTH_TOKEN}`,
      };

      (async () => {
        try {
          const response = await fetch(API_LINK, {
            method: "POST",
            headers,
            body: JSON.stringify({ query, variables }),
          });

          const data = await response.json();

          if (data?.data?.search?.teachers?.edges?.length) {
            const teacherEdges = data.data.search.teachers.edges;

            const teachers = teacherEdges.map((edge: any) => {
              const t = edge.node;
              return {
                id: t.id,
                firstName: t.firstName,
                lastName: t.lastName,
                department: t.department,
                avgRatingRounded: t.avgRatingRounded,
                avgDifficulty: t.avgDifficulty,
                wouldTakeAgainPercentRounded: t.wouldTakeAgainPercentRounded,
                numRatings: t.numRatings,
                school: t.school,
                ratingsDistribution: t.ratingsDistribution,
                teacherRatingTags: t.teacherRatingTags,
                ratings:
                  t.ratings?.edges?.map((rEdge: any) => ({
                    qualityRating: rEdge.node.qualityRating || 0,
                    difficultyRatingRounded:
                      rEdge.node.difficultyRatingRounded || 0,
                    iWouldTakeAgain: rEdge.node.iWouldTakeAgain,
                    class: rEdge.node.class || "Unknown",
                  })) || [],
              };
            });

            sendResponse({ teachers });
          } else {
            console.error("No teacher data found for that query.");
            sendResponse(null);
          }
        } catch (error) {
          console.error("Error during fetch:", error);
          sendResponse(null);
        }
      })();

      return true;
    }
  }
);

chrome.storage.onChanged.addListener((changes) => {
  if (changes.extensionEnabled) {
    const isEnabled = changes.extensionEnabled.newValue;

    const iconPath = isEnabled
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
  }
});
