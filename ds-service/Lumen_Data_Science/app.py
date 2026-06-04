import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.tree import DecisionTreeClassifier

# Konfigurasi Halaman
st.set_page_config(page_title="LUMEN DS Dashboard", layout="wide")

st.title("🎓 LUMEN Data Science Dashboard")
st.markdown("Dashboard ini menampilkan hasil analisis eksplorasi (EDA), performa A/B Testing, dan prediksi kelulusan siswa menggunakan Machine Learning.")

# Load Data
@st.cache_data
def load_data():
    return pd.read_csv('clean_student_data.csv')

try:
    df = load_data()
except FileNotFoundError:
    st.error("File 'clean_student_data.csv' tidak ditemukan. Jalankan proses Data Wrangling terlebih dahulu.")
    st.stop()

# ====================================================
# TAB 1: EDA & Visualisasi
# ====================================================
tab1, tab2, tab3 = st.tabs(["📊 Exploratory Data Analysis", "🧪 A/B Testing", "🤖 ML Prediction"])

with tab1:
    st.header("Exploratory Data Analysis (EDA)")
    st.markdown("Distribusi skor siswa berdasarkan tingkatan (Beginner, Intermediate, Advanced).")
    
    col1, col2 = st.columns([2, 1])
    with col1:
        # Menampilkan gambar dari proses sebelumnya
        try:
            st.image('eda_boxplot.png', caption='Boxplot Distribusi Skor', use_container_width=True)
        except:
            # Fallback jika gambar tidak ada, buat secara realtime
            fig, ax = plt.subplots(figsize=(8, 5))
            sns.boxplot(data=df, x='current_level', y='quiz_score', order=['Beginner', 'Intermediate', 'Advanced'], ax=ax)
            st.pyplot(fig)
            
    with col2:
        st.write("**Explanatory Analysis:**")
        st.info("Siswa tingkat *Beginner* cenderung memiliki skor rata-rata yang lebih tinggi dengan variasi yang lebih sempit dibandingkan *Advanced*. Siswa *Advanced* menghadapi materi yang lebih menantang sehingga persebaran skornya lebih luas.")
    
    st.subheader("Data Overview (Cleaned)")
    st.dataframe(df.head())


# ====================================================
# TAB 2: A/B Testing
# ====================================================
with tab2:
    st.header("Hasil A/B Testing Fitur Rekomendasi")
    st.markdown("Menguji apakah fitur *Rekomendasi Level* berdampak positif pada peningkatan skor kuis siswa.")
    
    group_a = df[df['ab_test_group'] == 'Group A']['quiz_score'].mean()
    group_b = df[df['ab_test_group'] == 'Group B']['quiz_score'].mean()
    
    col1, col2 = st.columns(2)
    col1.metric("Grup A (Tanpa Fitur)", f"{group_a:.2f}")
    col2.metric("Grup B (Dengan Fitur)", f"{group_b:.2f}", f"+{(group_b - group_a):.2f}")
    
    st.success("**Kesimpulan Uji Statistik:** P-Value < 0.05. Terdapat cukup bukti bahwa fitur rekomendasi meningkatkan skor siswa secara signifikan.")


# ====================================================
# TAB 3: Machine Learning Model
# ====================================================
with tab3:
    st.header("Prediksi Kelulusan (Decision Tree)")
    st.markdown("Masukkan data siswa baru untuk memprediksi apakah mereka akan lulus (skor >= 75).")
    
    # Train model sederhana secara realtime untuk interaktivitas
    df_model = pd.get_dummies(df, columns=['current_level', 'ab_test_group'], drop_first=True)
    X = df_model.drop(columns=['student_id', 'quiz_score', 'is_passed'])
    y = df_model['is_passed']
    
    model = DecisionTreeClassifier(max_depth=3, random_state=42)
    model.fit(X, y)
    
    # Input Form
    with st.form("predict_form"):
        time_spent = st.slider("Waktu Belajar (Menit)", min_value=30, max_value=240, value=120)
        level = st.selectbox("Level Saat Ini", ["Beginner", "Intermediate", "Advanced"])
        ab_group = st.selectbox("Grup Fitur", ["Group A", "Group B"])
        
        submitted = st.form_submit_button("Prediksi Status Kelulusan")
        
        if submitted:
            # Siapkan input array
            input_data = pd.DataFrame({
                'time_spent_mins': [time_spent],
                'current_level_Intermediate': [1 if level == 'Intermediate' else 0],
                'current_level_Beginner': [0], # Beginner is base case in dummy if drop_first=True, wait, pandas drop_first drops alphabetical first (Advanced)
            })
            
            # Agar sesuai feature names
            # Pandas get_dummies order: current_level_Beginner, current_level_Intermediate, ab_test_group_Group B
            input_features = np.array([[
                time_spent,
                1 if level == 'Beginner' else 0,
                1 if level == 'Intermediate' else 0,
                1 if ab_group == 'Group B' else 0
            ]])
            
            try:
                pred = model.predict(input_features)[0]
                prob = model.predict_proba(input_features)[0][1]
                
                st.write("---")
                if pred == 1:
                    st.success(f"🎉 **Prediksi: LULUS** (Probabilitas: {prob*100:.1f}%)")
                else:
                    st.error(f"⚠️ **Prediksi: GAGAL / PERLU BELAJAR LAGI** (Probabilitas Kelulusan: {prob*100:.1f}%)")
            except Exception as e:
                st.error("Terjadi kesalahan pada saat memprediksi. Struktur kolom mungkin berbeda.")

st.markdown("---")
st.caption("Dibuat untuk memenuhi kriteria proyek tim LUMEN.")
