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
                }
              }
            }
          }
        }
      `;

      const searchVariables = {
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
          const searchRes = await fetch(API_LINK, {
            method: "POST",
            headers,
            body: JSON.stringify({
              query: query,
              variables: searchVariables,
            }),
          });
          const searchData = await searchRes.json();

          const edges = searchData?.data?.search?.teachers?.edges;
          if (!edges?.length) {
            console.error("No teacher data found for that query.");
            sendResponse(null);
            return;
          }

          const teachersPromises = edges.map(async (edge: any) => {
            const t = edge.node;
            const teacherBase = {
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
              ratings: [] as any[],
            };

            const ratingsQuery = `
              query GetTeacherRatings($id: ID!) {
                node(id: $id) {
                  ... on Teacher {
                    ratings(first: 300) {
                      edges {
                        node {
                          qualityRating
                          difficultyRatingRounded
                          iWouldTakeAgain
                          class
                          date
                        }
                      }
                    }
                  }
                }
              }
            `;
            const ratingsRes = await fetch(API_LINK, {
              method: "POST",
              headers,
              body: JSON.stringify({
                query: ratingsQuery,
                variables: { id: t.id },
              }),
            });
            const ratingsData = await ratingsRes.json();
            const ratingEdges = ratingsData?.data?.node?.ratings?.edges || [];
            teacherBase.ratings = ratingEdges.map((rEdge: any) => ({
              qualityRating: rEdge.node.qualityRating || 0,
              difficultyRatingRounded: rEdge.node.difficultyRatingRounded || 0,
              iWouldTakeAgain: rEdge.node.iWouldTakeAgain,
              class: rEdge.node.class || "Unknown",
              date: rEdge.node.date || null,
            }));

            return teacherBase;
          });

          const fullTeachers = await Promise.all(teachersPromises);

          sendResponse({ teachers: fullTeachers });
        } catch (error) {
          console.error("Error during fetch:", error);
          sendResponse(null);
        }
      })();

      return true;
    }
  }
);
