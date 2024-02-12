(async () => {
  const allContent = [];

  function removeExternalContent() {
    document
      .querySelectorAll(".scriptor-hosting-element")
      .forEach((element) => {
        element.remove();
      });
  }

  function isScrollable(element) {
    const hasScrollableContent = element.scrollHeight > element.clientHeight;
    const overflowYStyle = window.getComputedStyle(element).overflowY;
    const isOverflowVisible =
      overflowYStyle === "auto" || overflowYStyle === "scroll";

    return hasScrollableContent && isOverflowVisible;
  }

  function findScrollableElements() {
    const allElements = document.querySelectorAll("*");
    const scrollableElements = Array.from(allElements).filter(isScrollable);

    return scrollableElements;
  }

  async function getContentReady(content) {
    let _doc = document.createElement('div');
    _doc.insertAdjacentHTML('beforeend', content);
    console.log('getContentReady', content, _doc);
    _doc
      .querySelectorAll(
        "header, #Sidebar, #loopApp-menu9, aside, editor-card, .fui-Tooltip__content, data-tabster-dummy, div[role='toolbar'], #headerContainer button, .scriptor-block-ui-button"
      )
      .forEach((e) => {
        // e.style.display = "none"
        console.log("remove", e);
        e.remove();
      });

    console.log("cleaned content", _doc);
    _doc
      .querySelectorAll(".scriptor-table-of-contents-entry a")
      .forEach((e) => {
        e.removeAttribute("href");
        console.log("Remove href attribute", e);
      });

    // Apply any additional styling necessary for print layout
    let style = document.createElement("style");
    style.innerHTML = `
      div[role="application"] { display: block !important; height: 100% !important; }
      div[role="application"] > div {position: static !important;}
      #headerContainer > div > div > button { display: none !importanr; }
      #headerContainer .scriptor-instance-1 { top: 0 !important; }
      .scriptor-pageFrameContainer .scriptor-pageFrame,
      .scriptor-pageContainer .scriptor-pageFrame {
        max-width: 100% !important;
      }
    `;
    // _doc.head.appendChild(style);

    console.log(_doc);
    return _doc;
  }

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
        });
      });

    console.log("Sections", sections);
    console.log("Total Height", totalHeight);
    return totalHeight;
  }


  // Scrolls through the page and captures content of each visible .scriptor-pageFrameContainer .scriptor-pageFrame
  async function scrollAndCapture() {
    // .scriptor-canvas.scriptor-styled-scrollbar
    const scrollHeight = await getContentSize();
    // Selector for the custom scrollable element
    const scrollableSelector = ".scriptor-canvas.scriptor-styled-scrollbar"; // Update this selector as needed
    const scrollableElement = document.querySelector(scrollableSelector);

    if (!scrollableElement) {
      console.error("Scrollable element not found:", scrollableSelector);
      return;
    }

    // const scrollHeight = scrollableElement.scrollHeight;
    const viewportHeight = scrollableElement.clientHeight;
    // const viewportHeight = 200;
    let lastScrollTop = -1;

    console.log(
      "Starting scrollAndCapture",
      scrollHeight,
      viewportHeight,
      lastScrollTop
    );

    scrollableElement.scrollTop = 0;

    while (
      scrollableElement.scrollTop < scrollHeight &&
      scrollableElement.scrollTop !== lastScrollTop
    ) {
      lastScrollTop = scrollableElement.scrollTop;
      scrollableElement.scrollTop += viewportHeight;
      // Wait for any dynamic content to load
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Ensure we capture the bottom of the content
    scrollableElement.scrollTop = scrollableElement.scrollHeight;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Setup IntersectionObserver to observe .scriptor-pageFrameContainer .scriptor-pageFrame elements
  function setupObserver() {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
        // console.log('observer entries', entries);
      entries.forEach(async (entry) => {
        // console.log("observe entry", entry);
        if (entry.isIntersecting) {
          let element = entry.target;
          console.log("isIntersecting", element, entry);
          console.log('innerHTML', element.innerHTML);
          while (element && element !== document.body && element.innerHTML === '') {
              console.log('wait for innerHTML to have content', element);
            await new Promise((resolve) => setTimeout(resolve, 300));
            // element = element.parentElement;
            // console.log('element while after', element);
          }
          const htmlContent = element.innerHTML;
          if (!allContent.includes(htmlContent)) {
            // Avoid duplicates
            allContent.push(htmlContent);
          }

          observer.unobserve(entry.target); // Stop observing the current target
        }
      });
    }, observerOptions);

    console.log('allContent', allContent);

    // .scriptor-canvas .scriptor-pageContainer .scriptor-pageFrameContainer
    document
      //   .querySelectorAll(".scriptor-pageFrameContainer .scriptor-pageFrame")
      .querySelectorAll(
        ".scriptor-canvas .scriptor-pageContainer .scriptor-pageFrameContainer"
      )
      .forEach((element) => {
        console.log('setup observer', element);
        observer.observe(element);
      });
  }

  // Main function to orchestrate the scrolling and content capturing
  async function captureAndDisplayContent() {
    setupObserver();
    const scrollableElements = findScrollableElements();
    console.log("Scrollable elements:", scrollableElements);

    await scrollAndCapture();

    console.log('capture', allContent);

    // Create a new tab with the captured content
    const capturedHTML = allContent.join("");
    const processedContent = await getContentReady(capturedHTML);
    const newWindow = window.open("", "_blank");
    newWindow.document.write(processedContent.innerHTML);
    newWindow.document.close();
    return true;
  }

  
  // Listen for a message from the background or popup script to start the process
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (
      request.action === "captureAndStitch" ||
      request.action === "printContent"
    ) {
        removeExternalContent();
      captureAndDisplayContent().then(() => {
        sendResponse({ status: "Completed" });
      });
      return true; // Indicates that you wish to send a response asynchronously
    }
  });
})();
