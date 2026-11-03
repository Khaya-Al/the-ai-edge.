export async function onRequest({request,env}) {
 if(request.method!=="GET") return Response.json({ok:false,error:"Method not allowed"},{status:405});
 const aiConfigured=Boolean(env.AI),databaseConfigured=Boolean(env.DB),fileStorageConfigured=Boolean(env.FILES);
 return Response.json({ok:true,service:"The AI Edge API",aiConfigured,databaseConfigured,fileStorageConfigured,ready:aiConfigured&&databaseConfigured&&fileStorageConfigured,mode:aiConfigured?"workers-ai":"not-configured"},{headers:{"Cache-Control":"no-store"}});
}
