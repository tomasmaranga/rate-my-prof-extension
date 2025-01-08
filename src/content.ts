console.log("Rate My Professor Extension content script loaded");

// Helper function to wait for a specific DOM element
function waitForElement(selector: string, callback: () => void) {
  const observer = new MutationObserver((_, obs) => {
    if (document.querySelector(selector)) {
      obs.disconnect();
      callback();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Main script logic
function runExtensionScript() {
  console.log("Checking if on search results page...");

  if (window.location.hash.includes("search_results")) {
    console.log("Content script is active on search results page");

    waitForElement("div.tfp-ins", () => {
      console.log(
        "Search results detected, running professor name detection..."
      );

      const professorElements = document.querySelectorAll("div.tfp-ins");
      console.log(`Found ${professorElements.length} professor elements`);

      professorElements.forEach((el, index) => {
        const professorDiv = el as HTMLElement;

        console.log(`Element ${index}:`, professorDiv.textContent?.trim());

        // Highlight each matched element for visibility
        professorDiv.style.outline = "2px solid red";

        professorDiv.addEventListener("mouseenter", () => {
          console.log("Professor hovered:", professorDiv.textContent?.trim());
          professorDiv.style.outline = "2px solid blue";
        });

        professorDiv.addEventListener("mouseleave", () => {
          professorDiv.style.outline = "none";
        });
      });
    });
  } else {
    console.log("Not on search results page. Waiting for navigation...");
  }
}

// Run on initial load
runExtensionScript();

// Detect hash changes for SPA navigation
window.addEventListener("hashchange", () => {
  console.log("URL hash changed, re-running script...");
  runExtensionScript();
});
