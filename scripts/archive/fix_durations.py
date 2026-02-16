import os
import datetime
from supabase import create_client, Client

# Configuration (from .env.local)
url: str = "https://wuhyevecubtsuioklbvz.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aHlldmVjdWJ0c3Vpb2tsYnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3NDIsImV4cCI6MjA4NjU2NDc0Mn0.GuB7E4wajxvE_zdhYdCKw2RRxsgnc_gfFYjVdUvoyxI"

def main():
    print("Connecting to Smart Tutoring Monitor Database...")
    supabase: Client = create_client(url, key)

    print("Fetching sessions...")
    response = supabase.table("sessions").select("*").execute()
    sessions = response.data

    if not sessions:
        print("No sessions found.")
        return

    updated_count = 0
    print(f"Processing {len(sessions)} sessions...")

    for session in sessions:
        start_time_str = session.get('start_time')
        end_time_str = session.get('end_time')
        
        if start_time_str and end_time_str:
            try:
                # Handle ISO format with potential Z or offset
                start_dt = datetime.datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                end_dt = datetime.datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                
                # Calculate duration in minutes
                duration_seconds = (end_dt - start_dt).total_seconds()
                duration_minutes = int(duration_seconds / 60)
                
                # Check if update is needed
                current_duration = session.get('duration')
                if current_duration != duration_minutes and duration_minutes >= 0:
                    print(f"Updating Session {session['id'][:8]}: {current_duration} -> {duration_minutes} min")
                    
                    supabase.table("sessions").update({"duration": duration_minutes}).eq("id", session['id']).execute()
                    updated_count += 1
            except Exception as e:
                print(f"Error processing session {session.get('id')}: {e}")

    print(f"\n[SUCCESS] Updated {updated_count} session records.")

if __name__ == "__main__":
    main()
