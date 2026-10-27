# Sentinel Security Journal

## 2025-05-18 - Mini App Template DOM-based XSS
**Vulnerability:** User-controlled input strings (`h.title`) in `templates/react-mini-app/index.html` were interpolated directly into `item.innerHTML` without escaping, exposing starter apps to DOM XSS.
**Learning:** Mini app templates and starter HTML boilerplate directly rendered user input into DOM nodes using ES6 template literals inside `innerHTML`.
**Prevention:** Always escape user-provided strings with HTML entity encoding before interpolating into `innerHTML`, or construct DOM nodes using `.textContent` / DOM APIs or React JSX bindings.
