from supabase import create_client, Client

url: str = "YOUR_SUPABASE_URL"
key: str = "YOUR_SUPABASE_ANON_KEY"

def check_profiles():
    supabase: Client = create_client(url, key)
    response = supabase.table("profiles").select("email, full_name, avatar_url").execute()
    print("Profiles in database:")
    for p in response.data:
        print(f"- Email: {p['email']}, Name: {p['full_name']}, Avatar: {p['avatar_url']}")

if __name__ == "__main__":
    check_profiles()
