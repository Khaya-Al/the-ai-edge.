export async function onRequest({request,env}) {
 if(request.method!=="GET") return Response.json({ok:false,error:"Method not allowed"},{status:405});
 return Response.json({ok:true,service:"The AI Edge API",aiConfigured:Boolean(env.AI),mode:env.AI?"workers-ai":"not-configured"},{headers:{"Cache-Control":"no-store"}});
}
