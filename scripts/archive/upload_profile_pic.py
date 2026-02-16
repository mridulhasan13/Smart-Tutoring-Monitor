import os
import sys
from supabase import create_client, Client

# Configuration (Consistent with analyze_sessions.py)
url: str = "https://wuhyevecubtsuioklbvz.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aHlldmVjdWJ0c3Vpb2tsYnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3NDIsImV4cCI6MjA4NjU2NDc0Mn0.GuB7E4wajxvE_zdhYdCKw2RRxsgnc_gfFYjVdUvoyxI"

def upload_photo(file_path: str, user_id: str):
    if not os.path.exists(file_path):
        print(f"[ERROR] File not found: {file_path}")
        return

    print(f"Connecting to Supabase...")
    supabase: Client = create_client(url, key)

    file_ext = file_path.split('.')[-1]
    file_name = f"{user_id}-py-upload.{file_ext}"
    storage_path = file_name # Removed redundant 'avatars/' prefix

    print(f"Uploading {file_path} to storage as {storage_path}...")
    
    with open(file_path, 'rb') as f:
        try:
            # Upload to storage
            supabase.storage.from_("avatars").upload(
                path=storage_path,
                file=f,
                file_options={"upsert": "true"}
            )
            
            # Get public URL
            public_url = supabase.storage.from_("avatars").get_public_url(storage_path)
            print(f"[SUCCESS] Uploaded to: {public_url}")

            # Update profile table
            print(f"Updating database for user {user_id}...")
            supabase.table("profiles").update({"avatar_url": public_url}).eq("id", user_id).execute()
            print(f"[SUCCESS] Database updated with new photo URL.")
            
        except Exception as e:
            print(f"[ERROR] Failed to upload/update: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python upload_profile_pic.py <path_to_image> <user_id>")
        print("Example: python upload_profile_pic.py my_photo.jpg 00000000-0000-0000-0000-000000000000")
        sys.exit(1)

    image_path = sys.argv[1]
    user_uuid = sys.argv[2]
    
    upload_photo(image_path, user_uuid)
