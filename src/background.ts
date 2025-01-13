console.log("Rate My Professor Extension background script is running");

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
    console.log("Message received in background script:", message);

    if (message.type === "FETCH_PROFESSOR_INFO") {
      const maxResults = message.maxResults || 5;
      console.log("Fetching professor info for:", message);

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
          schoolID: message.schoolId,
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
          console.log("Fetched data:", data);

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

      console.log("Returning true to keep the port alive.");
      return true;
    }
  }
);
