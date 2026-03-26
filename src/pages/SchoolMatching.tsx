import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  DollarSign,
  Award,
} from "lucide-react";

interface School {
  id: string;
  name: string;
  program: string;
  country: string;
  probability: number;
  qsRanking: number;
  tuition: string;
  advantages: string[];
  disadvantages: string[];
  deadline: string;
  materials: string[];
  link: string;
}

const mockSchools: School[] = [
  { id: "1", name: "斯坦福大学", program: "MS Computer Science", country: "美国", probability: 18, qsRanking: 3, tuition: "$57,861/年", advantages: ["顶尖CS项目", "硅谷资源"], disadvantages: ["竞争极激烈", "高生活成本"], deadline: "2025-12-01", materials: ["成绩单", "PS", "3封推荐信", "GRE"], link: "#" },
  { id: "2", name: "MIT", program: "MS Data Science", country: "美国", probability: 22, qsRanking: 1, tuition: "$55,878/年", advantages: ["数据科学领先", "产业合作"], disadvantages: ["录取率极低"], deadline: "2025-12-15", materials: ["成绩单", "PS", "CV", "3封推荐信"], link: "#" },
  { id: "3", name: "帝国理工学院", program: "MSc Computing", country: "英国", probability: 35, qsRanking: 6, tuition: "£38,900/年", advantages: ["英国顶尖理工", "伦敦位置"], disadvantages: ["学制1年紧凑"], deadline: "2025-01-15", materials: ["成绩单", "PS", "2封推荐信"], link: "#" },
  { id: "4", name: "UCL", program: "MSc Data Science", country: "英国", probability: 45, qsRanking: 9, tuition: "£35,000/年", advantages: ["G5院校", "就业率高"], disadvantages: ["申请人数多"], deadline: "2025-03-01", materials: ["成绩单", "PS", "2封推荐信"], link: "#" },
  { id: "5", name: "香港大学", program: "MSc Computer Science", country: "中国香港", probability: 52, qsRanking: 26, tuition: "HK$198,000/年", advantages: ["离家近", "性价比高"], disadvantages: ["项目规模小"], deadline: "2025-01-31", materials: ["成绩单", "PS", "2封推荐信"], link: "#" },
  { id: "6", name: "新加坡国立大学", program: "MSc Business Analytics", country: "新加坡", probability: 55, qsRanking: 8, tuition: "S$58,000/年", advantages: ["亚洲第一", "就业强"], disadvantages: ["生活成本高"], deadline: "2025-03-15", materials: ["成绩单", "PS", "CV", "2封推荐信", "GMAT"], link: "#" },
  { id: "7", name: "爱丁堡大学", program: "MSc Data Science", country: "英国", probability: 62, qsRanking: 22, tuition: "£36,700/年", advantages: ["AI研究强", "苏格兰签证"], disadvantages: ["天气较差"], deadline: "2025-04-01", materials: ["成绩单", "PS", "2封推荐信"], link: "#" },
  { id: "8", name: "香港中文大学", program: "MSc Finance", country: "中国香港", probability: 68, qsRanking: 36, tuition: "HK$270,000/年", advantages: ["金融专业强", "中英文双语"], disadvantages: ["竞争加大"], deadline: "2025-02-28", materials: ["成绩单", "PS", "CV", "GMAT"], link: "#" },
  { id: "9", name: "曼彻斯特大学", program: "MSc Data Science", country: "英国", probability: 75, qsRanking: 32, tuition: "£32,000/年", advantages: ["性价比高", "认可度高"], disadvantages: ["排名波动"], deadline: "2025-06-30", materials: ["成绩单", "PS", "2封推荐信"], link: "#" },
  { id: "10", name: "悉尼大学", program: "Master of Data Science", country: "澳大利亚", probability: 82, qsRanking: 19, tuition: "A$50,000/年", advantages: ["录取友好", "可PSW签证"], disadvantages: ["学制2年"], deadline: "2025-07-31", materials: ["成绩单", "PS", "CV"], link: "#" },
];

const categories = [
  { title: "冲刺校", range: "15-40%", color: "warning", filter: (p: number) => p < 40 },
  { title: "匹配校", range: "40-70%", color: "info", filter: (p: number) => p >= 40 && p < 70 },
  { title: "保底校", range: "70%+", color: "purple", filter: (p: number) => p >= 70 },
] as const;

function SchoolCard({ school }: { school: School }) {
  const [expanded, setExpanded] = useState(false);
  const probColor =
    school.probability < 40
      ? "text-warning"
      : school.probability < 70
      ? "text-info"
      : "text-success";

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-sm">{school.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{school.program}</p>
          </div>
          <span className={`text-lg font-bold ${probColor}`}>{school.probability}%</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{school.country}</span>
          <span className="flex items-center gap-1"><Award className="w-3 h-3" />QS #{school.qsRanking}</span>
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{school.tuition}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {school.advantages.map((a) => (
            <Badge key={a} variant="secondary" className="text-xs bg-success/10 text-success border-0">{a}</Badge>
          ))}
          {school.disadvantages.map((d) => (
            <Badge key={d} variant="secondary" className="text-xs bg-destructive/10 text-destructive border-0">{d}</Badge>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
          {expanded ? "收起详情" : "展开详情"}
        </Button>

        {expanded && (
          <div className="space-y-3 pt-2 border-t border-border animate-message-in">
            <div className="text-xs space-y-1">
              <p><span className="text-muted-foreground">截止日期：</span>{school.deadline}</p>
              <p><span className="text-muted-foreground">所需材料：</span>{school.materials.join("、")}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-xs">加入申请列表</Button>
              <Button size="sm" variant="outline" className="text-xs" asChild>
                <a href={school.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-1" />官网
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SchoolMatching() {
  const totalSchools = mockSchools.length;
  const avgProb = Math.round(mockSchools.reduce((s, c) => s + c.probability, 0) / totalSchools);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">综合竞争力得分</p>
              <p className="text-2xl font-bold">78<span className="text-sm text-muted-foreground font-normal">/100</span></p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">匹配项目数</p>
              <p className="text-2xl font-bold">{totalSchools}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-purple/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">平均录取概率</p>
              <p className="text-2xl font-bold">{avgProb}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const schools = mockSchools.filter((s) => cat.filter(s.probability));
          const headerColor =
            cat.color === "warning"
              ? "bg-warning/10 text-warning"
              : cat.color === "info"
              ? "bg-primary/10 text-primary"
              : "bg-purple/10 text-purple";

          return (
            <div key={cat.title} className="space-y-3">
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${headerColor}`}>
                <span className="font-semibold text-sm">{cat.title}</span>
                <Badge variant="secondary" className="text-xs">{cat.range}</Badge>
              </div>
              <div className="space-y-3">
                {schools.map((s) => (
                  <SchoolCard key={s.id} school={s} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
