import random
import time
from supabase import create_client, Client

# Configuration
url: str = "https://wuhyevecubtsuioklbvz.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aHlldmVjdWJ0c3Vpb2tsYnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3NDIsImV4cCI6MjA4NjU2NDc0Mn0.GuB7E4wajxvE_zdhYdCKw2RRxsgnc_gfFYjVdUvoyxI"

COLORS = ['#2563eb', '#06b6d4', '#7c3aed', '#db2777', '#059669', '#d97706', '#4f46e5', '#be123c']

def main():
    print("Connecting to Smart Tutoring Monitor Database...")
    supabase: Client = create_client(url, key)

    print("Fetching students...")
    response = supabase.table("students").select("*").execute()
    students = response.data

    if not students:
        print("No students found.")
        return

    print(f"Processing {len(students)} students...")
    updated_count = 0

    for student in students:
        # Check if color is missing or valid
        current_color = student.get('color')
        
        # If no color, or color not in our palette (optional, but good for consistency)
        if not current_color or current_color not in COLORS:
            new_color = random.choice(COLORS)
            print(f"Assigning color {new_color} to {student.get('name')}...")
            
            try:
                supabase.table("students").update({"color": new_color}).eq("id", student['id']).execute()
                updated_count += 1
                time.sleep(0.1) # Rate limit
            except Exception as e:
                print(f"Error updating student {student.get('id')}: {e}")

    print(f"\n[SUCCESS] Updated {updated_count} student records with colors.")

if __name__ == "__main__":
    main()
