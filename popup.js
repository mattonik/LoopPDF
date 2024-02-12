document.getElementById("printButton").addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    tabId = tabs[0].id;

    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ["content.js"],
      },
      () => {
        // After injecting, send a message
        chrome.tabs.sendMessage(tabId, {
          action: "printContent",
          tabId: tabId,
        });
      }
    );

    // chrome.tabs.sendMessage(tabId, { action: "printContent", tabId: tabId });
  });
});
