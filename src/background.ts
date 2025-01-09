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
            query TeacherSearchResultsPageQuery($query: TeacherSearchQuery!) {
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
          console.log("Data fetched successfully in background script:", data);

          const result = data?.data?.search?.teachers?.edges?.[0]?.node || null;
          console.log("Sending response back to content script:", result);
          sendResponse(result);
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
