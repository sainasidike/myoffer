-- programs_v2.sql — 为 50 个已有项目填充新列数据
-- 新列: field, program_type, avg_score, require_lang, living_cost, scholarship, rolling_admission, prestige, accept_list, notes
-- 使用 WHERE university_name + program_name 定位行

-- ===== 英国 (15个) =====

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 82.0,
  living_cost = '£14,000/年',
  scholarship = '[{"name":"Informatics Global Scholarship","amount":"£5,000"},{"name":"Edinburgh Global Research Scholarship","amount":"学费减免25%"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = '["985","211"]'::jsonb,
  notes = '信息学院旗舰项目，QS前25，偏好985/211背景，重视科研经历和编程能力'
WHERE university_name = 'University of Edinburgh' AND program_name = 'MSc Computer Science';

UPDATE programs SET
  field = '数据科学',
  program_type = '授课型',
  avg_score = 78.0,
  living_cost = '£12,500/年',
  scholarship = '[{"name":"CS Department Scholarship","amount":"£3,000"},{"name":"Manchester Global Excellence Award","amount":"£5,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 4,
  accept_list = '["985","211"]'::jsonb,
  notes = '对双非学生相对友好，均分要求不算高，就业数据好，曼城生活成本适中'
WHERE university_name = 'University of Manchester' AND program_name = 'MSc Data Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 75.0,
  living_cost = '£12,000/年',
  scholarship = '[{"name":"Think Big Scholarship","amount":"£5,000"},{"name":"Bristol CS Bursary","amount":"£2,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 4,
  accept_list = null,
  notes = '不卡学校背景，对双非友好，课程设置全面，实践项目多'
WHERE university_name = 'University of Bristol' AND program_name = 'MSc Computer Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 72.0,
  living_cost = '£12,000/年',
  scholarship = '[{"name":"Excellence Scholarship","amount":"£5,000"},{"name":"College of Science & Engineering Scholarship","amount":"£3,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 3,
  accept_list = null,
  notes = '对双非学生非常友好，GPA门槛低，适合转专业学生，苏格兰生活成本低'
WHERE university_name = 'University of Glasgow' AND program_name = 'MSc Software Development';

UPDATE programs SET
  field = '商科',
  program_type = '授课型',
  avg_score = 74.0,
  living_cost = '£12,000/年',
  scholarship = '[{"name":"Business School Scholarship","amount":"£3,000"},{"name":"Leeds Global Scholarship","amount":"£5,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 3,
  accept_list = null,
  notes = '利兹商学院就业导向强，偏好有工作经验的申请者，对中国学生友好'
WHERE university_name = 'University of Leeds' AND program_name = 'MSc Business Analytics';

UPDATE programs SET
  field = '金融',
  program_type = '授课型',
  avg_score = 70.0,
  living_cost = '£11,500/年',
  scholarship = '[{"name":"Management School International Scholarship","amount":"£2,500"},{"name":"Sheffield Excellence Award","amount":"£3,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 3,
  accept_list = null,
  notes = '双非友好，门槛低，管理学院教学质量好，生活成本低性价比高'
WHERE university_name = 'University of Sheffield' AND program_name = 'MSc Finance';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 76.0,
  living_cost = '£12,500/年',
  scholarship = '[{"name":"School of CS Scholarship","amount":"£3,000"},{"name":"Birmingham Global Scholarship","amount":"£5,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 3,
  accept_list = null,
  notes = 'AI方向前沿，课程含深度学习和NLP实战，适合有编程基础的学生'
WHERE university_name = 'University of Birmingham' AND program_name = 'MSc Artificial Intelligence and Machine Learning';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 73.0,
  living_cost = '£12,000/年',
  scholarship = '[{"name":"ECS Partnership Scholarship","amount":"£3,000"},{"name":"Southampton Academic Excellence Award","amount":"£2,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 3,
  accept_list = null,
  notes = 'ECS学院英国CS排名靠前，双非友好，科研氛围好，课程偏理论'
WHERE university_name = 'University of Southampton' AND program_name = 'MSc Computer Science';

UPDATE programs SET
  field = '数据科学',
  program_type = '授课型',
  avg_score = 71.0,
  living_cost = '£11,500/年',
  scholarship = '[{"name":"Developing Solutions Scholarship","amount":"学费全免"},{"name":"CS International Scholarship","amount":"£2,500"}]'::jsonb,
  rolling_admission = false,
  prestige = 3,
  accept_list = null,
  notes = '双非友好选择，Developing Solutions奖学金覆盖全额学费，生活成本低'
WHERE university_name = 'University of Nottingham' AND program_name = 'MSc Data Science';

UPDATE programs SET
  field = '数据科学',
  program_type = '授课型',
  avg_score = 80.0,
  living_cost = '£15,000/年',
  scholarship = '[{"name":"KCL International Scholarship","amount":"£4,000"},{"name":"Informatics Department Award","amount":"£3,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 4,
  accept_list = '["985","211"]'::jsonb,
  notes = '伦敦核心地段，地理位置优越，就业资源丰富，对中国学生友好'
WHERE university_name = 'King''s College London' AND program_name = 'MSc Data Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 86.0,
  living_cost = '£15,000/年',
  scholarship = '[{"name":"UCL CS Department Scholarship","amount":"£5,000"},{"name":"Overseas Research Scholarship","amount":"学费减免50%"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = '["985","211"]'::jsonb,
  notes = 'G5名校，机器学习方向世界顶级，重视科研背景，建议有论文发表'
WHERE university_name = 'University College London' AND program_name = 'MSc Machine Learning';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 88.0,
  living_cost = '£15,000/年',
  scholarship = '[{"name":"Imperial President''s PhD Scholarship","amount":"全额"},{"name":"Department of Computing Award","amount":"£5,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = '["985","211"]'::jsonb,
  notes = 'G5名校，计算机系全球顶尖，门槛极高，偏好985背景+强科研'
WHERE university_name = 'Imperial College London' AND program_name = 'MSc Computing';

UPDATE programs SET
  field = '商科',
  program_type = '授课型',
  avg_score = 78.0,
  living_cost = '£13,000/年',
  scholarship = '[{"name":"WBS Scholarship","amount":"£5,000"},{"name":"Warwick Graduate Award","amount":"£3,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 4,
  accept_list = null,
  notes = '英国顶尖商学院，商业分析全英领先，偏好有量化背景的申请者'
WHERE university_name = 'University of Warwick' AND program_name = 'MSc Business Analytics';

UPDATE programs SET
  field = '数据科学',
  program_type = '授课型',
  avg_score = 68.0,
  living_cost = '£11,000/年',
  scholarship = '[{"name":"Lancaster Global Scholarship","amount":"£5,000"},{"name":"SCC Department Bursary","amount":"£2,000"},{"name":"International Excellence Award","amount":"£3,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 2,
  accept_list = null,
  notes = '性价比极高，奖学金机会多，双非友好，生活成本全英最低之一'
WHERE university_name = 'Lancaster University' AND program_name = 'MSc Data Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 70.0,
  living_cost = '£11,500/年',
  scholarship = '[{"name":"Newcastle International Scholarship","amount":"£3,000"},{"name":"Computing Departmental Award","amount":"£2,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 3,
  accept_list = null,
  notes = '双非友好，纽卡斯尔生活成本低，CS项目实用性强'
WHERE university_name = 'Newcastle University' AND program_name = 'MSc Computer Science';

-- ===== 美国 (12个) =====

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 85.0,
  living_cost = '$24,000/年',
  scholarship = '[{"name":"Heinz Merit Scholarship","amount":"$10,000-$20,000"},{"name":"Dean''s Fellowship","amount":"$15,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = null,
  notes = 'CMU信息系统顶级项目，就业数据极好，重视GRE和实习经历，对中国学生友好'
WHERE university_name = 'Carnegie Mellon University' AND program_name = 'MISM - Master of Information Systems Management';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 87.0,
  living_cost = '$28,000/年',
  scholarship = '[{"name":"CS Department Fellowship","amount":"$10,000"},{"name":"Columbia Engineering Scholarship","amount":"$15,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = null,
  notes = '藤校光环，纽约核心就业资源，CS项目竞争激烈，重视科研和GRE'
WHERE university_name = 'Columbia University' AND program_name = 'MS Computer Science';

UPDATE programs SET
  field = '数据科学',
  program_type = '授课型',
  avg_score = 84.0,
  living_cost = '$28,000/年',
  scholarship = '[{"name":"CDS Fellowship","amount":"$15,000"},{"name":"NYU Graduate Scholarship","amount":"$10,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = null,
  notes = '纽约就业优势明显，数据科学中心全美顶尖，偏好有量化和编程背景'
WHERE university_name = 'New York University' AND program_name = 'MS Data Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 76.0,
  living_cost = '$22,000/年',
  scholarship = '[{"name":"Viterbi Graduate Fellowship","amount":"$10,000"},{"name":"USC Merit Scholarship","amount":"$5,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 3,
  accept_list = null,
  notes = '对中国学生友好，洛杉矶就业市场大，Viterbi工学院声誉好，双非可冲'
WHERE university_name = 'University of Southern California' AND program_name = 'MS Computer Science';

UPDATE programs SET
  field = '数据科学',
  program_type = 'Co-op',
  avg_score = 68.0,
  living_cost = '$22,000/年',
  scholarship = '[{"name":"Khoury College Scholarship","amount":"$5,000"},{"name":"Dean''s Scholarship","amount":"$8,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 2,
  accept_list = null,
  notes = 'Co-op含实习项目，就业率极高，双非友好门槛低，波士顿就业资源丰富'
WHERE university_name = 'Northeastern University' AND program_name = 'MS Data Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 85.0,
  living_cost = '$20,000/年',
  scholarship = '[{"name":"CS Department Fellowship","amount":"$12,000"},{"name":"Graduate College Fellowship","amount":"$10,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 4,
  accept_list = null,
  notes = '美国CS Top 5，重视科研背景，GRE成绩重要，生活成本低性价比高'
WHERE university_name = 'University of Illinois Urbana-Champaign' AND program_name = 'MS Computer Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 83.0,
  living_cost = '$20,000/年',
  scholarship = '[{"name":"College of Computing Fellowship","amount":"$8,000"},{"name":"GaTech Graduate Scholarship","amount":"$5,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 4,
  accept_list = null,
  notes = '性价比极高，公立大学学费低，CS排名全美Top 10，就业数据好'
WHERE university_name = 'Georgia Institute of Technology' AND program_name = 'MS Computer Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 82.0,
  living_cost = '$24,000/年',
  scholarship = '[{"name":"SI Merit Scholarship","amount":"$10,000"},{"name":"Rackham Graduate Fellowship","amount":"$15,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = null,
  notes = '信息学院交叉学科强，不要求GRE，偏好有工作经验的申请者'
WHERE university_name = 'University of Michigan' AND program_name = 'MS Information';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 74.0,
  living_cost = '$24,000/年',
  scholarship = '[{"name":"CS Department Scholarship","amount":"$5,000"},{"name":"BU Graduate Award","amount":"$3,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 3,
  accept_list = null,
  notes = '波士顿地区就业好，双非友好，课程设置实用，实习机会多'
WHERE university_name = 'Boston University' AND program_name = 'MS Computer Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 84.0,
  living_cost = '$22,000/年',
  scholarship = '[{"name":"CSE Department Fellowship","amount":"$10,000"},{"name":"Jacobs School Scholarship","amount":"$8,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 4,
  accept_list = null,
  notes = '加州系统名校，圣地亚哥科技产业发达，CSE排名全美前列'
WHERE university_name = 'University of California San Diego' AND program_name = 'MS Computer Science and Engineering';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 83.0,
  living_cost = '$24,000/年',
  scholarship = '[{"name":"Whiting School Fellowship","amount":"$12,000"},{"name":"CS Department Award","amount":"$8,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = null,
  notes = '研究型大学，重视科研背景，适合想继续读博的学生'
WHERE university_name = 'Johns Hopkins University' AND program_name = 'MSE Computer Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 62.0,
  living_cost = '$20,000/年',
  scholarship = '[{"name":"Graduate Assistantship","amount":"学费减免50%"},{"name":"International Student Award","amount":"$5,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 1,
  accept_list = null,
  notes = '保底选择，门槛低双非友好，不要求GRE，滚动录取窗口长'
WHERE university_name = 'Syracuse University' AND program_name = 'MS Computer Science';

-- ===== 澳大利亚 (8个) =====

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 78.0,
  living_cost = 'AUD 24,000/年',
  scholarship = '[{"name":"Melbourne Graduate Scholarship","amount":"AUD 10,000"},{"name":"Faculty of Engineering IT Scholarship","amount":"AUD 5,000"}]'::jsonb,
  rolling_admission = true,
  prestige = 5,
  accept_list = null,
  notes = '澳洲八大之首，对双非相对友好，两年制可拿PSW工签，墨尔本就业好'
WHERE university_name = 'University of Melbourne' AND program_name = 'Master of Information Technology';

UPDATE programs SET
  field = '数据科学',
  program_type = '授课型',
  avg_score = 77.0,
  living_cost = 'AUD 26,000/年',
  scholarship = '[{"name":"Sydney Scholars Award","amount":"AUD 10,000"},{"name":"International Scholarship","amount":"AUD 6,000"}]'::jsonb,
  rolling_admission = true,
  prestige = 5,
  accept_list = null,
  notes = 'QS前20，数据科学方向强，悉尼就业市场大，两年制可拿工签'
WHERE university_name = 'University of Sydney' AND program_name = 'Master of Data Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 76.0,
  living_cost = 'AUD 25,000/年',
  scholarship = '[{"name":"UNSW International Scientia Scholarship","amount":"学费全免+生活费"},{"name":"Engineering Faculty Award","amount":"AUD 5,000"}]'::jsonb,
  rolling_admission = true,
  prestige = 5,
  accept_list = null,
  notes = '工程强校，对双非友好，三学期制灵活入学，悉尼就业资源丰富'
WHERE university_name = 'University of New South Wales' AND program_name = 'Master of Information Technology';

UPDATE programs SET
  field = '数据科学',
  program_type = '授课型',
  avg_score = 72.0,
  living_cost = 'AUD 24,000/年',
  scholarship = '[{"name":"Monash International Merit Scholarship","amount":"AUD 10,000"},{"name":"IT Faculty Scholarship","amount":"AUD 5,000"}]'::jsonb,
  rolling_admission = true,
  prestige = 4,
  accept_list = null,
  notes = '双非友好门槛低，IT学院口碑好，墨尔本就业选择多'
WHERE university_name = 'Monash University' AND program_name = 'Master of Data Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 73.0,
  living_cost = 'AUD 22,000/年',
  scholarship = '[{"name":"UQ International Scholarship","amount":"AUD 10,000"},{"name":"ITEE Faculty Award","amount":"AUD 5,000"}]'::jsonb,
  rolling_admission = true,
  prestige = 4,
  accept_list = null,
  notes = '性价比高，昆州生活成本低，就业市场稳定，双非友好'
WHERE university_name = 'University of Queensland' AND program_name = 'Master of Computer Science';

UPDATE programs SET
  field = 'CS',
  program_type = '研究型',
  avg_score = 75.0,
  living_cost = 'AUD 22,000/年',
  scholarship = '[{"name":"ANU International Research Scholarship","amount":"学费全免+生活费"},{"name":"Computing Research Award","amount":"AUD 8,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 4,
  accept_list = null,
  notes = '研究型大学，重视科研背景，适合想继续读博的学生，堪培拉生活安静'
WHERE university_name = 'Australian National University' AND program_name = 'Master of Computing';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 68.0,
  living_cost = 'AUD 22,000/年',
  scholarship = '[{"name":"Adelaide Global Academic Excellence Scholarship","amount":"学费减免15-30%"},{"name":"CAMS Department Award","amount":"AUD 5,000"}]'::jsonb,
  rolling_admission = true,
  prestige = 3,
  accept_list = null,
  notes = '偏远地区移民加分，双非友好门槛低，性价比极高，适合移民规划'
WHERE university_name = 'University of Adelaide' AND program_name = 'Master of Computer Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 65.0,
  living_cost = 'AUD 24,000/年',
  scholarship = '[{"name":"UTS International Scholarship","amount":"AUD 5,000"},{"name":"FEIT Scholarship","amount":"AUD 3,000"}]'::jsonb,
  rolling_admission = true,
  prestige = 3,
  accept_list = null,
  notes = '实用型项目，双非友好，悉尼就业便利，门槛低性价比高'
WHERE university_name = 'University of Technology Sydney' AND program_name = 'Master of Information Technology';

-- ===== 香港 (8个) =====

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 82.0,
  living_cost = 'HKD 100,000/年',
  scholarship = '[{"name":"HKU CS Postgraduate Scholarship","amount":"HKD 50,000"},{"name":"HKU Foundation Scholarship","amount":"学费减免50%"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = null,
  notes = '亚洲顶尖，对中国学生友好，香港就业资源丰富，一年制高效'
WHERE university_name = 'University of Hong Kong' AND program_name = 'MSc Computer Science';

UPDATE programs SET
  field = 'EE',
  program_type = '授课型',
  avg_score = 78.0,
  living_cost = 'HKD 90,000/年',
  scholarship = '[{"name":"CUHK Postgraduate Scholarship","amount":"HKD 40,000"},{"name":"IE Department Award","amount":"HKD 20,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 4,
  accept_list = null,
  notes = '对双非相对友好，信息工程方向实用性强，深圳就业方便'
WHERE university_name = 'Chinese University of Hong Kong' AND program_name = 'MSc Information Engineering';

UPDATE programs SET
  field = '数据科学',
  program_type = '授课型',
  avg_score = 80.0,
  living_cost = 'HKD 100,000/年',
  scholarship = '[{"name":"HKUST Postgraduate Scholarship","amount":"HKD 50,000"},{"name":"CSE Department Fellowship","amount":"HKD 30,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 4,
  accept_list = null,
  notes = '技术导向，大数据方向就业强，对中国学生友好，清水湾环境好'
WHERE university_name = 'Hong Kong University of Science and Technology' AND program_name = 'MSc Big Data Technology';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 74.0,
  living_cost = 'HKD 85,000/年',
  scholarship = '[{"name":"CityU Scholarship for Outstanding Students","amount":"HKD 30,000"},{"name":"CS Department Award","amount":"HKD 15,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 4,
  accept_list = null,
  notes = '双非友好，性价比高，九龙塘交通便利，对中国学生友好'
WHERE university_name = 'City University of Hong Kong' AND program_name = 'MSc Computer Science';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 72.0,
  living_cost = 'HKD 85,000/年',
  scholarship = '[{"name":"PolyU Postgraduate Scholarship","amount":"HKD 25,000"},{"name":"Computing Department Award","amount":"HKD 15,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 4,
  accept_list = null,
  notes = '工程背景友好，IT项目实用性强，红磡地段好，双非可申'
WHERE university_name = 'Hong Kong Polytechnic University' AND program_name = 'MSc Information Technology';

UPDATE programs SET
  field = '数据科学',
  program_type = '授课型',
  avg_score = 66.0,
  living_cost = 'HKD 80,000/年',
  scholarship = '[{"name":"HKBU Postgraduate Scholarship","amount":"HKD 20,000"},{"name":"CS Department Bursary","amount":"HKD 10,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 2,
  accept_list = null,
  notes = '门槛低双非友好，保底选择，数据分析与AI方向实用'
WHERE university_name = 'Hong Kong Baptist University' AND program_name = 'MSc Data Analytics and Artificial Intelligence';

UPDATE programs SET
  field = '商科',
  program_type = '授课型',
  avg_score = 60.0,
  living_cost = 'HKD 80,000/年',
  scholarship = '[{"name":"Lingnan Postgraduate Scholarship","amount":"HKD 15,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 1,
  accept_list = null,
  notes = '保底选择，门槛最低，AI商业分析方向，适合背景一般的学生'
WHERE university_name = 'Lingnan University' AND program_name = 'MSc Artificial Intelligence and Business Analytics';

UPDATE programs SET
  field = '教育',
  program_type = '授课型',
  avg_score = 58.0,
  living_cost = 'HKD 80,000/年',
  scholarship = '[{"name":"EdUHK Postgraduate Scholarship","amount":"HKD 15,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 1,
  accept_list = null,
  notes = '教育+AI交叉方向，门槛低保底选择，适合教育背景学生转型'
WHERE university_name = 'Education University of Hong Kong' AND program_name = 'MSc Artificial Intelligence and Educational Technology';

-- ===== 新加坡 (7个) =====

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 86.0,
  living_cost = 'SGD 18,000/年',
  scholarship = '[{"name":"NUS Graduate Research Scholarship","amount":"学费全免+生活费"},{"name":"SoC Dean''s Graduate Scholarship","amount":"SGD 10,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = null,
  notes = '亚洲第一CS项目，重视科研和GRE，对中国学生友好，新加坡就业资源顶级'
WHERE university_name = 'National University of Singapore' AND program_name = 'MSc Computer Science';

UPDATE programs SET
  field = 'EE',
  program_type = '授课型',
  avg_score = 80.0,
  living_cost = 'SGD 17,000/年',
  scholarship = '[{"name":"NTU Research Scholarship","amount":"学费全免+生活费"},{"name":"EEE Department Award","amount":"SGD 5,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = null,
  notes = '工程强校，控制与自动化方向顶尖，对中国学生友好'
WHERE university_name = 'Nanyang Technological University' AND program_name = 'MSc Computer Control and Automation';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 72.0,
  living_cost = 'SGD 18,000/年',
  scholarship = '[{"name":"SMU Merit Scholarship","amount":"SGD 8,000"},{"name":"SCIS Scholarship","amount":"SGD 5,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 3,
  accept_list = null,
  notes = '就业导向强，新加坡金融中心地段，MITB项目偏商业应用，对中国学生友好'
WHERE university_name = 'Singapore Management University' AND program_name = 'Master of IT in Business';

UPDATE programs SET
  field = '设计',
  program_type = '授课型',
  avg_score = 70.0,
  living_cost = 'SGD 16,000/年',
  scholarship = '[{"name":"SUTD Graduate Scholarship","amount":"SGD 10,000"},{"name":"MIT-SUTD Research Award","amount":"SGD 8,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 3,
  accept_list = null,
  notes = 'MIT合作办学，设计思维+科技融合，双非友好，小班教学'
WHERE university_name = 'Singapore University of Technology and Design' AND program_name = 'MSc Urban Science and Planning';

UPDATE programs SET
  field = '商科',
  program_type = '授课型',
  avg_score = 85.0,
  living_cost = 'SGD 18,000/年',
  scholarship = '[{"name":"NUS MSBA Scholarship","amount":"SGD 15,000"},{"name":"SoC Industry Scholarship","amount":"SGD 10,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = null,
  notes = '全球TOP商业分析项目，偏好有工作经验的申请者，就业数据极好'
WHERE university_name = 'National University of Singapore' AND program_name = 'MSc Business Analytics';

UPDATE programs SET
  field = 'CS',
  program_type = '授课型',
  avg_score = 82.0,
  living_cost = 'SGD 17,000/年',
  scholarship = '[{"name":"NTU AI Research Scholarship","amount":"学费全免"},{"name":"SCSE Department Award","amount":"SGD 5,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 5,
  accept_list = null,
  notes = 'AI前沿方向，NTU计算机学院实力强，对中国学生友好，重视编程能力'
WHERE university_name = 'Nanyang Technological University' AND program_name = 'MSc Artificial Intelligence';

UPDATE programs SET
  field = '金融',
  program_type = '授课型',
  avg_score = 74.0,
  living_cost = 'SGD 20,000/年',
  scholarship = '[{"name":"SMU Financial Aid","amount":"SGD 8,000"},{"name":"Lee Kong Chian Scholarship","amount":"SGD 10,000"}]'::jsonb,
  rolling_admission = false,
  prestige = 3,
  accept_list = null,
  notes = 'CFA合作项目，就业导向强，新加坡金融中心优势，双非友好'
WHERE university_name = 'Singapore Management University' AND program_name = 'MSc Applied Finance';
