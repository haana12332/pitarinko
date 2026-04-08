import { firebaseApp } from "@/firebaseConfig/firebaseConfig";
import React, { useState } from "react";
import { getStorage, ref, uploadBytes } from "firebase/storage";

const storage = getStorage(firebaseApp);

export function PostPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setUploadSuccess(false); // Reset upload success status on new file selection
    }
  }

  async function handlePost() {
    if (file) {
      const storageRef = ref(storage, `images/${file.name}`);
      setIsUploading(true); // Start uploading state
      try {
        await uploadBytes(storageRef, file);
        console.log("Uploaded a blob or file!");
        setUploadSuccess(true); // Set success flag
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setIsUploading(false); // Reset uploading state regardless of outcome
      }
    }
  }

  return (
    <div>
      <input type="file" onChange={onFileChange} disabled={isUploading} />
      <button onClick={handlePost} disabled={!file || isUploading}>
        {isUploading ? "Uploading..." : "Post"}
      </button>
      {uploadSuccess && <p>Upload successful!</p>}
    </div>
  );
}
