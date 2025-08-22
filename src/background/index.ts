/// <reference types="chrome" />
// Background service worker mediating credential storage and retrieval
// and relaying messages between extension components.

// Keep track of open ports (e.g., from the popup)
const ports = new Set<chrome.runtime.Port>();

// Handle long‑lived connections
chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
  ports.add(port);
  port.onDisconnect.addListener(() => ports.delete(port));

  port.onMessage.addListener((msg) => {
    if (msg.type === 'popupInit') {
      port.postMessage({ type: 'ack', message: 'Popup connected' });
    }
  });
});

// Relay credential requests and save events from content scripts
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'requestCredentials' && sender.tab?.id !== undefined) {
    chrome.storage.local.get([message.origin]).then((res) => {
      const creds = res[message.origin];
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'provideCredentials',
        authorized: Boolean(creds),
        credentials: creds,
      });
    });
  }

  if (message.type === 'saveCredentials' && message.origin && message.credentials) {
    chrome.storage.local.set({ [message.origin]: message.credentials }).then(() => {
      // Notify any connected popup ports that a credential was saved
      ports.forEach((p) => p.postMessage({ type: 'credentialsSaved', origin: message.origin }));
    });
  }
});

// Extension lifecycle listeners
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated', details);
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
});

// Fired when the service worker is about to shut down
chrome.runtime.onSuspend?.addListener(() => {
  console.log('Extension suspended');
});

export {}; // Ensure this file is treated as a module.

