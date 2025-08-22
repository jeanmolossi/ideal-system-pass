// Content script to detect login forms, handle autofill, and save credentials securely.
// This script listens for messages from the background script and interacts with the page
// to autofill credentials after explicit user authorization. It also exposes an option to
// save newly entered credentials.

interface Credentials {
  username: string;
  password: string;
}

// Basic sanitization to mitigate XSS by stripping angle brackets.
const sanitize = (value: string): string => value.replace(/[<>]/g, "");

// Find the first form that contains a password input.
function findLoginForm(): HTMLFormElement | null {
  const forms = Array.from(document.forms) as HTMLFormElement[];
  return forms.find((form) => form.querySelector('input[type="password"]')) || null;
}

// Attempt to fill the login form with provided credentials.
function fillCredentials(creds: Credentials): void {
  const form = findLoginForm();
  if (!form) return;

  const userField = (form.querySelector('input[type="text"], input[type="email"], input[name*="user" i], input[name*="email" i]') as HTMLInputElement) || null;
  const passField = form.querySelector('input[type="password"]') as HTMLInputElement | null;
  if (userField) userField.value = sanitize(creds.username);
  if (passField) passField.value = sanitize(creds.password);
}

// Display a save button near the password field when new credentials are entered.
function setupSaveButton(): void {
  const form = findLoginForm();
  if (!form) return;

  const userField = form.querySelector('input[type="text"], input[type="email"], input[name*="user" i], input[name*="email" i]') as HTMLInputElement | null;
  const passField = form.querySelector('input[type="password"]') as HTMLInputElement | null;
  if (!userField || !passField) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = '💾';
  button.title = 'Save credentials';
  button.style.marginLeft = '4px';
  button.style.cursor = 'pointer';
  button.style.display = 'none';

  const showButtonIfFilled = (): void => {
    if (userField.value && passField.value) {
      button.style.display = 'inline';
    } else {
      button.style.display = 'none';
    }
  };

  userField.addEventListener('input', showButtonIfFilled);
  passField.addEventListener('input', showButtonIfFilled);

  button.addEventListener('click', () => {
    const credentials: Credentials = {
      username: sanitize(userField.value),
      password: sanitize(passField.value),
    };
    chrome.runtime.sendMessage({
      type: 'saveCredentials',
      origin: window.location.origin,
      credentials,
    });
    button.style.display = 'none';
  });

  passField.parentElement?.appendChild(button);
}

// Listen for messages from the background script while checking sender origin to mitigate CSRF.
chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.id !== chrome.runtime.id) {
    console.warn('Blocked message from unknown sender', sender);
    return;
  }

  if (message.type === 'provideCredentials' && message.authorized) {
    fillCredentials(message.credentials as Credentials);
  }
});

// Request stored credentials for the current origin once the DOM is ready.
window.addEventListener('DOMContentLoaded', () => {
  setupSaveButton();
  chrome.runtime.sendMessage({
    type: 'requestCredentials',
    origin: window.location.origin,
  });
});

export {}; // Ensure this file is treated as a module.
