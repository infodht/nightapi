import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import FormData from "form-data";

dotenv.config();

// Resolve directory for this module (works with ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// BACKEND_DIR points to the `backend` folder containing this middleware
const BACKEND_DIR = path.resolve(__dirname, "..");

// --------------------------------------------------
// Universal S3-Compatible Client (AWS / Bunny / R2 / Wasabi)
// --------------------------------------------------
const cloudClient = new S3Client({
  region: process.env.CLOUD_REGION || "us-east-1",
  endpoint: process.env.CLOUD_ENDPOINT || undefined, // Bunny / R2 / Wasabi
  forcePathStyle: process.env.CLOUD_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId: process.env.CLOUD_ACCESS_KEY,
    secretAccessKey: process.env.CLOUD_SECRET_KEY,
  },
});

// ------------------- Multer memory storage -------------------
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// --------------------------------------------------
// Upload to CLOUD (S3-compatible)
// --------------------------------------------------
async function uploadToCloud(file, folder) {
  const key = `${folder}/${uuid()}_${file.originalname}`;

  await cloudClient.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUD_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return `${process.env.CLOUD_PUBLIC_URL}/${key}`;
}

// ------------------- Save file to local storage -------------------
async function uploadToLocal(file, folder) {
  // Use BACKEND_DIR (resolved from this module) to avoid depending on process.cwd()
  const uploadDir = path.join(BACKEND_DIR, "attach", folder);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${uuid()}_${file.originalname}`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, file.buffer);

  // Keep returning only the filename to preserve existing behavior
  return fileName;
}

// --------------------------------------------------
// Upload to REMOTE API (Custom server / FTP-like)
// --------------------------------------------------
async function uploadToRemote(file) {
  const formData = new FormData();

  formData.append("file", file.buffer, {
    filename: `${uuid()}_${file.originalname}`,
    contentType: file.mimetype,
  });

  formData.append("project", process.env.REMOTE_PROJECT_NAME);

  const response = await axios.post(
    `${process.env.REMOTE_UPLOAD_BASE_URL}/api/upload`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        "X-API-KEY": process.env.REMOTE_UPLOAD_API_KEY,
      },
      maxBodyLength: Infinity,
    }
  );

  if (!response.data?.url) {
    throw new Error("Remote upload failed");
  }

  return response.data.url;
}

// --------------------------------------------------
// Field → Folder mapping (LOCAL + CLOUD only)
// --------------------------------------------------
const FOLDER_MAP = {
  // Candidate
  upload_cv: "upload_cv",    // candidate CV
  profile_img: "uploads",    // candidate profile

  // Interview
  interview_video_answers: "interview/videos",

  // Client
  upload: "client/contract", // client contract
  client_logo: "client/logo", // client logo
};

// --------------------------------------------------
// Main Middleware
// --------------------------------------------------
export const handleUpload = async (req, res, next) => {
  try {
    const uploadedFiles = {};
    const storageType = req.body.storage_type || "local";

    // Decide upload handler
    let uploadHandler;

    switch (storageType) {
      case "cloud":
        uploadHandler = uploadToCloud;
        break;
      case "remote":
        uploadHandler = uploadToRemote;
        break;
      default:
        uploadHandler = uploadToLocal;
    }

    /**
     * CASE 1: upload.array()
     */
    if (Array.isArray(req.files)) {
      const field = "interview_video_answers";
      const folder = FOLDER_MAP[field];

      uploadedFiles[field] = [];

      for (const file of req.files) {
        const result =
          storageType === "remote"
            ? await uploadHandler(file)
            : await uploadHandler(file, folder);

        uploadedFiles[field].push(result);
      }
    }

    /**
     * CASE 2: upload.fields()
     */
    else if (req.files && typeof req.files === "object") {
      for (const field in FOLDER_MAP) {
        if (req.files[field]?.length) {
          const file = req.files[field][0];
          const folder = FOLDER_MAP[field];

          uploadedFiles[field] =
            storageType === "remote"
              ? await uploadHandler(file)
              : await uploadHandler(file, folder);
        }
      }
    }

    req.uploadedFiles = uploadedFiles;
    req.storage_type = storageType;

    next();
  } catch (err) {
    console.error("Upload Error:", err);
    return res.status(500).json({ error: "File upload failed" });
  }
};