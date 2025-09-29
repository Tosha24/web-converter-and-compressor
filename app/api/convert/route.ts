import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import JSZip from "jszip";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const quality = parseInt(formData.get("quality") as string) || 80;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const zip = new JSZip();
    const convertedFiles: { name: string; buffer: Buffer }[] = [];

    // Process each file
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Convert to WebP with specified quality
      const webpBuffer = await sharp(buffer).webp({ quality }).toBuffer();

      // Generate new filename
      const originalName = file.name;
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
      const webpName = `${nameWithoutExt}.webp`;

      // Add to zip
      zip.file(webpName, webpBuffer);

      // Store for individual download
      convertedFiles.push({
        name: webpName,
        buffer: webpBuffer,
      });
    }

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Return both individual files and zip
    return NextResponse.json({
      success: true,
      files: convertedFiles.map((file) => ({
        name: file.name,
        data: file.buffer.toString("base64"),
      })),
      zipData: zipBuffer.toString("base64"),
    });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Failed to convert images" },
      { status: 500 }
    );
  }
}
