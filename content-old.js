async function getContentReady(content) {
  content
    .querySelectorAll(
      "header, #Sidebar, #loopApp-menu9, aside, editor-card, .fui-Tooltip__content, data-tabster-dummy, div[role='toolbar'], #headerContainer button, .scriptor-block-ui-button"
    )
    .forEach((e) => {
      // e.style.display = "none"
      console.log("remove", e);
      e.remove();
    });

    console.log('cleaned content', content);
  content
    .querySelectorAll(".scriptor-table-of-contents-entry a")
    .forEach((e) => {
        e.removeAttribute("href");
        console.log('Remove href attribute', e);
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
  content.head.appendChild(style);

  console.log(content);
  return content;
}

async function printClonedContentToNewTab() {

    let scanvas = document.getElementsByClassName('scriptor-canvas')[0];
    // scanvas.scrollTo(0, scanvas.scrollHeight);
    console.log('scanvas', scanvas);
    // ".scriptor-canvas";
    setTimeout(async (e) => {

        let clonedContent = document.cloneNode(true); // Clone the document
    
      // Modify the cloned content as needed
      let processedContent = await getContentReady(clonedContent);
    
      let newWindow = window.open("", "_blank");
      newWindow.document.write(processedContent.documentElement.innerHTML);
      newWindow.document.close();
    
      // Wait for the new window to load before printing
      newWindow.onload = function () {
        newWindow.focus();
        // newWindow.print();
        // newWindow.close();
      };
    }, 400);
}


async function printClonedContent() {
  let originalContent = document.body.innerHTML; // Save original content
  console.log('original', originalContent);
  let clonedContent = document.cloneNode(true); // Clone the document

  console.log('Clone content', originalContent === clonedContent, clonedContent);
  // Modify the cloned content as needed
  let processedContent = await getContentReady(clonedContent);
  console.log('content is ready', clonedContent === processedContent, processedContent);
  clonedContent = processedContent;
  console.log("innerHtml", clonedContent);

  document.body.innerHTML = clonedContent.documentElement; // Replace current content with modified clone

  setTimeout((e) => {
      
      window.print(); // Open print dialog
  }, 300);

//   document.body.innerHTML = originalContent; // Restore original content
}


// function printClonedContent() {
//   let iframe = document.createElement("iframe");
//   iframe.style.position = "absolute";
//   iframe.style.width = "0";
//   iframe.style.height = "0";
//   iframe.style.border = "0";
//   document.body.appendChild(iframe);

//   let clonedContent = document.cloneNode(true); // Clone the document
//   console.log('clonedContent', clonedContent);
//   // Modify the cloned content as needed
//   let processedContent = getContentReady(clonedContent);
//   console.log('content is ready!', clonedContent === processedContent, processedContent);
//   clonedContent = processedContent;

//   // You need to write the cloned content to the iframe
//   iframe.contentDocument.write(clonedContent.documentElement.innerHTML);
//   iframe.contentDocument.close();

//   // Print from the iframe
//   iframe.contentWindow.focus();
//   iframe.contentWindow.print();

//   // Remove the iframe after printing
//   iframe.contentWindow.onafterprint = function () {
//     document.body.removeChild(iframe);
//   };
// }


async function captureHTMLContent() {
  const sections = [];
  const originalPosition = window.scrollY;
  const scrollHeight = document.body.scrollHeight;
  const viewportHeight = window.innerHeight;

  for (let yPos = 0; yPos < scrollHeight; yPos += viewportHeight) {
    window.scrollTo(0, yPos);
    // Wait for the dynamic content to load
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Adjust timing as necessary

    // Capture the currently visible content
    const visibleContent = document.querySelector(".scriptor-canvas").innerHTML; // Adjust selector as needed
    sections.push(visibleContent);
  }

  // Return to the original scroll position
  window.scrollTo(0, originalPosition);

  return sections;
}

async function stitchHTMLSections(sections) {
  const fullContent = sections.join(""); // Simple concatenation; might need refinement

  let processedContent = await getContentReady(fullContent);

  const printWindow = window.open("", "_blank");
  printWindow.document.write(processedContent.documentElement.innerHTML);
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



chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "printContent") {
    setTimeout((e) => {
        // getContentReady();
        // printClonedContent();
        printClonedContentToNewTab();
        // window.print();
    },1000);

  }
});
