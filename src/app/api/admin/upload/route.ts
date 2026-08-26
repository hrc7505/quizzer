import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

import { authOptions, SessionUser } from "@/lib/auth";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function configureCloudinary(): boolean {
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^["']|["']$/g, "");
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim().replace(/^["']|["']$/g, "");
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^["']|["']$/g, "");

  if (cloudinaryUrl) {
    cloudinary.config({
      cloudinary_url: cloudinaryUrl,
      secure: true,
    });
    return true;
  }

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }

  return false;
}

/**
 * POST /api/admin/upload
 * Directly streams diagram upload to Cloudinary CDN in memory without disk storage.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isConfigured = configureCloudinary();
    if (!isConfigured) {
      return NextResponse.json(
        {
          error:
            "Cloudinary credentials missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_URL) in your .env file.",
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed formats: PNG, JPG, WebP, SVG, GIF" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "quizzer/questions",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error("No result received from Cloudinary"));
          }
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while uploading to Cloudinary.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
