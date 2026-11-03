const keys={openai:"OPENAI_API_KEY",anthropic:"ANTHROPIC_API_KEY",gemini:"GEMINI_API_KEY",perplexity:"PERPLEXITY_API_KEY"};
export async function onRequest({request,env}){
 if(request.method!=="GET")return new Response(JSON.stringify({error:"Method not allowed."}),{status:405,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
 const providers={};for(const [name,key] of Object.entries(keys))providers[name]=Boolean(env[key]);
 return new Response(JSON.stringify({providers}),{headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
}