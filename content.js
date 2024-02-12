// content.js
(async () => {
  // Function to handle the intersection event
  function handleIntersection(entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        console.log("Content is now visible", entry.target);
        // Perform any actions needed when content is visible
        // For example, capturing content for stitching or further processing
        let visibleContent = entry.target;
        return visibleContent;
      }
    });
  }

  // Options for the observer (which parts of the screen to observe)
  const observerOptions = {
    root: null, // null means it observes the entire viewport
    rootMargin: "0px",
    threshold: 0.1, // Callback is triggered when 10% of the target is visible
  };

  // Creating an IntersectionObserver instance
  const observer = new IntersectionObserver(
    handleIntersection,
    observerOptions
  );

  // Function to start observing elements with a specific class
  function observePageFrameContainers() {
    const containers = document.querySelectorAll(
      ".scriptor-pageFrameContainer .scriptor-pageFrame"
    );
    containers.forEach((container) => observer.observe(container));
  }

  // Initially observe elements
//   observePageFrameContainers();

  // Optional: Use a MutationObserver to observe dynamically added elements
  function setupMutationObserver() {
    const config = { childList: true, subtree: true };
    const callback = function (mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          // Re-observe new elements each time the DOM changes
          observePageFrameContainers();
        }
      }
    };
    const mutationObserver = new MutationObserver(callback);
    mutationObserver.observe(document.body, config);
  }

  setupMutationObserver();

  // Consider calling observePageFrameContainers() again after dynamic content loads
  // You may integrate this into a mutation observer or after a dynamic content loading event

  async function getContentSize() {
    let sections = [];
    let totalHeight = 0;
    let pageContainers = document
      .querySelectorAll(".scriptor-canvas .scriptor-pageContainer")
      .forEach((pc) => {
        console.log("pageContainer", pc);

        pc.querySelectorAll(".scriptor-pageFrameContainer").forEach((e) => {
          console.log("e style", e.offsetHeight);
          totalHeight += e.offsetHeight;
          console.log("New total Height", totalHeight);
          sections.push(observer.observe(e));
        });
      });

      console.log('Sections', sections);
  }
  // Function to scroll through the page and capture HTML sections
  async function captureHTMLContent() {
    let sections = [];
    const originalPosition = window.scrollY;
    const scrollHeight = document.body.scrollHeight;
    const viewportHeight = window.innerHeight;

    console.log(originalPosition, scrollHeight, viewportHeight);

    for (let yPos = 0; yPos < scrollHeight; yPos += viewportHeight) {
      window.scrollTo(0, yPos);
      console.log("Scroll", yPos);
      // Wait for the dynamic content to load
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Adjust timing as needed

      // Capture the currently visible content
      let visibleContent = document.querySelector(
        ".scriptor-pageFrameContainer"
      ).innerHTML; // Adjust this selector as needed
      console.log("scriptor content", visibleContent);
      sections.push(visibleContent);
    }

    // Return to the original scroll position
    window.scrollTo(0, originalPosition);
    console.log("Sections", sections);
    return sections;
  }

  // Function to stitch together captured HTML sections
  function stitchHTMLSections(sections) {
    const fullContent = sections.join(""); // Simple concatenation; might need refinement for duplicates
    const printWindow = window.open("", "_blank");
    printWindow.document.write(fullContent);
    printWindow.document.close();

    // Further modifications can be done here before printing
    // e.g., printWindow.document.body.style.backgroundColor = 'white';

    // Optionally, invoke the print dialog
    // printWindow.print();

    // Wait for the new window to load before printing
    printWindow.onload = function () {
      printWindow.focus();
      // newWindow.print();
      // newWindow.close();
    };
  }

  // Main function to capture and stitch content
  async function captureAndStitchContent() {
    await getContentSize();
    // const sections = await captureHTMLContent();
    // stitchHTMLSections(sections);
  }

  // Listen for a message from the background or popup script to start the process
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (
      request.action === "captureAndStitch" ||
      request.action === "printContent"
    ) {
      captureAndStitchContent().then(() => {
        sendResponse({ status: "Completed" });
      });
      return true; // Indicates that you wish to send a response asynchronously
    }
  });
})();
