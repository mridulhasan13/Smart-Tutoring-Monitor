import os
import datetime
import pandas as pd
import matplotlib.pyplot as plt
from supabase import create_client, Client

# Configuration (from .env.local)
url: str = "https://wuhyevecubtsuioklbvz.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aHlldmVjdWJ0c3Vpb2tsYnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3NDIsImV4cCI6MjA4NjU2NDc0Mn0.GuB7E4wajxvE_zdhYdCKw2RRxsgnc_gfFYjVdUvoyxI"

def main():
    print("Connecting to Smart Tutoring Monitor Database...")
    supabase: Client = create_client(url, key)

    print("Fetching data...")
    # Fetch all data
    students_response = supabase.table("students").select("*").execute()
    sessions_response = supabase.table("sessions").select("*").execute()

    students_map = {s['id']: s for s in students_response.data}
    sessions_data = sessions_response.data

    if not sessions_data:
        print("No sessions found.")
        return

    # Process data for DataFrame
    records = []
    for session in sessions_data:
        student = students_map.get(session['student_id'], {})
        records.append({
            'Date': session['date'],
            'Student': student.get('name', 'Unknown'),
            'Subject': session.get('subject_taught', 'N/A'),
            'Duration_Minutes': session.get('duration', 0),
            'Institution': student.get('institution', 'N/A'),
            'Status': session.get('status', 'unknown')
        })

    df = pd.DataFrame(records)

    # 1. Save to CSV
    csv_file = 'sessions.csv'
    df.to_csv(csv_file, index=False)
    print(f"\n[SUCCESS] Data saved to '{csv_file}'")

    # 2. Calculate Stats
    print("\n--- Total Running Time Stats ---")
    total_minutes = df['Duration_Minutes'].sum()
    total_hours = total_minutes / 60
    print(f"Total Tutoring Time: {total_minutes} minutes ({total_hours:.2f} hours)")

    subject_stats = df.groupby('Subject')['Duration_Minutes'].sum().sort_values(ascending=False)
    print("\nTime per Subject (Minutes):")
    print(subject_stats)

    # 3. Generate Graph
    print("\nGenerating graph...")
    plt.figure(figsize=(10, 6))
    
    # Convert minutes to hours for the graph
    subject_hours = subject_stats / 60
    
    bars = plt.bar(subject_hours.index, subject_hours.values, color='#3b82f6')
    
    plt.title('Total Tutoring Hours per Subject', fontsize=16, fontweight='bold')
    plt.xlabel('Subject', fontsize=12)
    plt.ylabel('Hours Taught', fontsize=12)
    plt.xticks(rotation=45)
    plt.grid(axis='y', linestyle='--', alpha=0.7)

    # Add text labels on bars
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.1f}h',
                ha='center', va='bottom')

    plt.tight_layout()
    graph_file = 'subject_analysis.png'
    plt.savefig(graph_file)
    print(f"[SUCCESS] Graph saved to '{graph_file}'")
    
    print("\nAnalysis Complete.")

if __name__ == "__main__":
    main()
