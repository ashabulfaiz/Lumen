import pandas as pd
import numpy as np
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Number of student records
n_students = 200

# Generate Data
student_ids = range(1001, 1001 + n_students)
levels = np.random.choice(['Beginner', 'Intermediate', 'Advanced'], size=n_students, p=[0.5, 0.3, 0.2])
times_spent = np.random.normal(loc=120, scale=30, size=n_students) # in minutes
times_spent = np.clip(times_spent, 30, 240)

# Simulate scores based on level (Advanced gets slightly higher variance, Beginner gets higher base score)
scores = []
for lvl in levels:
    if lvl == 'Beginner':
        score = np.random.normal(80, 10)
    elif lvl == 'Intermediate':
        score = np.random.normal(75, 15)
    else:
        score = np.random.normal(70, 20)
    scores.append(np.clip(score, 0, 100))

# Simulate Recommendation Feature usage (for A/B Testing later)
# Group A (Control): No Recommendation Feature
# Group B (Variant): With Recommendation Feature
ab_test_group = np.random.choice(['Group A', 'Group B'], size=n_students)

# Adjust scores slightly for Group B to simulate success of A/B test
for i in range(len(scores)):
    if ab_test_group[i] == 'Group B':
        scores[i] += np.random.normal(5, 2) # small boost
        scores[i] = min(100, scores[i])

df = pd.DataFrame({
    'student_id': student_ids,
    'current_level': levels,
    'quiz_score': scores,
    'time_spent_mins': times_spent,
    'ab_test_group': ab_test_group
})

# --- INJECT MESSY DATA FOR DATA WRANGLING REQUIREMENT ---
# 1. Missing Values (NaN)
nan_indices_score = np.random.choice(df.index, size=15, replace=False)
df.loc[nan_indices_score, 'quiz_score'] = np.nan

nan_indices_time = np.random.choice(df.index, size=10, replace=False)
df.loc[nan_indices_time, 'time_spent_mins'] = np.nan

# 2. Duplicated Rows
duplicates = df.sample(5)
df = pd.concat([df, duplicates], ignore_index=True)

# Save to CSV
df.to_csv('raw_student_data.csv', index=False)
print(f"Generated raw_student_data.csv with {len(df)} rows.")
