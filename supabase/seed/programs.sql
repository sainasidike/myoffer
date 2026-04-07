-- 50 个热门留学项目种子数据（覆盖英美澳港新）
-- 重点包含双非友好项目

INSERT INTO public.programs (university_name, university_name_cn, program_name, program_name_cn, degree_type, country, qs_ranking, department, duration, tuition, language_requirement, gpa_requirement, gre_required, deadline, application_link, required_materials, tags, description)
VALUES

-- ===== 英国 (15个) =====
('University of Edinburgh', '爱丁堡大学', 'MSc Computer Science', '计算机科学硕士', 'master', 'UK', 22, 'School of Informatics', '1年', '£36,500/年', '{"ielts_min":7.0,"toefl_min":100}', 3.5, false, '{"round1":"2026-12-01","round2":"2027-03-01"}', 'https://www.ed.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","名校"}', '爱丁堡大学信息学院的旗舰项目，适合有计算机背景的学生'),

('University of Manchester', '曼彻斯特大学', 'MSc Data Science', '数据科学硕士', 'master', 'UK', 32, 'Department of Computer Science', '1年', '£31,000/年', '{"ielts_min":7.0,"toefl_min":100}', 3.3, false, '{"round1":"2026-11-15","round2":"2027-02-15"}', 'https://www.manchester.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","双非友好","热门"}', '曼大数据科学项目，对双非学生相对友好'),

('University of Bristol', '布里斯托大学', 'MSc Computer Science', '计算机科学硕士', 'master', 'UK', 55, 'Department of Computer Science', '1年', '£29,300/年', '{"ielts_min":6.5,"toefl_min":90}', 3.2, false, '{"round1":"2026-11-01","round2":"2027-02-01"}', 'https://www.bristol.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","双非友好"}', '布大CS项目，不卡学校背景'),

('University of Glasgow', '格拉斯哥大学', 'MSc Software Development', '软件开发硕士', 'master', 'UK', 76, 'School of Computing Science', '1年', '£27,120/年', '{"ielts_min":6.5,"toefl_min":90}', 3.0, false, '{"round1":"2026-12-01","round2":"2027-03-15"}', 'https://www.gla.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","双非友好","低门槛"}', '格拉斯哥大学，对双非学生非常友好'),

('University of Leeds', '利兹大学', 'MSc Business Analytics', '商业分析硕士', 'master', 'UK', 75, 'Leeds University Business School', '1年', '£31,250/年', '{"ielts_min":6.5,"toefl_min":92}', 3.3, false, '{"round1":"2026-10-15","round2":"2027-01-15"}', 'https://www.leeds.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"商科","双非友好","热门"}', '利兹商学院商业分析项目，就业导向强'),

('University of Sheffield', '谢菲尔德大学', 'MSc Finance', '金融学硕士', 'master', 'UK', 104, 'Management School', '1年', '£28,950/年', '{"ielts_min":6.5,"toefl_min":88}', 3.0, false, '{"round1":"2026-11-01","round2":"2027-02-28"}', 'https://www.sheffield.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"商科","双非友好","低门槛"}', '谢菲管理学院金融项目，双非友好'),

('University of Birmingham', '伯明翰大学', 'MSc Artificial Intelligence and Machine Learning', 'AI与机器学习硕士', 'master', 'UK', 84, 'School of Computer Science', '1年', '£29,340/年', '{"ielts_min":6.5,"toefl_min":88}', 3.3, false, '{"round1":"2026-10-01","round2":"2027-01-31"}', 'https://www.birmingham.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","AI","热门"}', '伯明翰AI&ML项目，技术前沿'),

('University of Southampton', '南安普顿大学', 'MSc Computer Science', '计算机科学硕士', 'master', 'UK', 81, 'Electronics and Computer Science', '1年', '£28,000/年', '{"ielts_min":6.5,"toefl_min":90}', 3.0, false, '{"round1":"2026-11-15","round2":"2027-03-01"}', 'https://www.southampton.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","双非友好","低门槛"}', '南安ECS学院CS项目，英国CS强校'),

('University of Nottingham', '诺丁汉大学', 'MSc Data Science', '数据科学硕士', 'master', 'UK', 100, 'School of Computer Science', '1年', '£27,200/年', '{"ielts_min":6.5,"toefl_min":87}', 3.0, false, '{"round1":"2026-11-01","round2":"2027-03-15"}', 'https://www.nottingham.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","双非友好","低门槛"}', '诺丁汉数据科学，双非友好选择'),

('King''s College London', '伦敦国王学院', 'MSc Data Science', '数据科学硕士', 'master', 'UK', 40, 'Department of Informatics', '1年', '£35,100/年', '{"ielts_min":7.0,"toefl_min":100}', 3.5, false, '{"round1":"2026-10-15","round2":"2027-01-15"}', 'https://www.kcl.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","名校","伦敦"}', 'KCL数据科学硕士，地理位置优越'),

('University College London', '伦敦大学学院', 'MSc Machine Learning', '机器学习硕士', 'master', 'UK', 9, 'Department of Computer Science', '1年', '£38,300/年', '{"ielts_min":7.0,"toefl_min":100}', 3.6, false, '{"round1":"2026-10-01","round2":"2027-01-15"}', 'https://www.ucl.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts","gre"}', '{"stem","名校","AI","高门槛"}', 'UCL机器学习，顶级CS项目'),

('Imperial College London', '帝国理工学院', 'MSc Computing', '计算机硕士', 'master', 'UK', 6, 'Department of Computing', '1年', '£39,400/年', '{"ielts_min":7.0,"toefl_min":100}', 3.7, false, '{"round1":"2026-10-15","round2":"2027-01-15"}', 'https://www.imperial.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","名校","高门槛"}', '帝国理工计算机，G5名校'),

('University of Warwick', '华威大学', 'MSc Business Analytics', '商业分析硕士', 'master', 'UK', 69, 'Warwick Business School', '1年', '£34,000/年', '{"ielts_min":7.0,"toefl_min":100}', 3.4, false, '{"round1":"2026-10-01","round2":"2027-01-31"}', 'https://www.wbs.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"商科","名校"}', '华威商学院商业分析，英国顶尖商学院'),

('Lancaster University', '兰卡斯特大学', 'MSc Data Science', '数据科学硕士', 'master', 'UK', 122, 'School of Computing and Communications', '1年', '£25,080/年', '{"ielts_min":6.5,"toefl_min":87}', 2.8, false, '{"round1":"2026-12-01","round2":"2027-04-01"}', 'https://www.lancaster.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","双非友好","低门槛","奖学金多"}', '兰卡数据科学，性价比高'),

('Newcastle University', '纽卡斯尔大学', 'MSc Computer Science', '计算机科学硕士', 'master', 'UK', 110, 'School of Computing', '1年', '£27,600/年', '{"ielts_min":6.5,"toefl_min":90}', 3.0, false, '{"round1":"2026-11-01","round2":"2027-03-01"}', 'https://www.ncl.ac.uk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","双非友好"}', '纽卡CS项目，双非友好'),

-- ===== 美国 (12个) =====
('Carnegie Mellon University', '卡内基梅隆大学', 'MISM - Master of Information Systems Management', '信息系统管理硕士', 'master', 'US', 52, 'Heinz College', '16个月', '$56,000/年', '{"toefl_min":100,"ielts_min":7.0}', 3.5, true, '{"round1":"2026-11-15","round2":"2027-01-15","round3":"2027-03-01"}', 'https://www.heinz.cmu.edu', '{"transcript","sop","cv","recommendation_3","toefl","gre"}', '{"stem","名校","IT","高门槛"}', 'CMU MISM项目，信息系统顶级项目'),

('Columbia University', '哥伦比亚大学', 'MS Computer Science', '计算机科学硕士', 'master', 'US', 23, 'Department of Computer Science', '1.5年', '$58,000/年', '{"toefl_min":101,"ielts_min":7.0}', 3.5, true, '{"round1":"2026-12-15","round2":"2027-02-15"}', 'https://www.cs.columbia.edu', '{"transcript","sop","cv","recommendation_3","toefl","gre"}', '{"stem","名校","高门槛"}', '哥大CS硕士，藤校光环'),

('New York University', '纽约大学', 'MS Data Science', '数据科学硕士', 'master', 'US', 38, 'Center for Data Science', '2年', '$52,000/年', '{"toefl_min":100,"ielts_min":7.0}', 3.3, true, '{"round1":"2026-12-01","round2":"2027-02-01"}', 'https://cds.nyu.edu', '{"transcript","sop","cv","recommendation_3","toefl","gre"}', '{"stem","名校","数据科学"}', 'NYU数据科学，纽约就业优势明显'),

('University of Southern California', '南加州大学', 'MS Computer Science', '计算机科学硕士', 'master', 'US', 116, 'Viterbi School of Engineering', '2年', '$48,000/年', '{"toefl_min":90,"ielts_min":6.5}', 3.2, true, '{"round1":"2026-12-15","round2":"2027-04-15"}', 'https://www.cs.usc.edu', '{"transcript","sop","cv","recommendation_3","toefl","gre"}', '{"stem","双非友好","热门"}', 'USC CS，对中国学生友好'),

('Northeastern University', '东北大学', 'MS Data Science', '数据科学硕士', 'master', 'US', 375, 'Khoury College of Computer Sciences', '2年', '$42,000/年', '{"toefl_min":90,"ielts_min":7.0}', 3.0, true, '{"round1":"2027-01-15","round2":"2027-04-15"}', 'https://www.khoury.northeastern.edu', '{"transcript","sop","cv","recommendation_3","toefl","gre"}', '{"stem","双非友好","co-op","低门槛"}', 'NEU数据科学，co-op项目就业率高'),

('University of Illinois Urbana-Champaign', '伊利诺伊大学厄巴纳-香槟分校', 'MS Computer Science', '计算机科学硕士', 'master', 'US', 64, 'Department of Computer Science', '2年', '$45,000/年', '{"toefl_min":96,"ielts_min":7.0}', 3.4, true, '{"round1":"2026-12-15","round2":"2027-01-15"}', 'https://cs.illinois.edu', '{"transcript","sop","cv","recommendation_3","toefl","gre"}', '{"stem","名校","CS强校"}', 'UIUC CS，美国CS顶级项目'),

('Georgia Institute of Technology', '佐治亚理工学院', 'MS Computer Science', '计算机科学硕士', 'master', 'US', 97, 'College of Computing', '2年', '$33,000/年', '{"toefl_min":90,"ielts_min":7.0}', 3.3, true, '{"round1":"2027-02-01"}', 'https://www.cc.gatech.edu', '{"transcript","sop","cv","recommendation_3","toefl","gre"}', '{"stem","性价比高","CS强校"}', 'GaTech CS，性价比极高'),

('University of Michigan', '密歇根大学', 'MS Information', '信息学硕士', 'master', 'US', 33, 'School of Information', '2年', '$52,000/年', '{"toefl_min":100,"ielts_min":7.0}', 3.4, false, '{"round1":"2027-01-15"}', 'https://www.si.umich.edu', '{"transcript","sop","cv","recommendation_3","toefl"}', '{"stem","名校","信息学"}', 'UMich信息学院，交叉学科强'),

('Boston University', '波士顿大学', 'MS Computer Science', '计算机科学硕士', 'master', 'US', 93, 'Department of Computer Science', '2年', '$46,000/年', '{"toefl_min":90,"ielts_min":7.0}', 3.0, true, '{"round1":"2027-01-15","round2":"2027-04-01"}', 'https://www.bu.edu/cs', '{"transcript","sop","cv","recommendation_3","toefl","gre"}', '{"stem","双非友好"}', 'BU CS，波士顿地区就业好'),

('University of California San Diego', '加州大学圣地亚哥分校', 'MS Computer Science and Engineering', '计算机科学与工程硕士', 'master', 'US', 62, 'Department of Computer Science and Engineering', '2年', '$44,000/年', '{"toefl_min":85,"ielts_min":7.0}', 3.3, true, '{"round1":"2026-12-15"}', 'https://cse.ucsd.edu', '{"transcript","sop","cv","recommendation_3","toefl","gre"}', '{"stem","名校","CS强校"}', 'UCSD CSE，加州系统名校'),

('Johns Hopkins University', '约翰霍普金斯大学', 'MSE Computer Science', '计算机科学工程硕士', 'master', 'US', 24, 'Whiting School of Engineering', '2年', '$55,000/年', '{"toefl_min":100,"ielts_min":7.0}', 3.3, true, '{"round1":"2027-01-15"}', 'https://www.cs.jhu.edu', '{"transcript","sop","cv","recommendation_3","toefl","gre"}', '{"stem","名校"}', 'JHU CS，研究型大学'),

('Syracuse University', '雪城大学', 'MS Computer Science', '计算机科学硕士', 'master', 'US', 651, 'College of Engineering and Computer Science', '2年', '$38,000/年', '{"toefl_min":80,"ielts_min":6.5}', 2.8, false, '{"round1":"2027-02-01","round2":"2027-05-01"}', 'https://www.syracuse.edu', '{"transcript","sop","cv","recommendation_2","toefl"}', '{"stem","双非友好","低门槛","保底"}', '雪城CS，保底选择'),

-- ===== 澳大利亚 (8个) =====
('University of Melbourne', '墨尔本大学', 'Master of Information Technology', '信息技术硕士', 'master', 'AU', 13, 'School of Computing and Information Systems', '2年', 'AUD $48,000/年', '{"ielts_min":6.5,"toefl_min":79}', 3.0, false, '{"round1":"2026-10-31","round2":"2027-04-30"}', 'https://study.unimelb.edu.au', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","名校","双非友好"}', '墨大IT，澳洲八大，对双非相对友好'),

('University of Sydney', '悉尼大学', 'Master of Data Science', '数据科学硕士', 'master', 'AU', 18, 'School of Computer Science', '2年', 'AUD $50,000/年', '{"ielts_min":7.0,"toefl_min":96}', 3.3, false, '{"round1":"2027-01-15","round2":"2027-06-25"}', 'https://www.sydney.edu.au', '{"transcript","sop","cv","ielts"}', '{"stem","名校"}', '悉尼大学数据科学，QS前20'),

('University of New South Wales', '新南威尔士大学', 'Master of Information Technology', '信息技术硕士', 'master', 'AU', 19, 'School of Computer Science and Engineering', '2年', 'AUD $47,000/年', '{"ielts_min":6.5,"toefl_min":90}', 3.0, false, '{"round1":"2026-11-30","round2":"2027-03-31"}', 'https://www.unsw.edu.au', '{"transcript","sop","cv","ielts"}', '{"stem","名校","双非友好"}', 'UNSW IT，工程强校'),

('Monash University', '莫纳什大学', 'Master of Data Science', '数据科学硕士', 'master', 'AU', 37, 'Faculty of Information Technology', '2年', 'AUD $45,000/年', '{"ielts_min":6.5,"toefl_min":79}', 2.8, false, '{"round1":"2026-11-30","round2":"2027-05-31"}', 'https://www.monash.edu', '{"transcript","sop","cv","ielts"}', '{"stem","双非友好","低门槛"}', '莫纳什数据科学，IT学院口碑好'),

('University of Queensland', '昆士兰大学', 'Master of Computer Science', '计算机科学硕士', 'master', 'AU', 40, 'School of Information Technology and Electrical Engineering', '2年', 'AUD $44,000/年', '{"ielts_min":6.5,"toefl_min":87}', 3.0, false, '{"round1":"2026-11-30","round2":"2027-05-31"}', 'https://www.uq.edu.au', '{"transcript","sop","cv","ielts"}', '{"stem","双非友好","性价比高"}', 'UQ CS，昆州就业市场稳定'),

('Australian National University', '澳大利亚国立大学', 'Master of Computing', '计算机硕士', 'master', 'AU', 30, 'School of Computing', '2年', 'AUD $47,000/年', '{"ielts_min":6.5,"toefl_min":80}', 3.0, false, '{"round1":"2027-01-15","round2":"2027-05-15"}', 'https://www.anu.edu.au', '{"transcript","sop","cv","ielts"}', '{"stem","名校","研究型"}', 'ANU计算机，研究型大学'),

('University of Adelaide', '阿德莱德大学', 'Master of Computer Science', '计算机科学硕士', 'master', 'AU', 89, 'School of Computer and Mathematical Sciences', '2年', 'AUD $42,000/年', '{"ielts_min":6.5,"toefl_min":79}', 2.8, false, '{"round1":"2026-12-01","round2":"2027-05-31"}', 'https://www.adelaide.edu.au', '{"transcript","sop","cv","ielts"}', '{"stem","双非友好","低门槛","移民加分"}', '阿德莱德CS，偏远地区移民加分'),

('University of Technology Sydney', '悉尼科技大学', 'Master of Information Technology', '信息技术硕士', 'master', 'AU', 88, 'Faculty of Engineering and Information Technology', '2年', 'AUD $39,000/年', '{"ielts_min":6.5,"toefl_min":79}', 2.7, false, '{"round1":"2026-11-30","round2":"2027-05-31"}', 'https://www.uts.edu.au', '{"transcript","sop","cv","ielts"}', '{"stem","双非友好","低门槛","性价比高"}', 'UTS IT，实用型项目'),

-- ===== 香港 (8个) =====
('University of Hong Kong', '香港大学', 'MSc Computer Science', '计算机科学硕士', 'master', 'HK', 17, 'Department of Computer Science', '1年', 'HKD 210,000', '{"ielts_min":6.0,"toefl_min":80}', 3.3, false, '{"round1":"2027-01-15"}', 'https://www.cs.hku.hk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","名校"}', '港大CS，亚洲顶尖'),

('Chinese University of Hong Kong', '香港中文大学', 'MSc Information Engineering', '信息工程硕士', 'master', 'HK', 36, 'Department of Information Engineering', '1年', 'HKD 185,000', '{"ielts_min":6.5,"toefl_min":79}', 3.2, false, '{"round1":"2027-01-15","round2":"2027-04-30"}', 'https://www.ie.cuhk.edu.hk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","双非友好"}', '港中文信息工程，对双非相对友好'),

('Hong Kong University of Science and Technology', '香港科技大学', 'MSc Big Data Technology', '大数据技术硕士', 'master', 'HK', 47, 'Department of Computer Science and Engineering', '1年', 'HKD 210,000', '{"ielts_min":6.5,"toefl_min":80}', 3.3, false, '{"round1":"2027-02-01"}', 'https://www.cse.ust.hk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","名校","大数据"}', '港科大大数据，技术导向'),

('City University of Hong Kong', '香港城市大学', 'MSc Computer Science', '计算机科学硕士', 'master', 'HK', 62, 'Department of Computer Science', '1年', 'HKD 168,000', '{"ielts_min":6.5,"toefl_min":79}', 3.0, false, '{"round1":"2027-01-31","round2":"2027-04-30"}', 'https://www.cs.cityu.edu.hk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","双非友好","性价比高"}', '城大CS，双非友好，性价比高'),

('Hong Kong Polytechnic University', '香港理工大学', 'MSc Information Technology', '信息技术硕士', 'master', 'HK', 57, 'Department of Computing', '1.5年', 'HKD 168,000', '{"ielts_min":6.0,"toefl_min":80}', 3.0, false, '{"round1":"2027-02-28","round2":"2027-04-30"}', 'https://www.comp.polyu.edu.hk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","双非友好","低门槛"}', '港理工IT，工程背景友好'),

('Hong Kong Baptist University', '香港浸会大学', 'MSc Data Analytics and Artificial Intelligence', '数据分析与AI硕士', 'master', 'HK', 252, 'Department of Computer Science', '1年', 'HKD 150,000', '{"ielts_min":6.0,"toefl_min":74}', 2.8, false, '{"round1":"2027-03-31","round2":"2027-05-31"}', 'https://www.comp.hkbu.edu.hk', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","双非友好","低门槛","保底"}', '浸大数据分析与AI，门槛低'),

('Lingnan University', '岭南大学', 'MSc Artificial Intelligence and Business Analytics', 'AI与商业分析硕士', 'master', 'HK', 711, 'School of Graduate Studies', '1年', 'HKD 130,000', '{"ielts_min":6.0,"toefl_min":72}', 2.7, false, '{"round1":"2027-04-30"}', 'https://www.ln.edu.hk', '{"transcript","sop","cv","ielts"}', '{"商科","AI","双非友好","低门槛","保底"}', '岭南AI商业分析，保底选择'),

('Education University of Hong Kong', '香港教育大学', 'MSc Artificial Intelligence and Educational Technology', 'AI与教育技术硕士', 'master', 'HK', 0, 'Department of Mathematics and Information Technology', '1年', 'HKD 120,000', '{"ielts_min":6.0,"toefl_min":72}', 2.7, false, '{"round1":"2027-03-31"}', 'https://www.eduhk.hk', '{"transcript","sop","cv","ielts"}', '{"教育","AI","双非友好","低门槛","保底"}', '教大AI教育技术，教育+AI交叉'),

-- ===== 新加坡 (7个) =====
('National University of Singapore', '新加坡国立大学', 'MSc Computer Science', '计算机科学硕士', 'master', 'SG', 8, 'School of Computing', '1.5年', 'SGD 45,000', '{"ielts_min":6.0,"toefl_min":85}', 3.5, true, '{"round1":"2027-01-15"}', 'https://www.comp.nus.edu.sg', '{"transcript","sop","cv","recommendation_2","ielts","gre"}', '{"stem","名校","高门槛"}', 'NUS CS，亚洲第一'),

('Nanyang Technological University', '南洋理工大学', 'MSc Computer Control and Automation', '计算机控制与自动化硕士', 'master', 'SG', 15, 'School of Electrical and Electronic Engineering', '1年', 'SGD 42,000', '{"ielts_min":6.5,"toefl_min":85}', 3.2, false, '{"round1":"2027-01-31"}', 'https://www.ntu.edu.sg', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","名校"}', 'NTU控制与自动化，工程强校'),

('Singapore Management University', '新加坡管理大学', 'Master of IT in Business', '商业信息技术硕士', 'master', 'SG', 545, 'School of Computing and Information Systems', '1年', 'SGD 48,000', '{"ielts_min":6.5,"toefl_min":85}', 3.0, false, '{"round1":"2027-03-31"}', 'https://www.smu.edu.sg', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"商科","IT","双非友好","就业强"}', 'SMU MITB，就业导向强'),

('Singapore University of Technology and Design', '新加坡科技设计大学', 'MSc Urban Science and Planning', '城市科学与规划硕士', 'master', 'SG', 0, 'Architecture and Sustainable Design', '1年', 'SGD 38,000', '{"ielts_min":6.5,"toefl_min":85}', 3.0, false, '{"round1":"2027-03-31"}', 'https://www.sutd.edu.sg', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"设计","双非友好"}', 'SUTD城市科学，MIT合作办学'),

('National University of Singapore', '新加坡国立大学', 'MSc Business Analytics', '商业分析硕士', 'master', 'SG', 8, 'School of Computing', '1年', 'SGD 50,000', '{"ielts_min":6.0,"toefl_min":85}', 3.4, true, '{"round1":"2027-01-15"}', 'https://msba.nus.edu.sg', '{"transcript","sop","cv","recommendation_2","ielts","gre"}', '{"商科","stem","名校"}', 'NUS商业分析，全球TOP项目'),

('Nanyang Technological University', '南洋理工大学', 'MSc Artificial Intelligence', 'AI硕士', 'master', 'SG', 15, 'School of Computer Science and Engineering', '1年', 'SGD 44,000', '{"ielts_min":6.5,"toefl_min":85}', 3.3, false, '{"round1":"2027-01-31"}', 'https://www.ntu.edu.sg/scse', '{"transcript","sop","cv","recommendation_2","ielts"}', '{"stem","AI","名校"}', 'NTU AI硕士，前沿方向'),

('Singapore Management University', '新加坡管理大学', 'MSc Applied Finance', '应用金融硕士', 'master', 'SG', 545, 'Lee Kong Chian School of Business', '1年', 'SGD 55,000', '{"ielts_min":6.5,"toefl_min":85}', 3.0, true, '{"round1":"2027-03-31"}', 'https://www.smu.edu.sg', '{"transcript","sop","cv","recommendation_2","ielts","gmat"}', '{"商科","金融","双非友好","就业强"}', 'SMU应用金融，CFA合作项目')

ON CONFLICT DO NOTHING;
