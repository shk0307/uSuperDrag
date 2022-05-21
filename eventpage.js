chrome.runtime.onMessage.addListener(message => {
  chrome.tabs.query({
	  active: true,
	  currentWindow: true}, tabs => {
    const activeTab = tabs[0];

   chrome.storage.sync.get(['enableOpenTabInBg'], function(result) {
 	  if (result.enableOpenTabInBg === true){
	  var tabMode = false
	  } else {
		 var tabMode = true
	  };

    chrome.tabs.create({
		url: message,
		index: activeTab.index + 1,
		openerTabId: activeTab.id,
		active: tabMode,});
    });
  });
});