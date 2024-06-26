
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai";

import { increaseApiLimit,checkApiLimit } from "@/lib/api-limit";
import { subscriptionCheck } from "@/lib/subscription";


const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});

const openai = new OpenAIApi(configuration);

export async function POST(
  req: Request
) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { prompt,amount=1,resolution="512x512"  } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!configuration.apiKey) {
      return new NextResponse("OpenAI API Key not configured.", { status: 500 });
    }

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    if (!amount) {
      return new NextResponse("Amount is required", { status: 400 });
    }

    if (!resolution) {
      return new NextResponse("Resolution is required", { status: 400 });
    }

    const date = new Date();

    const freeTrial = await checkApiLimit();
    const isMember = await subscriptionCheck();
    if(freeTrial !== undefined && freeTrial == false && isMember!==undefined && isMember==false ) {
      return new NextResponse("Free trials are done,please check our subscription plans", { status: 403 });
    }
    

    const response = await openai.createImage({
     prompt,
     n: parseInt(amount,10),
     size: resolution,
    
    });

    if(isMember==false){
      await increaseApiLimit();
    }

    return NextResponse.json(response.data.data);
  } catch (error) {
    console.log('[Image_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};