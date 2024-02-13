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

  function replaceIframesWithUrls(container) {
    const iframes = container.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      const iframeUrl = iframe.src;
      if (iframeUrl) {
        const placeholder = document.createElement("div");
        placeholder.textContent = `Embedded content: ${iframeUrl}`;
        placeholder.style.border = "1px solid #ccc";
        placeholder.style.padding = "10px";
        placeholder.style.marginBottom = "10px";
        placeholder.style.backgroundColor = "#f9f9f9";
        placeholder.style.borderRadius = "8px";

        // Optionally, add additional styles to the placeholder to make it visually distinct

        iframe.parentNode.replaceChild(placeholder, iframe);
      } else {
        iframe.parentNode.remove();
      }
    });
    return container;
  }

  function waitForImagesToLoad(images) {
    const imageLoadPromises = Array.from(images).map((image) => {
      return new Promise((resolve, reject) => {
        // If the image is already loaded
        if (image.complete && image.naturalHeight !== 0) {
          resolve();
        } else {
          // Listen for the load event
          image.onload = () => resolve();
          image.onerror = () =>
            reject(new Error(`Failed to load image: ${image.src}`));
        }
      });
    });

    return Promise.all(imageLoadPromises);
  }

  async function getContentReady(content, title) {
    const _html = document.createElement("html");
    const _head = document.createElement("head");
    const _body = document.createElement("body");
    const _title = document.createElement("title");

    let _doc = document.createElement("div");
    
    _doc.insertAdjacentHTML("beforeend", content);
    // console.log("getContentReady", content, _doc);
    _doc
      .querySelectorAll(
        "header, #Sidebar, #loopApp-menu9, aside, editor-card, .fui-Tooltip__content, data-tabster-dummy, div[role='toolbar'], #headerContainer button, .scriptor-block-ui-button, .scriptor-highlightWrapper, .conversa-comment, .conversa-focus-wrapper"
      )
      .forEach((e) => {
        // e.style.display = "none"
        console.log("remove", e);
        e.remove();
      });

    // console.log("cleaned content", _doc);
    _doc
      .querySelectorAll(".scriptor-table-of-contents-entry a")
      .forEach((e) => {
        e.removeAttribute("href");
        // console.log("Remove href attribute", e);
      });

    // Apply any additional styling necessary for print layout
    let style = document.createElement("style");
    style.innerHTML = `
      body { margin: 20px; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
      h1 { font-size: 32px; }
      a:link, a:active, a:link:hover, a:visited { text-decoration: none; color: inherit; }
      a:link:after { content: "(" attr(href) ")"; text-decoration: underline; display: inline-block; margin: 0 4px;}
      div[role="application"] { display: block !important; height: 100% !important; }
      div[role="application"] > div {position: static !important;}
      #headerContainer > div > div > button { display: none !importanr; }
      #headerContainer .scriptor-instance-1 { top: 0 !important; }
      .scriptor-pageFrameContainer .scriptor-pageFrame,
      .scriptor-pageContainer .scriptor-pageFrame {
        max-width: 100% !important;
      }
      .scriptor-inline .scriptor-hosting-element.scriptor-component-inline {
        display: inline-block;
      }
      .scriptor-inline .scriptor-hosting-element.scriptor-component-inline img {
        width: 24px;
        margin-right: 16px;
      }
      .scriptor-inline .scriptor-hosting-element.scriptor-component-inline a {
        max-width: 80vw;
        overflow: hidden;
        text-overflow: ellipsis;
        display: inline-block;
      }
      .scriptor-inline .scriptor-hosting-element.scriptor-component-inline .fui-FluentProvider > div > div > div {
        display: inline-flex;
        flex-direction: row;
        padding: 4px 10px;
        border: 1px solid #ccc;
        border-radius: 8px;
        margin-bottom: 10px;
        background: #f9f9f9;
      }
      .scriptor-table-of-contents-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .scriptor-inline .scriptor-hosting-element.scriptor-component-block {
        padding: 4px 10px;
        border: 1px solid #ccc;
        border-radius: 8px;
        margin-bottom: 10px;
        background: #f9f9f9;
      }
    `;
  
    _doc = replaceIframesWithUrls(_doc);

    _title.insertAdjacentText('beforeend', title);
    const _titleH1 = document.createElement('h1');
    _titleH1.innerText = title;
    _head.appendChild(_title);
    _head.appendChild(style);
    _body.appendChild(_titleH1);
    _body.appendChild(_doc);
    _html.appendChild(_head);
    _html.appendChild(_body);

    // console.log(_html);
    return _html;
  }

  async function getContentSize() {
    let totalHeight = 0;
    document
      .querySelectorAll(".scriptor-canvas .scriptor-pageContainer")
      .forEach((pc) => {
        console.log("pageContainer", pc);

        pc.querySelectorAll(".scriptor-pageFrameContainer").forEach((e) => {
        //   console.log("e style", e.offsetHeight);
          totalHeight += e.offsetHeight;
        //   console.log("New total Height", totalHeight);
        });
      });

    // console.log("Total Height", totalHeight);
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
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Ensure we capture the bottom of the content
    scrollableElement.scrollTop = scrollableElement.scrollHeight;
    await new Promise((resolve) => setTimeout(resolve, 500));
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
        //   console.log("isIntersecting", element, entry);
        //   console.log("innerHTML", element.innerHTML);
          while (
            element &&
            element !== document.body &&
            element.innerHTML === ""
          ) {
            // console.log("wait for innerHTML to have content", element);
            await new Promise((resolve) => setTimeout(resolve, 600));
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

    // console.log("allContent", allContent);

    // .scriptor-canvas .scriptor-pageContainer .scriptor-pageFrameContainer
    document
      //   .querySelectorAll(".scriptor-pageFrameContainer .scriptor-pageFrame")
      .querySelectorAll(
        ".scriptor-canvas .scriptor-pageContainer .scriptor-pageFrameContainer"
      )
      .forEach((element) => {
        // console.log("setup observer", element);
        observer.observe(element);
      });
  }

  // Main function to orchestrate the scrolling and content capturing
  async function captureAndDisplayContent() {
    setupObserver();
    // const scrollableElements = findScrollableElements();
    // console.log("Scrollable elements:", scrollableElements);

    await scrollAndCapture();

    // console.log("capture", allContent);

    // Create a new tab with the captured content
    const capturedHTML = allContent.join("");
    const title = document.title;
    const processedContent = await getContentReady(capturedHTML, title);
    // console.log("Processed Content", processedContent);
    const newWindow = window.open(" ", "_blank");
    newWindow.document.write(processedContent.innerHTML);
    newWindow.focus();
    // await new Promise((resolve) => setTimeout(resolve, 100));
    const images = newWindow.document.querySelectorAll('img');
    waitForImagesToLoad(images)
      .then(() => {
        // All images are loaded, proceed with printing
        newWindow.print();
        newWindow.close();
      })
      .catch((error) => {
        console.error(
          "Error loading some images, proceeding with print anyway.",
          error
        );
        newWindow.print(); // Optionally, proceed with printing even if some images failed to load
        newWindow.close();
      });

    return true;
  }

  // Listen for a message from the background or popup script to start the process
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (
      request.action === "captureAndStitch" ||
      request.action === "printContent"
    ) {
    //   removeExternalContent();
      captureAndDisplayContent().then(() => {
        sendResponse({ status: "Completed" });
      });
      return true; // Indicates that you wish to send a response asynchronously
    }
  });
})();
