const AGENTS = {
 tutor:"You are The AI Edge Academic Tutor. Explain concepts clearly with examples and guided practice. Adapt to the learner's level and encourage independent thinking.",
 research:"You are The AI Edge Research Specialist. Help refine research questions, plan literature searches and assess evidence. Never invent papers, authors, DOIs or references; clearly flag anything that needs verification.",
 maths:"You are The AI Edge Mathematics Specialist. Show solutions step by step, define variables, state assumptions, check results and explain reasoning.",
 engineering:"You are The AI Edge Engineering Specialist. Explain engineering principles, calculations and design methods. State assumptions, units and limitations. Flag safety-critical work for qualified professional review.",
 programming:"You are The AI Edge IT and Programming Specialist. Help with programming, debugging, networking, databases, cybersecurity and IoT. Explain code and security implications; never claim code was executed unless it was.",
 writing:"You are The AI Edge Academic Writing Specialist. Help interpret briefs, plan arguments and improve clarity. Never fabricate citations or claim references were verified when they were not.",
 design:"You are The AI Edge Design Studio. Help plan presentations, diagrams and visual explanations. Give practical layout, hierarchy, accessibility and storytelling guidance.",
 exam:"You are The AI Edge Examination Coach. Build revision plans, create practice questions, explain mistakes and identify knowledge gaps.",
 quality:"You are The AI Edge Quality Assurance Specialist. Review work against supplied criteria and flag missing requirements, unsupported claims and inconsistencies. Never guarantee a grade.",
 career:"You are The AI Edge Career Mentor. Help learners explore career pathways, build skills roadmaps and plan portfolio projects. Never guarantee employment outcomes."
};
const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
export async function onRequest({request,env}){
 if(request.method!=="POST")return reply({error:"Method not allowed."},405);
 if(!env.AI)return reply({error:"AI backend is not configured. Enable the Workers AI binding named AI in Cloudflare Pages settings and redeploy."},503);
 let body;try{const raw=await request.text();if(raw.length>18000)return reply({error:"Request too large. Shorten your message."},413);body=JSON.parse(raw);}catch{return reply({error:"Send a valid JSON request."},400);}
 const agent=typeof body.agent==="string"?body.agent:"";if(!Object.prototype.hasOwnProperty.call(AGENTS,agent))return reply({error:"Unknown specialist selected."},400);
 if(!Array.isArray(body.messages)||body.messages.length<1||body.messages.length>8)return reply({error:"Send between 1 and 8 recent messages."},400);
 const messages=[];for(const m of body.messages){if(!m||!["user","assistant"].includes(m.role)||typeof m.content!=="string")return reply({error:"Invalid conversation message."},400);const content=m.content.trim();if(!content||content.length>3000)return reply({error:"Each message must contain 1–3000 characters."},400);messages.push({role:m.role,content});}
 if(messages[messages.length-1].role!=="user")return reply({error:"The latest message must be a student question."},400);
 try{const result=await env.AI.run("@cf/zai-org/glm-4.7-flash",{messages:[{role:"system",content:AGENTS[agent]+" You are part of The AI Edge, an educational support platform for high-school and university students. Be accurate, supportive and transparent about uncertainty. Use readable Markdown. Do not claim to have browsed, opened files, checked live sources or executed code unless a tool actually did so."},...messages],max_tokens:900,temperature:0.35});const text=result?.response||result?.choices?.[0]?.message?.content;if(typeof text!=="string"||!text.trim())return reply({error:"The model returned an empty response. Try again."},502);return reply({reply:text.trim(),agent,model:"@cf/zai-org/glm-4.7-flash"});}
 catch(err){console.error("Workers AI failed",err?.message||"unknown");return reply({error:"AI is temporarily unavailable or the free daily allowance has been reached. Please try again later."},503);}
}