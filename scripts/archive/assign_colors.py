import random
import time
from supabase import create_client, Client

# Configuration
url: str = "YOUR_SUPABASE_URL"
key: str = "YOUR_SUPABASE_ANON_KEY"

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
