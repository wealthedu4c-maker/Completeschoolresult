import { GradeRange, DEFAULT_GRADE_RANGES } from "@shared/schema";

interface SubjectScore {
  subject: string;
  subjectId?: string;
  ca1: number;
  ca2: number;
  exam: number;
  total?: number;
  grade?: string;
  remark?: string;
}

export function getGradeAndRemark(
  total: number,
  gradeRanges?: GradeRange[] | null
): { grade: string; remark: string } {
  const ranges = gradeRanges && gradeRanges.length > 0 ? gradeRanges : DEFAULT_GRADE_RANGES;
  
  for (const range of ranges) {
    if (total >= range.minScore && total <= range.maxScore) {
      return { grade: range.grade, remark: range.remark };
    }
  }
  
  return { grade: "F", remark: "Fail" };
}

export function calculateResults(
  subjects: SubjectScore[],
  gradeRanges?: GradeRange[] | null
): {
  subjects: SubjectScore[];
  totalScore: number;
  averageScore: number;
} {
  let totalScore = 0;

  const calculatedSubjects = subjects.map((subject) => {
    const total = (subject.ca1 || 0) + (subject.ca2 || 0) + (subject.exam || 0);
    const { grade, remark } = getGradeAndRemark(total, gradeRanges);

    totalScore += total;

    return {
      ...subject,
      total,
      grade,
      remark,
    };
  });

  const averageScore = subjects.length > 0 
    ? parseFloat((totalScore / subjects.length).toFixed(2)) 
    : 0;

  return {
    subjects: calculatedSubjects,
    totalScore,
    averageScore,
  };
}

export function generatePIN(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pin = "";
  
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) {
      pin += "-";
    }
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return pin;
}
