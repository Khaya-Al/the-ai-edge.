const agents = {
  tutor: { icon: "✳", label: "A01 / LEARN", title: "Academic Tutor", description: "Make difficult ideas easier to understand with clear explanations, examples and guided practice.", prompt: "Explain a difficult concept to me step by step, then test my understanding." },
  research: { icon: "⌕", label: "A02 / DISCOVER", title: "Research Specialist", description: "Explore research questions, evidence, scholarly literature and the foundations of a strong investigation.", prompt: "Help me turn my topic into a focused research question and plan." },
  maths: { icon: "∑", label: "A03 / SOLVE", title: "Mathematics", description: "Work through mathematical problems with structured reasoning, clear steps and checks.", prompt: "Show me how to approach this equation and explain each step." },
  engineering: { icon: "⌬", label: "A04 / DESIGN", title: "Engineering", description: "Explore engineering principles, calculations, design approaches and practical problem-solving.", prompt: "Help me structure an engineering design problem." },
  programming: { icon: "⌘", label: "A05 / BUILD", title: "IT & Programming", description: "Develop software, debug code and understand computing, networks, databases and IoT.", prompt: "Help me debug a program and explain why the error occurs." },
  writing: { icon: "¶", label: "A06 / COMMUNICATE", title: "Academic Writing", description: "Organise academic arguments, interpret briefs and improve clarity, structure and referencing.", prompt: "Help me create a clear structure for my assignment." },
  design: { icon: "◈", label: "A07 / CREATE", title: "Design Studio", description: "Plan presentations, diagrams, visual explanations and communication materials.", prompt: "Help me plan a presentation that explains a technical idea." },
  exam: { icon: "◷", label: "A08 / PREPARE", title: "Exam Coach", description: "Build revision plans, practise retrieval and identify topics that need more attention.", prompt: "Create a practical revision strategy for my upcoming exam." },
  quality: { icon: "✓", label: "A09 / REVIEW", title: "Quality Assurance", description: "Review work against a rubric, check completeness and flag unsupported claims or inconsistencies.", prompt: "Review my assignment against its marking rubric." },
  career: { icon: "↗", label: "A10 / GROW", title: "Career Mentor", description: "Explore career directions, build industry skills and plan projects that demonstrate your capability.", prompt: "Help me create a skills roadmap for a technology career." }
};

const $ = (id) => document.getElementById(id);
let selected = "tutor";
let conversation = [];
let sending = false;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function renderConversation() {
  const box = $("demoResponse");
  if (!box) return;
  const specialist = agents[selected];
  box.innerHTML = '<span class="response-label">CONVERSATION · ' + escapeHtml(specialist.title.toUpperCase()) + '</span>' +
    (conversation.length ? conversation.map((message) =>
      '<div class="chat-message ' + (message.role === "user" ? "user" : "assistant") + '">' +
      '<strong>' + (message.role === "user" ? "YOU" : escapeHtml(specialist.title.toUpperCase())) + '</strong>' +
      '<p>' + escapeHtml(message.content) + '</p></div>'
    ).join("") : '<p>Your workspace is ready. Ask a question to start working with this specialist.</p>');
  box.scrollTop = box.scrollHeight;
}

function selectAgent(key) {
  if (!agents[key]) return;
  selected = key;
  conversation = [];
  document.querySelectorAll(".agent-card").forEach((card) => {
    const active = card.dataset.agent === key;
    card.classList.toggle("active", active);
    card.setAttribute("aria-pressed", String(active));
  });
  const agent = agents[key];
  $("demoIcon").textContent = agent.icon;
  $("demoLabel").textContent = agent.label;
  $("demoTitle").textContent = agent.title;
  $("demoDescription").textContent = agent.description;
  $("samplePrompt").textContent = agent.prompt;
  $("chatInput").placeholder = "Ask " + agent.title + " a question...";
  renderConversation();
}

async function sendMessage(event) {
  if (event) event.preventDefault();
  const input = $("chatInput");
  const question = input.value.trim();
  if (!question || sending) return;

  sending = true;
  conversation.push({ role: "user", content: question });
  input.value = "";
  $("charCount").textContent = "0 / 3000";
  $("sendButton").disabled = true;
  $("sendButton").textContent = "Thinking…";
  renderConversation();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ agent: selected, messages: conversation.slice(-8) })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The AI service returned an error (" + response.status + ").");
    if (!data.reply) throw new Error("The AI service returned an empty response.");
    conversation.push({ role: "assistant", content: data.reply });
  } catch (error) {
    conversation.push({
      role: "assistant",
      content: "I couldn't complete that request. " + (error.message || "Please try again.")
    });
  } finally {
    sending = false;
    $("sendButton").disabled = false;
    $("sendButton").innerHTML = 'Send question <span>→</span>';
    renderConversation();
    input.focus();
  }
}

document.querySelectorAll(".agent-card").forEach((card) => {
  card.setAttribute("aria-pressed", String(card.dataset.agent === selected));
  card.addEventListener("click", () => selectAgent(card.dataset.agent));
});

if ($("samplePrompt")) {
  $("samplePrompt").addEventListener("click", () => {
    $("chatInput").value = agents[selected].prompt;
    $("charCount").textContent = $("chatInput").value.length + " / 3000";
    $("chatInput").focus();
  });
  $("samplePrompt").addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      $("samplePrompt").click();
    }
  });
}

if ($("chatForm")) $("chatForm").addEventListener("submit", sendMessage);
if ($("chatInput")) {
  $("chatInput").addEventListener("input", () => {
    $("charCount").textContent = $("chatInput").value.length + " / 3000";
  });
  $("chatInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      $("chatForm").requestSubmit();
    }
  });
}

if ($("mobileMenu")) $("mobileMenu").addEventListener("click", () => $("nav").classList.toggle("open"));
document.querySelectorAll("#nav a").forEach((link) => link.addEventListener("click", () => $("nav").classList.remove("open")));
if ($("year")) $("year").textContent = new Date().getFullYear();
renderConversation();
