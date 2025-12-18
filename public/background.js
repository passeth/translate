chrome.action.onClicked.addListener((tab) => {
    // Opening side panel on action click
    chrome.sidePanel.open({ windowId: tab.windowId });
});
