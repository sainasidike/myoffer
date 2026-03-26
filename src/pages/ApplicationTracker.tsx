import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, FileText, Download } from "lucide-react";

type AppStatus = "进行中" | "已提交" | "已录取" | "已拒绝";

interface Application {
  id: string;
  school: string;
  program: string;
  status: AppStatus;
  deadline: string;
  materials: { name: string; done: boolean; docType?: string }[];
}

const statusColors: Record<AppStatus, string> = {
  进行中: "bg-primary/10 text-primary",
  已提交: "bg-warning/10 text-warning",
  已录取: "bg-success/10 text-success",
  已拒绝: "bg-destructive/10 text-destructive",
};

const mockApps: Application[] = [
  {
    id: "1", school: "UCL", program: "MSc Data Science", status: "进行中",
    deadline: "2025-03-01",
    materials: [
      { name: "成绩单", done: true },
      { name: "PS动机信", done: false, docType: "PS" },
      { name: "CV简历", done: false, docType: "CV" },
      { name: "推荐信 x2", done: false, docType: "推荐信" },
    ],
  },
  {
    id: "2", school: "香港大学", program: "MSc Computer Science", status: "进行中",
    deadline: "2025-01-31",
    materials: [
      { name: "成绩单", done: true },
      { name: "PS动机信", done: true, docType: "PS" },
      { name: "推荐信 x2", done: false, docType: "推荐信" },
    ],
  },
  {
    id: "3", school: "爱丁堡大学", program: "MSc Data Science", status: "已提交",
    deadline: "2025-04-01",
    materials: [
      { name: "成绩单", done: true },
      { name: "PS动机信", done: true, docType: "PS" },
      { name: "推荐信 x2", done: true, docType: "推荐信" },
    ],
  },
  {
    id: "4", school: "曼彻斯特大学", program: "MSc Data Science", status: "已录取",
    deadline: "2025-06-30",
    materials: [
      { name: "成绩单", done: true },
      { name: "PS动机信", done: true, docType: "PS" },
      { name: "推荐信 x2", done: true, docType: "推荐信" },
    ],
  },
];

export default function ApplicationTracker() {
  const [filter, setFilter] = useState("全部");
  const navigate = useNavigate();

  const filtered =
    filter === "全部"
      ? mockApps
      : mockApps.filter((a) => a.status === filter);

  const isUrgent = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">申请管家</h1>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          导出全部
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="全部">全部</TabsTrigger>
          <TabsTrigger value="进行中">进行中</TabsTrigger>
          <TabsTrigger value="已提交">已提交</TabsTrigger>
          <TabsTrigger value="已录取">已录取</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((app) => {
          const doneCt = app.materials.filter((m) => m.done).length;
          const totalCt = app.materials.length;
          const pct = Math.round((doneCt / totalCt) * 100);

          return (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{app.school}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{app.program}</p>
                  </div>
                  <Badge className={`${statusColors[app.status]} border-0 text-xs`}>
                    {app.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className={isUrgent(app.deadline) ? "text-destructive font-medium" : "text-muted-foreground"}>
                    截止：{app.deadline}
                    {isUrgent(app.deadline) && " ⚠️ 即将截止"}
                  </span>
                </div>

                <div className="space-y-2">
                  {app.materials.map((mat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={mat.done} disabled />
                        <span className={`text-sm ${mat.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {mat.name}
                        </span>
                      </div>
                      {!mat.done && mat.docType && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary h-7"
                          onClick={() => navigate("/essays")}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          去撰写
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>材料进度</span>
                    <span>{doneCt}/{totalCt}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
