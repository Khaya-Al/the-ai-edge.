const $ = (id) => document.getElementById(id);
const providerNames = {openai:"ChatGPT / OpenAI",anthropic:"Claude / Anthropic",gemini:"Gemini / Google",perplexity:"Perplexity"};
let providerStatus = {};
async function loadProviders(){
  try{
    const response=await fetch("/api/providers",{headers:{Accept:"application/json"}});
    const data=await response.json();
    providerStatus=data.providers||{};
  }catch{providerStatus={};}
  document.querySelectorAll(".provider-chip").forEach(card=>{
    const key=card.dataset.provider,ready=providerStatus[key]===true;
    card.classList.toggle("ready",ready);card.classList.toggle("offline",!ready);
    const state=card.querySelector(".provider-state");if(state)state.textContent=ready?"Connected":"Not configured";
  });
}
function renderAnswers(items){
  const area=$("answerArea");
  area.innerHTML=items.map(item=>'<article class="answer-card"><h3>'+escapeHtml(providerNames[item.provider]||item.provider)+'</h3><p>'+escapeHtml(item.answer||item.error||"No response returned.")+'</p><div class="answer-meta">'+escapeHtml(item.model||"Provider response")+'</div></article>').join("");
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function askAI(){
  const question=$("questionInput").value.trim();if(!question)return;
  const selected=$("providerSelect").value,compare=$("compareToggle").checked,button=$("askButton");
  button.disabled=true;button.textContent="Working…";
  $("answerArea").innerHTML='<div class="answer-empty"><span>✳</span><b>Working on your request…</b><p>Sending your prompt to the configured provider. This may take a moment.</p></div>';
  try{
    const response=await fetch("/api/command",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({question,provider:selected,compare})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"The command centre is temporarily unavailable.");
    renderAnswers(data.results||[]);
  }catch(error){$("answerArea").innerHTML='<div class="answer-empty"><span>!</span><b>Request not completed</b><p>'+escapeHtml(error.message)+'</p></div>';}
  finally{button.disabled=false;button.innerHTML='Send to AI <span>→</span>';}
}
if($("askButton"))$("askButton").addEventListener("click",askAI);
if($("questionInput"))$("questionInput").addEventListener("input",()=>{$("questionCount").textContent=$("questionInput").value.length+" / 5000 · Your request is sent only to the selected provider(s).";});
if($("questionInput"))$("questionInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();askAI();}});
if($("buildPrompt"))$("buildPrompt").addEventListener("click",()=>{
 const goal=$("goalInput").value.trim(),context=$("contextInput").value.trim(),format=$("formatSelect").value;
 if(!goal){$("goalInput").focus();return;}
 const prompt="Act as a careful, knowledgeable assistant.\n\nOBJECTIVE\n"+goal+"\n\nCONTEXT AND AUDIENCE\n"+(context||"Ask clarifying questions if essential context is missing.")+"\n\nINSTRUCTIONS\n- State assumptions and distinguish facts from interpretation.\n- Do not invent sources, quotations, statistics or references.\n- Flag uncertainty and explain what should be independently verified.\n- Use clear, accurate language appropriate to the audience.\n\nREQUIRED OUTPUT\n"+format+"\n\nBefore finalising, check that the response directly addresses the objective and follows the requested format.";
 $("generatedPrompt").textContent=prompt;$("promptOutput").hidden=false;
});
if($("copyPrompt"))$("copyPrompt").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("generatedPrompt").textContent);$("copyPrompt").textContent="Copied";}catch{$("copyPrompt").textContent="Select and copy";}});
if($("mobileMenu"))$("mobileMenu").addEventListener("click",()=>$("nav").classList.toggle("open"));
document.querySelectorAll("#nav a").forEach(link=>link.addEventListener("click",()=>$("nav").classList.remove("open")));
if($("year"))$("year").textContent=new Date().getFullYear();
loadProviders();