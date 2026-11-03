const PROVIDERS=["openai","anthropic","gemini","perplexity"];
const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
const models={openai:"gpt-4.1-mini",anthropic:"claude-sonnet-4-5-20250929",gemini:"gemini-2.5-flash",perplexity:"sonar"};
async function runProvider(provider,question,env){
 const model=models[provider];let url,requestHeaders,body;
 if(provider==="openai"){
  if(!env.OPENAI_API_KEY)throw new Error("OpenAI is not configured.");
  url="https://api.openai.com/v1/responses";requestHeaders={"Authorization":"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"};
  body={model,input:question,max_output_tokens:1200};
 }else if(provider==="anthropic"){
  if(!env.ANTHROPIC_API_KEY)throw new Error("Claude is not configured.");
  url="https://api.anthropic.com/v1/messages";requestHeaders={"x-api-key":env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","Content-Type":"application/json"};
  body={model,max_tokens:1200,messages:[{role:"user",content:question}]};
 }else if(provider==="gemini"){
  if(!env.GEMINI_API_KEY)throw new Error("Gemini is not configured.");
  url="https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent?key="+encodeURIComponent(env.GEMINI_API_KEY);requestHeaders={"Content-Type":"application/json"};
  body={contents:[{parts:[{text:question}]}],generationConfig:{maxOutputTokens:1200}};
 }else{
  if(!env.PERPLEXITY_API_KEY)throw new Error("Perplexity is not configured.");
  url="https://api.perplexity.ai/chat/completions";requestHeaders={"Authorization":"Bearer "+env.PERPLEXITY_API_KEY,"Content-Type":"application/json"};
  body={model,messages:[{role:"user",content:question}],max_tokens:1200};
 }
 const response=await fetch(url,{method:"POST",headers:requestHeaders,body:JSON.stringify(body)});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){console.error("Provider request failed",provider,response.status);throw new Error(provider+" request failed ("+response.status+"). Check provider billing, model access and API configuration.");}
 let answer="";
 if(provider==="openai")answer=data.output?.flatMap(item=>item.content||[]).filter(part=>part.type==="output_text").map(part=>part.text).join("\n")||data.output_text||"";
 if(provider==="anthropic")answer=(data.content||[]).filter(part=>part.type==="text").map(part=>part.text).join("\n");
 if(provider==="gemini")answer=(data.candidates?.[0]?.content?.parts||[]).map(part=>part.text||"").join("\n");
 if(provider==="perplexity")answer=data.choices?.[0]?.message?.content||"";
 if(!answer.trim())throw new Error(provider+" returned no readable text.");
 return {provider,model,answer:answer.trim()};
}
export async function onRequest({request,env}){
 if(request.method!=="POST")return reply({error:"Method not allowed."},405);
 let body;try{const raw=await request.text();if(raw.length>12000)return reply({error:"Request too large."},413);body=JSON.parse(raw);}catch{return reply({error:"Send a valid JSON request."},400);}
 const question=typeof body.question==="string"?body.question.trim():"";
 if(!question||question.length>5000)return reply({error:"Enter a question between 1 and 5,000 characters."},400);
 const selected=body.provider||"auto";if(selected!=="auto"&&!PROVIDERS.includes(selected))return reply({error:"Unknown provider selected."},400);
 const configured=PROVIDERS.filter(name=>Boolean(env[({openai:"OPENAI_API_KEY",anthropic:"ANTHROPIC_API_KEY",gemini:"GEMINI_API_KEY",perplexity:"PERPLEXITY_API_KEY"})[name]]));
 const targets=body.compare===true?configured:(selected==="auto"?(configured.length?[configured[0]]:[]):(configured.includes(selected)?[selected]:[]));
 if(!targets.length)return reply({error:selected==="auto"?"No AI providers are connected yet. The platform owner must add provider API keys as Cloudflare Pages secrets before AI requests can run.":"This provider is not configured yet. Choose an available provider or try again later."},503);
 const settled=await Promise.allSettled(targets.map(provider=>runProvider(provider,question,env)));
 const results=settled.map((result,index)=>result.status==="fulfilled"?result.value:{provider:targets[index],error:result.reason?.message||"Provider request failed."});
 const success=results.some(item=>item.answer);
 if(!success)return reply({error:results.map(item=>item.error).filter(Boolean).join(" ")||"All providers failed."},502);
 return reply({results,mode:body.compare===true?"comparison":"single"});
}