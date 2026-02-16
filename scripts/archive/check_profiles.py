from supabase import create_client, Client

url: str = "https://wuhyevecubtsuioklbvz.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aHlldmVjdWJ0c3Vpb2tsYnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3NDIsImV4cCI6MjA4NjU2NDc0Mn0.GuB7E4wajxvE_zdhYdCKw2RRxsgnc_gfFYjVdUvoyxI"

def check_profiles():
    supabase: Client = create_client(url, key)
    response = supabase.table("profiles").select("email, full_name, avatar_url").execute()
    print("Profiles in database:")
    for p in response.data:
        print(f"- Email: {p['email']}, Name: {p['full_name']}, Avatar: {p['avatar_url']}")

if __name__ == "__main__":
    check_profiles()
