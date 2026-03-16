import { NextRequest, NextResponse } from "next/server";
import type { AnalysisResult } from "@/types/resume";

// In production you would send a real email and attach the PDF.
// Here we just validate and return success; client can trigger a download with a blob PDF.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, acceptMarketing, analysis } = body as {
      email: string;
      acceptMarketing: boolean;
      analysis: AnalysisResult;
    };

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Require accepting terms/marketing for report delivery
    if (!acceptMarketing) {
      return NextResponse.json(
        { error: "Please accept the terms and marketing emails to receive the report." },
        { status: 400 }
      );
    }

    // Store email for "marketing" (in production: add to your CRM/email tool)
    // await addToMailingList(email);

    return NextResponse.json({
      success: true,
      message: "Report will be sent to your email.",
      downloadToken: "report-" + Date.now(), // optional: use to fetch PDF if generated server-side
    });
  } catch (e) {
    console.error("Report request error:", e);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
