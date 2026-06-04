import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

# 1. Load Data
df_raw = pd.read_csv('raw_student_data.csv')

# 2. Cleaning
df_clean = df_raw.drop_duplicates()
df_clean['quiz_score'] = df_clean.groupby('current_level')['quiz_score'].transform(lambda x: x.fillna(x.median()))
df_clean['time_spent_mins'] = df_clean['time_spent_mins'].fillna(df_clean['time_spent_mins'].median())

# 3. Target Feature
df_clean['is_passed'] = (df_clean['quiz_score'] >= 75).astype(int)
df_clean.to_csv('clean_student_data.csv', index=False)
print("Saved clean_student_data.csv")

# 4. Save EDA Plot
plt.figure(figsize=(8, 5))
sns.boxplot(data=df_clean, x='current_level', y='quiz_score', order=['Beginner', 'Intermediate', 'Advanced'])
plt.title('Distribusi Skor Berdasarkan Level')
plt.xlabel('Tingkatan (Level)')
plt.ylabel('Skor Kuis')
plt.savefig('eda_boxplot.png')
print("Saved eda_boxplot.png")
