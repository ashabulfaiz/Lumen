const fs = require('fs');
const path = require('path');
const db = require('./database');

async function seedCurriculum() {
    try {
        console.log("⏳ Starting the curriculum data seeding process...");

        const languageId = 1; 
        console.log("Menambahkan bahasa default...");
        await db.query(`INSERT IGNORE INTO languages (id, nama_bahasa, kode_iso) VALUES (1, 'English', 'EN')`);

        const levelsConfig = [
            {
                nama_level: 'Beginner',
                course_judul: 'Beginner Essentials',
                course_desc: 'Foundational English concepts for beginners.',
                lessonFile: 'beginner_lessons.json',
                quizFile: 'beginner_quiz.json'
            },
            {
                nama_level: 'Intermediate',
                course_judul: 'Intermediate Skills',
                course_desc: 'Building upon the basics with complex structures.',
                lessonFile: 'intermediate_lessons.json',
                quizFile: 'intermediate_quiz.json'
            },
            {
                nama_level: 'Advanced',
                course_judul: 'Advanced Mastery',
                course_desc: 'Mastering advanced grammar and professional English.',
                lessonFile: 'advanced_lessons.json',
                quizFile: 'advanced_quiz.json'
            }
        ];

        for (const config of levelsConfig) {
            const lessonPath = path.join(__dirname, `../data/curriculum/${config.lessonFile}`);
            const quizPath = path.join(__dirname, `../data/quizzes/${config.quizFile}`);
            
            const lessonsData = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
            const quizzesData = JSON.parse(fs.readFileSync(quizPath, 'utf8'));

            const [levelResult] = await db.query(
                'INSERT INTO levels (language_id, nama_level) VALUES (?, ?)',
                [languageId, config.nama_level]
            );
            const levelId = levelResult.insertId;
            console.log(`\n✅ Level Entered Successfully: ${config.nama_level} (ID: ${levelId})`);

            const [courseResult] = await db.query(
                'INSERT INTO courses (level_id, judul_course, deskripsi, urutan) VALUES (?, ?, ?, ?)',
                [levelId, config.course_judul, config.course_desc, 1]
            );
            const courseId = courseResult.insertId;
            console.log(`  🔹 Course Entered: ${config.course_judul} (ID: ${courseId})`);

            for (let i = 0; i < lessonsData.length; i++) {
                const lesson = lessonsData[i];
                
                const [lessonResult] = await db.query(
                    'INSERT INTO lessons (course_id, judul_lesson, konten_teks, urutan) VALUES (?, ?, ?, ?)',
                    [courseId, lesson.judul_lesson, lesson.konten_teks, i + 1]
                );
                const lessonId = lessonResult.insertId;
                console.log(`    🔸 Lesson Entered: ${lesson.judul_lesson}`);

                const matchingQuiz = quizzesData.find(q => q.kategori_topik === lesson.kuis_topik_id);
                
                if (matchingQuiz) {
                    const [quizResult] = await db.query(
                        'INSERT INTO quizzes (lesson_id, judul_quiz) VALUES (?, ?)',
                        [lessonId, matchingQuiz.judul_asli]
                    );
                    const quizId = quizResult.insertId;
                    console.log(`      📝 Quiz Attached: ${matchingQuiz.judul_asli}`);

                    for (let j = 0; j < matchingQuiz.daftar_soal.length; j++) {
                        const soal = matchingQuiz.daftar_soal[j];
                        
                        await db.query(
                            'INSERT INTO questions (quiz_id, pertanyaan, jawaban_benar, tipe_soal, urutan) VALUES (?, ?, ?, ?, ?)',
                            [quizId, soal.pertanyaan, soal.jawaban_benar, 'multiple_choice', j + 1]
                        );
                    }
                }
            }
        }

        console.log("\nMemasukkan data soal Placement Test...");
        await db.query(`
            INSERT IGNORE INTO placement_questions (id, language_id, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban_benar) VALUES
            -- BEGINNER LEVEL (Soal 1 - 33)
            (1, 1, 'Hello, my name ___ John.', 'am', 'is', 'are', 'be', 'is'),
            (2, 1, 'I ___ from Canada.', 'comes', 'coming', 'come', 'came', 'come'),
            (3, 1, 'She ___ an apple every morning.', 'eat', 'eats', 'eating', 'ate', 'eats'),
            (4, 1, '___ are you from?', 'Who', 'What', 'Where', 'When', 'Where'),
            (5, 1, 'This is ___ book.', 'a', 'an', 'the', 'some', 'a'),
            (6, 1, 'I have two ___.', 'child', 'childs', 'children', 'childrens', 'children'),
            (7, 1, '___ you like coffee?', 'Does', 'Do', 'Are', 'Is', 'Do'),
            (8, 1, 'He is ___ a book right now.', 'read', 'reads', 'reading', 'readed', 'reading'),
            (9, 1, 'They ___ at home yesterday.', 'was', 'were', 'is', 'are', 'were'),
            (10, 1, 'I ___ to the store tomorrow.', 'go', 'went', 'will go', 'going', 'will go'),
            (11, 1, 'What ___ she doing?', 'am', 'is', 'are', 'do', 'is'),
            (12, 1, 'There ___ a pen on the table.', 'am', 'is', 'are', 'be', 'is'),
            (13, 1, 'I can ___ English.', 'speak', 'speaks', 'speaking', 'to speak', 'speak'),
            (14, 1, 'My sister is ___ than me.', 'tall', 'taller', 'tallest', 'more tall', 'taller'),
            (15, 1, 'We don''t have ___ milk.', 'some', 'any', 'a', 'an', 'any'),
            (16, 1, 'He usually ___ up at 7 AM.', 'get', 'gets', 'getting', 'got', 'gets'),
            (17, 1, 'Look at ___ birds!', 'this', 'that', 'these', 'those', 'those'),
            (18, 1, 'She works ___ a hospital.', 'in', 'on', 'at', 'under', 'in'),
            (19, 1, 'Did you ___ the movie?', 'like', 'likes', 'liked', 'liking', 'like'),
            (20, 1, 'My birthday is ___ July.', 'in', 'on', 'at', 'by', 'in'),
            (21, 1, 'I ___ a car.', 'not have', 'don''t have', 'doesn''t have', 'am not have', 'don''t have'),
            (22, 1, 'Is this ___ pen?', 'you', 'your', 'yours', 'yourself', 'your'),
            (23, 1, 'I want ___ an apple.', 'eat', 'eating', 'to eat', 'ate', 'to eat'),
            (24, 1, 'He is wearing a ___ shirt.', 'red', 'reds', 'more red', 'most red', 'red'),
            (25, 1, 'They ___ playing football now.', 'am', 'is', 'are', 'be', 'are'),
            (26, 1, 'I ___ my homework yesterday.', 'do', 'does', 'did', 'done', 'did'),
            (27, 1, 'She is the ___ student in the class.', 'smart', 'smarter', 'smartest', 'more smart', 'smartest'),
            (28, 1, 'We ___ to the park on Sundays.', 'go', 'goes', 'going', 'went', 'go'),
            (29, 1, 'How ___ apples do you want?', 'much', 'many', 'some', 'any', 'many'),
            (30, 1, 'This bag is very ___.', 'heavy', 'heavier', 'heaviest', 'heavily', 'heavy'),
            (31, 1, 'I was born ___ 1995.', 'in', 'on', 'at', 'since', 'in'),
            (32, 1, 'She ___ like pizza.', 'don''t', 'doesn''t', 'isn''t', 'aren''t', 'doesn''t'),
            (33, 1, 'Let''s ___ to the cinema.', 'go', 'goes', 'going', 'to go', 'go'),

            -- INTERMEDIATE LEVEL (Soal 34 - 66)
            (34, 1, 'I have been living here ___ 5 years.', 'since', 'for', 'in', 'during', 'for'),
            (35, 1, 'If it rains, I ___ at home.', 'stay', 'stayed', 'will stay', 'would stay', 'will stay'),
            (36, 1, 'She told me that she ___ tired.', 'is', 'was', 'were', 'has been', 'was'),
            (37, 1, 'The letter ___ yesterday.', 'was sent', 'sent', 'is sent', 'has sent', 'was sent'),
            (38, 1, 'I''m looking forward ___ you.', 'to see', 'to seeing', 'seeing', 'see', 'to seeing'),
            (39, 1, 'He is used ___ up early.', 'to wake', 'to waking', 'waking', 'wake', 'to waking'),
            (40, 1, 'I wish I ___ a car.', 'have', 'had', 'having', 'will have', 'had'),
            (41, 1, 'You ___ better see a doctor.', 'had', 'would', 'should', 'ought', 'had'),
            (42, 1, 'I haven''t seen him ___ last month.', 'since', 'for', 'in', 'from', 'since'),
            (43, 1, 'She asked me where I ___.', 'live', 'lived', 'am living', 'have lived', 'lived'),
            (44, 1, 'By the time we arrived, the train ___.', 'left', 'has left', 'had left', 'was leaving', 'had left'),
            (45, 1, 'This is the man ___ car was stolen.', 'who', 'whom', 'whose', 'which', 'whose'),
            (46, 1, 'I wouldn''t do that if I ___ you.', 'am', 'was', 'were', 'have been', 'were'),
            (47, 1, 'He is interested ___ learning French.', 'in', 'on', 'at', 'about', 'in'),
            (48, 1, 'Despite ___ sick, he went to work.', 'be', 'being', 'been', 'to be', 'being'),
            (49, 1, 'The movie was so ___ that I fell asleep.', 'bored', 'boring', 'bore', 'boredom', 'boring'),
            (50, 1, 'You must ___ tired after the long journey.', 'be', 'been', 'being', 'are', 'be'),
            (51, 1, 'I suggest ___ early tomorrow.', 'to leave', 'leaving', 'leave', 'left', 'leaving'),
            (52, 1, 'He denied ___ the money.', 'to steal', 'stealing', 'stole', 'stolen', 'stealing'),
            (53, 1, 'It''s no use ___ about it now.', 'to worry', 'worrying', 'worry', 'worried', 'worrying'),
            (54, 1, 'She makes me ___.', 'laugh', 'to laugh', 'laughing', 'laughed', 'laugh'),
            (55, 1, 'I''d rather you ___ not do that.', 'do', 'did', 'doing', 'done', 'did'),
            (56, 1, 'Scarcely had I arrived ___ it started raining.', 'when', 'than', 'then', 'that', 'when'),
            (57, 1, 'It''s high time we ___.', 'leave', 'left', 'are leaving', 'will leave', 'left'),
            (58, 1, 'He talks as if he ___ everything.', 'knows', 'knew', 'known', 'knowing', 'knew'),
            (59, 1, 'The more you study, the ___ you get.', 'good', 'better', 'best', 'more better', 'better'),
            (60, 1, 'I can''t stand ___ in line.', 'wait', 'to wait', 'waiting', 'waited', 'waiting'),
            (61, 1, 'Do you mind ___ the window?', 'open', 'to open', 'opening', 'opened', 'opening'),
            (62, 1, 'I remember ___ him before.', 'meet', 'to meet', 'meeting', 'met', 'meeting'),
            (63, 1, 'He accused me ___ stealing his pen.', 'for', 'of', 'about', 'with', 'of'),
            (64, 1, 'She succeeded ___ passing the exam.', 'in', 'on', 'at', 'with', 'in'),
            (65, 1, 'This problem is easy ___ solve.', 'for', 'to', 'in', 'at', 'to'),
            (66, 1, 'We congratulated him ___ his success.', 'for', 'on', 'with', 'about', 'on'),

            -- ADVANCED LEVEL (Soal 67 - 100)
            (67, 1, 'Had I known you were coming, I ___ a cake.', 'would bake', 'would have baked', 'will bake', 'baked', 'would have baked'),
            (68, 1, 'Not only ___ the exam, but she also got the highest score.', 'did she pass', 'she passed', 'she did pass', 'passed she', 'did she pass'),
            (69, 1, 'It is imperative that he ___ immediately.', 'leaves', 'leave', 'left', 'leaving', 'leave'),
            (70, 1, 'By next year, I ___ working here for 10 years.', 'will be', 'will have been', 'am', 'have been', 'will have been'),
            (71, 1, 'He is alleged ___ the crime.', 'to commit', 'to have committed', 'committing', 'having committed', 'to have committed'),
            (72, 1, 'Little ___ about the surprise party.', 'did he know', 'he knew', 'he did know', 'knew he', 'did he know'),
            (73, 1, 'The project is scheduled ___ by Friday.', 'to complete', 'to be completed', 'completing', 'completed', 'to be completed'),
            (74, 1, 'It goes without ___ that you will be paid.', 'say', 'saying', 'said', 'to say', 'saying'),
            (75, 1, 'She objected ___ to work on weekends.', 'to be forced', 'being forced', 'to being forced', 'forced', 'to being forced'),
            (76, 1, 'No sooner had we left ___ it began to snow.', 'when', 'than', 'then', 'that', 'than'),
            (77, 1, 'He was on the verge of ___ the secret.', 'reveal', 'to reveal', 'revealing', 'revealed', 'revealing'),
            (78, 1, 'I''d prefer ___ at home tonight.', 'to stay', 'staying', 'stay', 'stayed', 'to stay'),
            (79, 1, 'He is bound ___ succeed with such dedication.', 'for', 'to', 'in', 'at', 'to'),
            (80, 1, 'The company is on the brink of ___.', 'bankrupt', 'bankruptcy', 'bankrupted', 'bankrupting', 'bankruptcy'),
            (81, 1, 'It''s a pity he ___ not come to the party.', 'did', 'could', 'was', 'had', 'could'),
            (82, 1, 'The rule applies ___ everyone.', 'for', 'to', 'with', 'on', 'to'),
            (83, 1, 'She is prone ___ making careless mistakes.', 'to', 'for', 'of', 'in', 'to'),
            (84, 1, 'He was largely responsible ___ the failure.', 'for', 'of', 'to', 'with', 'for'),
            (85, 1, 'The decision rests ___ the manager.', 'on', 'with', 'for', 'in', 'with'),
            (86, 1, 'She is completely devoid ___ empathy.', 'from', 'of', 'with', 'in', 'of'),
            (87, 1, 'The situation calls ___ immediate action.', 'for', 'on', 'at', 'in', 'for'),
            (88, 1, 'He is notorious ___ his bad temper.', 'for', 'of', 'with', 'about', 'for'),
            (89, 1, 'The book is comprised ___ three main sections.', 'from', 'of', 'with', 'by', 'of'),
            (90, 1, 'We must conform ___ the new regulations.', 'to', 'with', 'for', 'on', 'to'),
            (91, 1, 'She is indifferent ___ the criticism.', 'to', 'about', 'for', 'of', 'to'),
            (92, 1, 'The evidence points ___ his guilt.', 'at', 'to', 'for', 'on', 'to'),
            (93, 1, 'He was acquitted ___ all charges.', 'from', 'of', 'with', 'for', 'of'),
            (94, 1, 'The disease is endemic ___ this region.', 'in', 'to', 'at', 'for', 'to'),
            (95, 1, 'She is averse ___ taking risks.', 'to', 'for', 'from', 'of', 'to'),
            (96, 1, 'The plan is subject ___ approval.', 'to', 'for', 'of', 'with', 'to'),
            (97, 1, 'He is fully cognizant ___ the risks involved.', 'about', 'of', 'with', 'for', 'of'),
            (98, 1, 'The problem stems ___ a lack of communication.', 'from', 'of', 'with', 'by', 'from'),
            (99, 1, 'She was inundated ___ requests for help.', 'by', 'with', 'from', 'of', 'with'),
            (100, 1, 'The new law is tantamount ___ censorship.', 'with', 'to', 'as', 'for', 'to');
        `);

        console.log("\n Seeding Complete! Database lokal kamu sudah menggunakan struktur JSON yang modular.");
        process.exit(0);

    } catch (error) {
        console.error("Failed Seeding:", error);
        process.exit(1);
    }
}

seedCurriculum();