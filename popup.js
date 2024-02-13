const printButton = document.getElementById("printButton");

if (!window.buttonClicked) {
  window.buttonClicked = true;
  printButton.addEventListener("click", function (event) {
    printButton.disabled = true;
    (async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "printContent"
      });
      // do something with response here, not outside the function
      console.log(response);
    })();
    event.stopPropagation;
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.status === "printDone") {
    console.log('print done');
    window.buttonClicked = false;
    printButton.disabled = false;
  }
});
