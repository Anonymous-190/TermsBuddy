document.getElementById("extract").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript(
  {
  target: { tabId: tab.id },
  func: extractPolicyText,
  },
  async (results) => {
  const output = document.getElementById("output");
  if (!results || !results[0] || !results[0].result) {
    output.textContent = "❌ No privacy-related content found.";
    return;
  }

  const extracted = results[0].result;
  output.textContent = "⏳ Analyzing policy with AI...";

  try {
    const response = await fetch("http://localhost:3000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: extracted })
    });

    if (!response.ok) throw new Error("Server error");

    const data = await response.json();
    output.textContent = "✅ Summary:\n\n" + data.result;
  } catch (err) {
    console.error(err);
    output.textContent = "❌ Error contacting backend.";
  }
}
);
});

document.getElementById("copyBtn").addEventListener("click", () => {
const text = document.getElementById("output").textContent;
if (!text) return;

navigator.clipboard.writeText(text).then(() => {
alert("✅ Text copied to clipboard!");
}).catch((err) => {
console.error("Failed to copy:", err);
});
});

// Function injected into web page
function extractPolicyText() {
const keywords = ["privacy", "policy", "terms", "service", "data", "consent"];
const matches = [];

const elements = document.querySelectorAll("p, div, section, article");

elements.forEach((el) => {
const text = el.innerText.trim();
const lower = text.toLowerCase();
if (text.length > 80 && keywords.some((word) => lower.includes(word))) {
  matches.push(text);
}
});

return matches.join("\n\n"); // Return full content without slicing
}