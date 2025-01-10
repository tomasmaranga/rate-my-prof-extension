console.log("Rate My Professor Extension background script is running");

chrome.runtime.onMessage.addListener(
  (
    message: { type: string; name: string; schoolId: string },
    _sender,
    sendResponse
  ) => {
    console.log("Message received in background script:", message);

    if (message.type === "FETCH_PROFESSOR_INFO") {
      console.log("Fetching professor info for:", message);

      const API_LINK = "https://www.ratemyprofessors.com/graphql";
      const AUTH_TOKEN = "dGVzdDp0ZXN0";

      const query = `
        query TeacherDetails($query: TeacherSearchQuery!) {
            search: newSearch {
                teachers(query: $query, first: 1) {
                    edges {
                        node {
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
                                        helpfulRatingRounded
                                        clarityRatingRounded
                                        comment
                                        class
                                        date
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

          if (data?.data?.search?.teachers?.edges?.[0]?.node) {
            const teacherData = data.data.search.teachers.edges[0].node;

            const responseToContentScript = {
              firstName: teacherData.firstName,
              lastName: teacherData.lastName,
              department: teacherData.department,
              avgRatingRounded: teacherData.avgRatingRounded,
              avgDifficulty: teacherData.avgDifficulty,
              wouldTakeAgainPercentRounded:
                teacherData.wouldTakeAgainPercentRounded,
              numRatings: teacherData.numRatings,
              ratingsDistribution: teacherData.ratingsDistribution,
              teacherRatingTags: teacherData.teacherRatingTags,
              ratings: teacherData.ratings?.edges?.map(
                (edge: any) => edge.node
              ),
            };

            console.log(
              "Sending response back to content script:",
              responseToContentScript
            );
            sendResponse(responseToContentScript);
          } else {
            console.error("No teacher data found.");
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
